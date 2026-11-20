import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta } from '../../../common/dto/pagination.dto.js';
import { DateRangeQueryDto } from '../../../common/dto/date-range.dto.js';
import { dateRangeMatch, resolveDateRange } from '../../../common/utils/date-range.util.js';
import { Chapter, ChapterDocument, ChapterStatus } from '../../chapters/schemas/chapter.schema.js';
import { Comment, CommentDocument, CommentStatus } from '../../comments/schemas/comment.schema.js';
import { ForumPost, ForumPostDocument, ForumPostStatus } from '../../forum/schemas/forum-post.schema.js';
import { Story, StoryDocument, StoryStatus, StoryVisibility } from '../../stories/schemas/story.schema.js';
import { AdminQueryReportsDto, QueryReportsDto, SubmitReportDto, UpdateReportStatusDto } from '../dto/reports.dto.js';
import { ContentReport, ContentReportDocument, ContentReportStatus, ContentReportTargetType } from '../schemas/content-report.schema.js';
import { UserDocument } from '../../users/schemas/user.schema.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(ContentReport.name) private readonly reports: Model<ContentReportDocument>,
    @InjectModel(ForumPost.name) private readonly posts: Model<ForumPostDocument>,
    @InjectModel(Story.name) private readonly stories: Model<StoryDocument>,
    @InjectModel(Chapter.name) private readonly chapters?: Model<ChapterDocument>,
    @InjectModel(Comment.name) private readonly comments?: Model<CommentDocument>,
  ) {}

  private objectId(id: string | Types.ObjectId) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid report ID');
    return new Types.ObjectId(id);
  }

  private validateTargetType(targetType: ContentReportTargetType) {
    if (!Object.values(ContentReportTargetType).includes(targetType)) {
      throw new BadRequestException('Invalid report target type');
    }
  }

  private async resolveTargetIdFromUrl(targetType: ContentReportTargetType, rawUrl: string): Promise<Types.ObjectId> {
    const cleaned = rawUrl.trim();
    if (!cleaned) throw new BadRequestException('Vui lòng chọn nội dung hoặc dán đường dẫn hợp lệ');

    // Cho phép trích xuất commentId từ query hoặc hash (#comment-xxx hoặc ?commentId=xxx)
    if (targetType === ContentReportTargetType.COMMENT) {
      const commentMatch = cleaned.match(/(?:commentId=|#comment-)([a-f\d]{24})/i);
      if (commentMatch && Types.ObjectId.isValid(commentMatch[1])) {
        return new Types.ObjectId(commentMatch[1]);
      }
      throw new BadRequestException('Vui lòng chọn bình luận cụ thể trong danh sách hoặc bấm nút Báo cáo ngay dưới bình luận đó.');
    }

    let pathname = cleaned;
    try {
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        pathname = new URL(cleaned).pathname;
      } else {
        pathname = cleaned.split('?')[0].split('#')[0];
      }
    } catch {
      pathname = cleaned.split('?')[0].split('#')[0];
    }

    if (targetType === ContentReportTargetType.FORUM_POST) {
      const match = pathname.match(/\/dien-dan\/([^/]+)/i);
      const identifier = decodeURIComponent(match ? match[1] : pathname.replace(/^\/+|\/+$/g, '')).trim();
      if (!identifier) throw new BadRequestException('Đường dẫn bài viết diễn đàn không hợp lệ');
      if (/^[a-f\d]{24}$/i.test(identifier) && Types.ObjectId.isValid(identifier)) {
        return new Types.ObjectId(identifier);
      }
      if (typeof this.posts.findOne === 'function') {
        const post = await this.posts.findOne({ slug: identifier.toLowerCase(), status: ForumPostStatus.VISIBLE }).select('_id').lean();
        if (!post) throw new NotFoundException('Không tìm thấy bài viết diễn đàn từ đường dẫn này');
        return post._id;
      }
      throw new NotFoundException('Report target not found');
    }

    if (targetType === ContentReportTargetType.STORY) {
      const match = pathname.match(/\/truyen\/([^/]+)/i);
      const slug = decodeURIComponent(match ? match[1] : pathname.replace(/^\/+|\/+$/g, '')).trim().toLowerCase();
      if (!slug) throw new BadRequestException('Đường dẫn tác phẩm truyện không hợp lệ');
      if (typeof this.stories.findOne === 'function') {
        const story = await this.stories.findOne({ slug, status: StoryStatus.PUBLISHED, visibility: StoryVisibility.PUBLIC }).select('_id').lean();
        if (!story) throw new NotFoundException('Không tìm thấy tác phẩm truyện từ đường dẫn này');
        return story._id;
      }
      throw new NotFoundException('Report target not found');
    }

    if (targetType === ContentReportTargetType.CHAPTER) {
      const match = pathname.match(/\/truyen\/([^/]+)\/chuong\/(\d+)/i);
      if (!match) {
        throw new BadRequestException('Đường dẫn chương truyện cần có dạng /truyen/ten-truyen/chuong/so-chuong');
      }
      const storySlug = decodeURIComponent(match[1]).trim().toLowerCase();
      const chapterNumber = Number(match[2]);
      if (typeof this.stories.findOne === 'function' && this.chapters && typeof this.chapters.findOne === 'function') {
        const story = await this.stories.findOne({ slug: storySlug, status: StoryStatus.PUBLISHED, visibility: StoryVisibility.PUBLIC }).select('_id').lean();
        if (!story) throw new NotFoundException('Không tìm thấy truyện của chương này');
        const chapter = await this.chapters.findOne({ storyId: story._id, chapterNumber, status: ChapterStatus.PUBLISHED }).select('_id').lean();
        if (!chapter) throw new NotFoundException('Không tìm thấy chương truyện tương ứng');
        return chapter._id;
      }
      throw new NotFoundException('Report target not found');
    }

    throw new BadRequestException('Invalid report target');
  }

  async submit(userId: string, dto: SubmitReportDto): Promise<{ reported: true }> {
    this.validateTargetType(dto.targetType);
    const reporterId = this.objectId(userId);
    const reason = typeof dto.reason === 'string' ? dto.reason.trim() : '';
    if (!reason || reason.length > 1000) throw new BadRequestException('Reason must contain 1 to 1000 characters');

    const targetId = dto.targetId
      ? this.objectId(dto.targetId)
      : dto.targetUrl
        ? await this.resolveTargetIdFromUrl(dto.targetType, dto.targetUrl)
        : this.objectId('');
    let target: unknown = null;
    if (dto.targetType === ContentReportTargetType.FORUM_POST) {
      target = await this.posts.exists({ _id: targetId, status: ForumPostStatus.VISIBLE });
    } else if (dto.targetType === ContentReportTargetType.STORY) {
      target = await this.stories.exists({ _id: targetId, status: StoryStatus.PUBLISHED, visibility: StoryVisibility.PUBLIC });
    } else if (dto.targetType === ContentReportTargetType.CHAPTER) {
      target = this.chapters
        ? await this.chapters.exists({ _id: targetId, status: ChapterStatus.PUBLISHED })
        : { _id: targetId };
    } else if (dto.targetType === ContentReportTargetType.COMMENT) {
      target = this.comments
        ? await this.comments.exists({ _id: targetId, status: CommentStatus.VISIBLE })
        : { _id: targetId };
    }
    if (!target) throw new NotFoundException('Report target not found');

    try {
      await this.reports.updateOne(
        { targetType: dto.targetType, targetId, userId: reporterId },
        { $setOnInsert: { reason, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true, runValidators: true, timestamps: false },
      );
    } catch (error) {
      if ((error as { code?: number })?.code !== 11000) throw error;
    }
    return { reported: true };
  }

  async reportCounts(targetType: ContentReportTargetType, ids: readonly (string | Types.ObjectId)[], query: DateRangeQueryDto = {}): Promise<Map<string, number>> {
    this.validateTargetType(targetType);
    const dateFilter = query.startDate !== undefined || query.endDate !== undefined
      ? dateRangeMatch('createdAt', resolveDateRange(query)) : {};
    if (!ids.length) return new Map();
    const counts = await this.reports.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { targetType, targetId: { $in: ids.map((id) => this.objectId(id)) }, ...dateFilter } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]);
    return new Map(counts.map(({ _id, count }) => [_id.toString(), count]));
  }

  async listForTarget(targetType: ContentReportTargetType, id: string, query: QueryReportsDto) {
    this.validateTargetType(targetType);
    const targetId = this.objectId(id);
    let target: unknown = null;
    if (targetType === ContentReportTargetType.FORUM_POST) {
      target = await this.posts.exists({ _id: targetId });
    } else if (targetType === ContentReportTargetType.STORY) {
      target = await this.stories.exists({ _id: targetId });
    } else if (targetType === ContentReportTargetType.CHAPTER) {
      target = this.chapters ? await this.chapters.exists({ _id: targetId }) : { _id: targetId };
    } else if (targetType === ContentReportTargetType.COMMENT) {
      target = this.comments ? await this.comments.exists({ _id: targetId }) : { _id: targetId };
    }
    if (!target) throw new NotFoundException('Report target not found');
    return this.list(Object.assign(new AdminQueryReportsDto(), query, { targetType, targetId: id }));
  }

  async updateStatus(id: string, dto: UpdateReportStatusDto, actor: UserDocument & { _id: any }) {
    const reportId = this.objectId(id);
    if ([ContentReportStatus.ACTION_TAKEN, ContentReportStatus.REJECTED].includes(dto.status) && !dto.resolutionNote?.trim()) {
      throw new BadRequestException('Vui l?ng ghi r? k?t qu? x? l? tr??c khi ??ng b?o c?o');
    }
    const report = await this.reports.findById(reportId);
    if (!report) throw new NotFoundException('Kh?ng t?m th?y b?o c?o vi ph?m');
    const reviewedAt = new Date();
    report.status = dto.status;
    report.resolutionNote = dto.resolutionNote?.trim() || null;
    report.reviewedBy = actor._id;
    report.reviewedAt = reviewedAt;
    report.history = [...(report.history ?? []), {
      status: dto.status,
      note: dto.resolutionNote?.trim() || null,
      actorId: actor._id,
      createdAt: reviewedAt,
    }];
    await report.save();
    return report.toObject();
  }

  async list(query: AdminQueryReportsDto) {
    const filter: Record<string, unknown> = query.startDate !== undefined || query.endDate !== undefined
      ? dateRangeMatch('createdAt', resolveDateRange(query)) : {};
    if (query.status !== undefined) filter.status = query.status;
    if (query.targetType !== undefined) {
      this.validateTargetType(query.targetType);
      filter.targetType = query.targetType;
    }
    if (query.targetId !== undefined) filter.targetId = this.objectId(query.targetId);
    const [items, total] = await Promise.all([
      this.reports.find(filter).select('_id targetType targetId userId reason status resolutionNote reviewedBy reviewedAt history createdAt updatedAt')
        .sort({ createdAt: -1, _id: -1 }).skip(query.skip).limit(query.limit)
        .populate('userId', '_id username displayName avatarUrl')
        .populate('reviewedBy', '_id username displayName')
        .populate('history.actorId', '_id username displayName').lean(),
      this.reports.countDocuments(filter),
    ]);
    const enrichedItems = await this.enrichReportItems(items);
    const { page, limit, totalPages } = buildPaginationMeta(total, query.page, query.limit);
    return { items: enrichedItems, pagination: { page, limit, total, totalPages } };
  }

  private async enrichReportItems(items: any[]) {
    if (!items.length || typeof (this.posts as any)?.find !== 'function') {
      return items;
    }

    const forumIds = items.filter((i) => i.targetType === ContentReportTargetType.FORUM_POST).map((i) => i.targetId);
    const storyIds = items.filter((i) => i.targetType === ContentReportTargetType.STORY).map((i) => i.targetId);
    const chapterIds = items.filter((i) => i.targetType === ContentReportTargetType.CHAPTER).map((i) => i.targetId);
    const commentIds = items.filter((i) => i.targetType === ContentReportTargetType.COMMENT).map((i) => i.targetId);

    const [forumDocs, storyDocs, chapterDocs, commentDocs] = await Promise.all([
      forumIds.length ? this.posts.find({ _id: { $in: forumIds } }).select('_id title slug').lean() : [],
      storyIds.length && typeof (this.stories as any)?.find === 'function'
        ? this.stories.find({ _id: { $in: storyIds } }).select('_id title slug').lean()
        : [],
      chapterIds.length && this.chapters && typeof (this.chapters as any)?.find === 'function'
        ? this.chapters.find({ _id: { $in: chapterIds } }).select('_id storyId chapterNumber title').populate('storyId', 'title slug').lean()
        : [],
      commentIds.length && this.comments && typeof (this.comments as any)?.find === 'function'
        ? this.comments.find({ _id: { $in: commentIds } }).select('_id content storyId forumPostId chapterId').populate('storyId', 'title slug').populate('forumPostId', 'title slug').populate('chapterId', 'chapterNumber').lean()
        : [],
    ]);

    const forumMap = new Map((forumDocs as any[]).map((d) => [d._id.toString(), d]));
    const storyMap = new Map((storyDocs as any[]).map((d) => [d._id.toString(), d]));
    const chapterMap = new Map((chapterDocs as any[]).map((d) => [d._id.toString(), d]));
    const commentMap = new Map((commentDocs as any[]).map((d) => [d._id.toString(), d]));

    return items.map((item) => {
      const tid = item.targetId?.toString?.() ?? String(item.targetId);
      let targetMeta: { title: string; subtitle?: string; url?: string } | undefined;

      if (item.targetType === ContentReportTargetType.FORUM_POST) {
        const p = forumMap.get(tid);
        if (p) {
          targetMeta = {
            title: p.title,
            subtitle: 'Bài viết cộng đồng',
            url: `/dien-dan/${p.slug || p._id.toString()}`,
          };
        }
      } else if (item.targetType === ContentReportTargetType.STORY) {
        const s = storyMap.get(tid);
        if (s) {
          targetMeta = {
            title: s.title,
            subtitle: 'Tác phẩm truyện',
            url: `/truyen/${s.slug}`,
          };
        }
      } else if (item.targetType === ContentReportTargetType.CHAPTER) {
        const c = chapterMap.get(tid);
        if (c) {
          const st = c.storyId as any;
          targetMeta = {
            title: `Chương ${c.chapterNumber}: ${c.title || ''}`.trim(),
            subtitle: st?.title ? `Truyện: ${st.title}` : undefined,
            url: st?.slug ? `/truyen/${st.slug}/chuong/${c.chapterNumber}` : undefined,
          };
        }
      } else if (item.targetType === ContentReportTargetType.COMMENT) {
        const cm = commentMap.get(tid);
        if (cm) {
          const st = cm.storyId as any;
          const fp = cm.forumPostId as any;
          const ch = cm.chapterId as any;
          let url: string | undefined;
          if (st?.slug && ch?.chapterNumber) {
            url = `/truyen/${st.slug}/chuong/${ch.chapterNumber}#comment-${tid}`;
          } else if (st?.slug) {
            url = `/truyen/${st.slug}?tab=comments#comment-${tid}`;
          } else if (fp) {
            url = `/dien-dan/${fp.slug || fp._id?.toString()}#comment-${tid}`;
          }
          targetMeta = {
            title: cm.content ? `"${String(cm.content).slice(0, 90)}${String(cm.content).length > 90 ? '…' : ''}"` : 'Bình luận độc giả',
            subtitle: st?.title ? `Tại truyện: ${st.title}` : fp?.title ? `Tại bài viết: ${fp.title}` : undefined,
            url,
          };
        }
      }

      return {
        ...item,
        ...(targetMeta ? { targetMeta } : {}),
      };
    });
  }
}
