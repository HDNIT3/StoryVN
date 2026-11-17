import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { DateRangeQueryDto } from '../../../common/dto/date-range.dto.js';
import { dateRangeMatch, resolveDateRange } from '../../../common/utils/date-range.util.js';
import { QueryReportsDto } from '../../reports/dto/reports.dto.js';
import { AdminQueryForumPostsDto, CreateForumPostDto, UpdateForumPostDto } from '../dto/forum.dto.js';
import { ContentReportTargetType } from '../../reports/schemas/content-report.schema.js';
import { ReportsService } from '../../reports/services/reports.service.js';
import { ForumContentFormat, ForumPost, ForumPostDocument, ForumPostStatus } from '../schemas/forum-post.schema.js';
import { prepareForumContent } from './forum-content.js';

const authorFields = '_id username displayName avatarUrl';
const postFields = '_id title content contentFormat status userId likedBy sharedBy viewCount shareCount createdAt updatedAt';
export const editableStatuses = [ForumPostStatus.VISIBLE, ForumPostStatus.HIDDEN, ForumPostStatus.PENDING, ForumPostStatus.REJECTED];

@Injectable()
export class ForumService {
  constructor(
    @InjectModel(ForumPost.name) private readonly posts: Model<ForumPostDocument>,
    private readonly contentReports: ReportsService,
  ) {}

  private objectId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid forum ID');
    return new Types.ObjectId(id);
  }

  private pagination(total: number, query: PaginationQueryDto) {
    const { page, limit, totalPages } = buildPaginationMeta(total, query.page, query.limit);
    return { page, limit, total, totalPages };
  }

  private async withCounts<T extends { _id: Types.ObjectId; contentFormat?: ForumContentFormat; likedBy?: Types.ObjectId[]; sharedBy?: Types.ObjectId[]; viewCount?: number; shareCount?: number }>(items: T[], admin = false, query: DateRangeQueryDto = {}, viewerId?: string) {
    if (!items.length) return [];
    const totals = admin
      ? await this.contentReports.reportCounts(ContentReportTargetType.FORUM_POST, items.map((item) => item._id), query)
      : new Map<string, number>();
    return items.map(({ likedBy, sharedBy, ...item }) => {
      const shareCount = Math.max(sharedBy?.length ?? 0, item.shareCount ?? 0);
      return {
        ...item,
        contentFormat: item.contentFormat ?? ForumContentFormat.PLAIN,
        likeCount: likedBy?.length ?? 0,
        likedByMe: viewerId && likedBy ? likedBy.some((id) => id.toString() === viewerId) : false,
        viewCount: item.viewCount ?? 0,
        shareCount,
        sharedByMe: viewerId && sharedBy ? sharedBy.some((id) => id.toString() === viewerId) : false,
        commentCount: 0,
        ...(admin ? { reportCount: totals.get(item._id.toString()) ?? 0 } : {}),
      };
    });
  }

  async list(query: PaginationQueryDto & DateRangeQueryDto, userId?: string, viewerId?: string) {
    const filter = userId
      ? { userId: this.objectId(userId), status: { $in: editableStatuses } }
      : { status: ForumPostStatus.VISIBLE };
    return this.listPosts(filter, query, false, userId ?? viewerId);
  }

  async adminList(query: AdminQueryForumPostsDto) {
    return this.listPosts({ status: query.status ?? { $in: Object.values(ForumPostStatus) } }, query, true);
  }

  private async listPosts(filter: Record<string, unknown>, query: PaginationQueryDto & DateRangeQueryDto, admin = false, viewerId?: string) {
    if (query.startDate !== undefined || query.endDate !== undefined) {
      Object.assign(filter, dateRangeMatch('createdAt', resolveDateRange(query)));
    }
    const [items, total] = await Promise.all([
      this.posts.find(filter).select(postFields).sort({ createdAt: -1, _id: -1 }).skip(query.skip).limit(query.limit).populate('userId', authorFields).lean(),
      this.posts.countDocuments(filter),
    ]);
    return { items: await this.withCounts(items, admin, query, viewerId), pagination: this.pagination(total, query), likeCountScope: 'lifetime' as const };
  }

  async get(id: string, userId?: string) {
    const isValidUser = Boolean(userId && Types.ObjectId.isValid(userId));
    const post = await this.posts.findOne({
      _id: this.objectId(id),
      $or: [
        { status: ForumPostStatus.VISIBLE },
        ...(isValidUser ? [{ status: { $in: [ForumPostStatus.HIDDEN, ForumPostStatus.PENDING, ForumPostStatus.REJECTED] }, userId: this.objectId(userId!) }] : []),
      ],
    }).select(postFields).populate('userId', authorFields).lean();
    if (!post) throw new NotFoundException('Forum post not found');
    return (await this.withCounts([post], false, {}, userId))[0];
  }

  async create(userId: string, dto: CreateForumPostDto) {
    const contentFormat = dto.contentFormat ?? ForumContentFormat.PLAIN;
    const post = await this.posts.create({ userId: this.objectId(userId), title: dto.title.trim(), content: prepareForumContent(dto.content, contentFormat), contentFormat, status: ForumPostStatus.PENDING });
    return this.get(post._id.toString(), userId);
  }

  private async requireOwner(id: string, userId: string) {
    const post = await this.posts.findOne({ _id: this.objectId(id), status: { $in: editableStatuses } }).lean();
    if (!post) throw new NotFoundException('Forum post not found');
    if (post.userId.toString() !== userId) throw new ForbiddenException('Only the owner can change this post');
    return { post, filter: { _id: post._id, userId: this.objectId(userId), status: { $in: editableStatuses } } };
  }

  async update(id: string, userId: string, dto: UpdateForumPostDto) {
    const { post: current, filter } = await this.requireOwner(id, userId);
    if (dto.contentFormat !== undefined && dto.content === undefined) {
      throw new BadRequestException('Provide content when specifying contentFormat');
    }
    const changes: { title?: string; content?: string; contentFormat?: ForumContentFormat } = {};
    if (dto.title !== undefined) changes.title = dto.title.trim();
    if (dto.content !== undefined) {
      changes.contentFormat = dto.contentFormat ?? current.contentFormat ?? ForumContentFormat.PLAIN;
      changes.content = prepareForumContent(dto.content, changes.contentFormat);
    }
    if (!Object.keys(changes).length) throw new BadRequestException('Provide title or content');
    // Guard the format read above so a concurrent format change cannot activate unsanitized content.
    const updateFilter = dto.content !== undefined
      ? { ...filter, contentFormat: current.contentFormat ?? { $exists: false } }
      : filter;
    const post = await this.posts.findOneAndUpdate(updateFilter, { $set: { ...changes, status: ForumPostStatus.PENDING } }, { new: true, runValidators: true }).select(postFields).populate('userId', authorFields).lean();
    if (!post) throw new ConflictException('Forum post changed or is no longer available; reload before retrying');
    return (await this.withCounts([post]))[0];
  }

  async delete(id: string, userId: string) {
    const { filter } = await this.requireOwner(id, userId);
    const post = await this.posts.findOneAndUpdate(filter, { $set: { status: ForumPostStatus.DELETED } }, { new: true }).select(postFields).populate('userId', authorFields).lean();
    if (!post) throw new NotFoundException('Forum post not found');
    return (await this.withCounts([post]))[0];
  }

  async setStatus(id: string, status: ForumPostStatus) {
    if (status !== ForumPostStatus.VISIBLE && status !== ForumPostStatus.HIDDEN && status !== ForumPostStatus.REJECTED) {
      throw new BadRequestException('Status must be VISIBLE, HIDDEN, or REJECTED');
    }
    const post = await this.posts.findOneAndUpdate(
      { _id: this.objectId(id), status: { $in: editableStatuses } },
      { $set: { status } }, { new: true, runValidators: true },
    ).select(postFields).populate('userId', authorFields).lean();
    if (!post) throw new NotFoundException('Forum post not found');
    return (await this.withCounts([post], true))[0];
  }

  async like(id: string, userId: string, liked: boolean) {
    const actor = this.objectId(userId);
    const post = await this.posts.findOneAndUpdate(
      { _id: this.objectId(id), status: ForumPostStatus.VISIBLE },
      liked ? { $addToSet: { likedBy: actor } } : { $pull: { likedBy: actor } },
      { new: true, runValidators: true },
    ).select('likedBy').lean();
    if (!post) throw new NotFoundException('Forum post not found');
    return { liked, likeCount: post.likedBy?.length ?? 0 };
  }

  async report(id: string, userId: string, reason: string) {
    return this.contentReports.submit(userId, { targetType: ContentReportTargetType.FORUM_POST, targetId: id, reason });
  }

  async share(id: string, userId: string) {
    const actor = this.objectId(userId);
    const post = await this.posts.findOneAndUpdate(
      { _id: this.objectId(id), status: ForumPostStatus.VISIBLE },
      { $addToSet: { sharedBy: actor } },
      { new: true, runValidators: true, timestamps: false },
    ).select('sharedBy shareCount').lean();
    if (!post) throw new NotFoundException('Forum post not found');
    const shareCount = Math.max(post.sharedBy?.length ?? 0, post.shareCount ?? 0);
    return { shared: true, shareCount };
  }

  async increment(id: string, userId: string | undefined, counter: 'viewCount' | 'shareCount' = 'viewCount') {
    const isValidUser = Boolean(userId && Types.ObjectId.isValid(userId));
    const visibility = {
      $or: [
        { status: ForumPostStatus.VISIBLE },
        ...(isValidUser ? [{ status: { $in: [ForumPostStatus.PENDING, ForumPostStatus.HIDDEN, ForumPostStatus.REJECTED] }, userId: this.objectId(userId!) }] : []),
      ],
    };
    const post = await this.posts.findOneAndUpdate(
      { _id: this.objectId(id), ...visibility }, { $inc: { [counter]: 1 } },
      { new: true, timestamps: false },
    ).select('viewCount shareCount').lean();
    if (!post) throw new NotFoundException('Forum post not found');
    return { viewCount: post.viewCount ?? 0, shareCount: post.shareCount ?? 0 };
  }

  async stats(query: DateRangeQueryDto, userId?: string) {
    const filter: Record<string, unknown> = userId ? { userId: this.objectId(userId) } : {};
    if (query.startDate !== undefined || query.endDate !== undefined) {
      Object.assign(filter, dateRangeMatch('createdAt', resolveDateRange(query)));
    }
    const rows = await this.posts.aggregate<{ _id: ForumPostStatus; count: number; views: number; likes: number; shares: number }>([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          views: { $sum: { $ifNull: ['$viewCount', 0] } },
          likes: { $sum: { $size: { $ifNull: ['$likedBy', []] } } },
          shares: {
            $sum: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ['$sharedBy', []] } }, 0] },
                { $size: { $ifNull: ['$sharedBy', []] } },
                { $ifNull: ['$shareCount', 0] },
              ],
            },
          },
        },
      },
    ]);
    const result = { total: 0, PENDING: 0, VISIBLE: 0, HIDDEN: 0, REJECTED: 0, DELETED: 0, views: 0, likes: 0, shares: 0, counterScope: 'lifetime' as const };
    for (const row of rows) {
      result[row._id] = row.count;
      result.total += row.count; result.views += row.views; result.likes += row.likes; result.shares += row.shares;
    }
    return result;
  }

  async reports(id: string, query: QueryReportsDto) {
    return this.contentReports.listForTarget(ContentReportTargetType.FORUM_POST, id, query);
  }
}
