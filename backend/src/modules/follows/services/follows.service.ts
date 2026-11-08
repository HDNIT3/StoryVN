import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import {
  Chapter,
  ChapterDocument,
  ChapterStatus,
} from '../../chapters/schemas/chapter.schema.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import {
  ReadingHistory,
  ReadingHistoryDocument,
} from '../../reading-history/schemas/reading-history.schema.js';
import {
  AuthorProfile,
  AuthorProfileDocument,
} from '../../users/schemas/author-profile.schema.js';
import {
  User,
  UserDocument,
  UserStatus,
} from '../../users/schemas/user.schema.js';
import {
  Story,
  StoryDocument,
  StoryStatus,
  StoryVisibility,
} from '../../stories/schemas/story.schema.js';
import {
  FollowStorySortOption,
  QueryFollowedAuthorsDto,
  QueryFollowedStoriesDto,
  QueryFollowedUpdatesDto,
} from '../dto/query-follows.dto.js';
import {
  Follow,
  FollowDocument,
  FollowTargetType,
} from '../schemas/follow.schema.js';

export interface ToggleFollowResult {
  isFollowing: boolean;
  targetType: FollowTargetType;
  targetId: string;
}

export interface FollowedChapterBrief {
  _id: string;
  chapterNumber: number;
  title: string;
  wordCount: number;
  releasedAt: Date;
  isUnread?: boolean;
  isRead?: boolean;
}

export interface FollowedStoryItem {
  _id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  description: string;
  author: {
    _id: string;
    username: string;
    displayName: string;
    penName: string;
    avatarUrl: string | null;
  } | null;
  stats: {
    viewCount: number;
    followCount: number;
    chapterCount: number;
    ratingAverage: number;
  };
  progressState: string;
  updatedAt: Date;
  followedAt: Date;
  latestChapter?: FollowedChapterBrief | null;
  unreadChapterCount?: number;
  lastReadChapterNumber?: number | null;
}

export interface FollowedStoryUpdateItem {
  story: {
    _id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    progressState: string;
    author: {
      _id: string;
      username: string;
      displayName: string;
      penName: string;
      avatarUrl: string | null;
    } | null;
    stats: {
      chapterCount: number;
      viewCount: number;
    };
  };
  followedAt: Date;
  updatesSeenAt: Date | null;
  latestChapter: FollowedChapterBrief;
  recentNewChapters: FollowedChapterBrief[];
  unreadChapterCount: number;
  hasUnread: boolean;
  lastReadChapterNumber: number | null;
  targetChapterNumber: number;
}

export interface FollowedUpdatesSummary {
  unreadStoriesCount: number;
  unreadChaptersCount: number;
}

export interface PaginatedFollowedStoryUpdates
  extends PaginatedResult<FollowedStoryUpdateItem> {
  summary: FollowedUpdatesSummary;
}

export interface FollowedAuthorStoryItem {
  _id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  progressState: string;
  updatedAt: Date;
  followedAt: Date;
  stats: {
    chapterCount: number;
    viewCount: number;
  };
}

export interface FollowedAuthorItem {
  _id: string;
  username: string;
  displayName: string;
  penName: string;
  avatarUrl: string | null;
  biography: string;
  followerCount: number;
  storyCount: number;
  totalViews: number;
  followedAt: Date;
  followedStories: FollowedAuthorStoryItem[];
  followedStoryCount: number;
}

interface StoryUpdateSnapshot {
  latestChapter: FollowedChapterBrief | null;
  recentNewChapters: FollowedChapterBrief[];
  unreadChapterCount: number;
  hasUnread: boolean;
  lastReadChapterNumber: number | null;
  targetChapterNumber: number | null;
  followedAt: Date;
  updatesSeenAt: Date | null;
}

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    @InjectModel(Story.name)
    private readonly storyModel: Model<StoryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(AuthorProfile.name)
    private readonly authorProfileModel: Model<AuthorProfileDocument>,
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(ReadingHistory.name)
    private readonly readingHistoryModel: Model<ReadingHistoryDocument>,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  async toggleFollow(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<ToggleFollowResult> {
    const userObjectId = this.toObjectId(userId);
    const targetObjectId = this.toObjectId(targetId);

    await this.validateTarget(userId, targetType, targetObjectId);

    const existing = await this.followModel
      .findOne({
        userId: userObjectId,
        targetType,
        targetId: targetObjectId,
      })
      .lean()
      .exec();

    if (existing) {
      await this.followModel.deleteOne({ _id: existing._id }).exec();
      await this.decrementCounter(targetType, targetObjectId);
      return { isFollowing: false, targetType, targetId };
    }

    try {
      await this.followModel.create({
        userId: userObjectId,
        targetType,
        targetId: targetObjectId,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        await this.followModel
          .deleteOne({
            userId: userObjectId,
            targetType,
            targetId: targetObjectId,
          })
          .exec();
        await this.decrementCounter(targetType, targetObjectId);
        return { isFollowing: false, targetType, targetId };
      }
      throw err;
    }

    await this.incrementCounter(targetType, targetObjectId);

    return { isFollowing: true, targetType, targetId };
  }

  async follow(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<ToggleFollowResult> {
    const userObjectId = this.toObjectId(userId);
    const targetObjectId = this.toObjectId(targetId);

    await this.validateTarget(userId, targetType, targetObjectId);

    try {
      await this.followModel.create({
        userId: userObjectId,
        targetType,
        targetId: targetObjectId,
      });
      await this.incrementCounter(targetType, targetObjectId);
    } catch (err: any) {
      if (err?.code === 11000) {
        return { isFollowing: true, targetType, targetId };
      }
      throw err;
    }

    return { isFollowing: true, targetType, targetId };
  }

  async unfollow(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<ToggleFollowResult> {
    const userObjectId = this.toObjectId(userId);
    const targetObjectId = this.toObjectId(targetId);

    const result = await this.followModel
      .deleteOne({
        userId: userObjectId,
        targetType,
        targetId: targetObjectId,
      })
      .exec();

    if (result.deletedCount > 0) {
      await this.decrementCounter(targetType, targetObjectId);
    }

    return { isFollowing: false, targetType, targetId };
  }

  async checkFollowStatus(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<{ isFollowing: boolean }> {
    const userObjectId = this.toObjectId(userId);
    const targetObjectId = this.toObjectId(targetId);

    const exists = await this.followModel
      .exists({
        userId: userObjectId,
        targetType,
        targetId: targetObjectId,
      })
      .exec();

    return { isFollowing: !!exists };
  }

  async checkBatchStatus(
    userId: string,
    targetType: FollowTargetType,
    targetIds: string[],
  ): Promise<Record<string, boolean>> {
    if (!targetIds.length) return {};

    const userObjectId = this.toObjectId(userId);
    const objectIds = targetIds.map((id) => this.toObjectId(id));

    const followedDocs = await this.followModel
      .find({
        userId: userObjectId,
        targetType,
        targetId: { $in: objectIds },
      })
      .select('targetId')
      .lean()
      .exec();

    const followedSet = new Set(
      followedDocs.map((doc) => doc.targetId.toString()),
    );

    const result: Record<string, boolean> = {};
    for (const id of targetIds) {
      result[id] = followedSet.has(id);
    }
    return result;
  }

  async getFollowedStories(
    userId: string,
    query: QueryFollowedStoriesDto,
  ): Promise<PaginatedResult<FollowedStoryItem>> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: this.toObjectId(userId),
          targetType: FollowTargetType.STORY,
        },
      },
      {
        $lookup: {
          from: 'stories',
          localField: 'targetId',
          foreignField: '_id',
          as: 'story',
        },
      },
      { $unwind: '$story' },
      {
        $match: {
          'story.status': StoryStatus.PUBLISHED,
          'story.visibility': StoryVisibility.PUBLIC,
        },
      },
    ];

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [{ 'story.title': regex }, { 'story.slug': regex }],
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'story.authorId',
          foreignField: '_id',
          as: 'authorUser',
        },
      },
      {
        $lookup: {
          from: 'author_profiles',
          localField: 'story.authorId',
          foreignField: 'userId',
          as: 'authorProfile',
        },
      },
    );

    const sortStage = this.buildStorySortStage(query.sortBy);
    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: '$story._id',
              title: '$story.title',
              slug: '$story.slug',
              coverUrl: '$story.coverUrl',
              description: '$story.description',
              author: {
                $cond: {
                  if: { $gt: [{ $size: '$authorUser' }, 0] },
                  then: {
                    _id: { $arrayElemAt: ['$authorUser._id', 0] },
                    username: { $arrayElemAt: ['$authorUser.username', 0] },
                    displayName: {
                      $arrayElemAt: ['$authorUser.displayName', 0],
                    },
                    penName: {
                      $ifNull: [
                        { $arrayElemAt: ['$authorProfile.penName', 0] },
                        { $arrayElemAt: ['$authorUser.displayName', 0] },
                      ],
                    },
                    avatarUrl: {
                      $arrayElemAt: ['$authorUser.avatarUrl', 0],
                    },
                  },
                  else: null,
                },
              },
              stats: {
                viewCount: { $ifNull: ['$story.stats.viewCount', 0] },
                followCount: { $ifNull: ['$story.stats.followCount', 0] },
                chapterCount: { $ifNull: ['$story.stats.chapterCount', 0] },
                ratingAverage: {
                  $ifNull: ['$story.stats.ratingAverage', 0],
                },
              },
              progressState: '$story.progressState',
              updatedAt: '$story.updatedAt',
              followedAt: '$createdAt',
            },
          },
        ],
        totalItems: [{ $count: 'count' }],
      },
    });

    const aggregate = this.followModel.aggregate(pipeline);

    if (query.sortBy === FollowStorySortOption.TITLE) {
      aggregate.collation({ locale: 'vi' });
    }

    const [result] = await aggregate.exec();
    const rawItems = (result?.items ?? []) as FollowedStoryItem[];
    const totalItems = result?.totalItems?.[0]?.count ?? 0;

    if (rawItems.length === 0) {
      return { items: [], pagination: buildPaginationMeta(totalItems, page, limit) };
    }

    const userObjectId = this.toObjectId(userId);
    const storyIds = rawItems.map((item) => new Types.ObjectId(String(item._id)));
    const followRows = await this.followModel
      .find({
        userId: userObjectId,
        targetType: FollowTargetType.STORY,
        targetId: { $in: storyIds },
      })
      .select('targetId createdAt updatesSeenAt')
      .lean()
      .exec();

    const snapshotMap = await this.computeStoryUpdateSnapshots(
      userObjectId,
      followRows,
    );

    const items = rawItems.map((item) => {
      const snap = snapshotMap.get(String(item._id));
      return {
        ...item,
        latestChapter: snap?.latestChapter ?? null,
        unreadChapterCount: snap?.unreadChapterCount ?? 0,
        lastReadChapterNumber: snap?.lastReadChapterNumber ?? null,
      };
    });

    return { items, pagination: buildPaginationMeta(totalItems, page, limit) };
  }

  async getFollowedUpdatesSummary(
    userId: string,
  ): Promise<FollowedUpdatesSummary> {
    const userObjectId = this.toObjectId(userId);

    const followRows = await this.followModel
      .find({
        userId: userObjectId,
        targetType: FollowTargetType.STORY,
      })
      .select('targetId createdAt updatesSeenAt')
      .lean()
      .exec();

    if (!followRows.length) {
      return { unreadStoriesCount: 0, unreadChaptersCount: 0 };
    }

    const publicStories = await this.storyModel
      .find({
        _id: { $in: followRows.map((f) => f.targetId) },
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PUBLIC,
      })
      .select('_id')
      .lean()
      .exec();

    if (!publicStories.length) {
      return { unreadStoriesCount: 0, unreadChaptersCount: 0 };
    }

    const publicIdSet = new Set(publicStories.map((s) => String(s._id)));
    const publicFollowRows = followRows.filter((f) =>
      publicIdSet.has(String(f.targetId)),
    );

    const snapshotMap = await this.computeStoryUpdateSnapshots(
      userObjectId,
      publicFollowRows,
    );

    let unreadStoriesCount = 0;
    let unreadChaptersCount = 0;

    for (const snap of snapshotMap.values()) {
      if (snap.unreadChapterCount > 0) {
        unreadStoriesCount += 1;
        unreadChaptersCount += snap.unreadChapterCount;
      }
    }

    return { unreadStoriesCount, unreadChaptersCount };
  }

  async getFollowedStoryUpdates(
    userId: string,
    query: QueryFollowedUpdatesDto,
  ): Promise<PaginatedFollowedStoryUpdates> {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const userObjectId = this.toObjectId(userId);

    const followRows = await this.followModel
      .find({
        userId: userObjectId,
        targetType: FollowTargetType.STORY,
      })
      .select('targetId createdAt updatesSeenAt')
      .lean()
      .exec();

    if (!followRows.length) {
      return {
        items: [],
        pagination: buildPaginationMeta(0, page, limit),
        summary: { unreadStoriesCount: 0, unreadChaptersCount: 0 },
      };
    }

    const storyDocs = await this.storyModel
      .find({
        _id: { $in: followRows.map((f) => f.targetId) },
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PUBLIC,
      })
      .select('_id title slug coverUrl progressState authorId stats updatedAt')
      .lean()
      .exec();

    if (!storyDocs.length) {
      return {
        items: [],
        pagination: buildPaginationMeta(0, page, limit),
        summary: { unreadStoriesCount: 0, unreadChaptersCount: 0 },
      };
    }

    const storyMap = new Map(storyDocs.map((s) => [String(s._id), s]));
    const publicFollowRows = followRows.filter((f) =>
      storyMap.has(String(f.targetId)),
    );

    const snapshotMap = await this.computeStoryUpdateSnapshots(
      userObjectId,
      publicFollowRows,
    );

    let unreadStoriesCount = 0;
    let unreadChaptersCount = 0;

    for (const snap of snapshotMap.values()) {
      if (snap.unreadChapterCount > 0) {
        unreadStoriesCount += 1;
        unreadChaptersCount += snap.unreadChapterCount;
      }
    }

    const searchRegex = query.search?.trim()
      ? new RegExp(query.search.trim(), 'i')
      : null;

    interface RankedUpdateCandidate {
      storyDoc: any;
      snapshot: StoryUpdateSnapshot;
    }

    const candidates: RankedUpdateCandidate[] = [];
    for (const follow of publicFollowRows) {
      const storyIdStr = String(follow.targetId);
      const storyDoc = storyMap.get(storyIdStr);
      const snap = snapshotMap.get(storyIdStr);

      if (!storyDoc || !snap || !snap.latestChapter) {
        continue;
      }

      if (query.onlyUnread && snap.unreadChapterCount <= 0) {
        continue;
      }

      if (
        searchRegex &&
        !searchRegex.test(storyDoc.title || '') &&
        !searchRegex.test(storyDoc.slug || '')
      ) {
        continue;
      }

      candidates.push({ storyDoc, snapshot: snap });
    }

    // Sắp xếp mới phát hành nhất lên đầu
    candidates.sort((a, b) => {
      const timeA = a.snapshot.latestChapter?.releasedAt?.getTime() ?? 0;
      const timeB = b.snapshot.latestChapter?.releasedAt?.getTime() ?? 0;
      if (timeB !== timeA) return timeB - timeA;
      return String(a.storyDoc.title).localeCompare(
        String(b.storyDoc.title),
        'vi',
      );
    });

    const totalItems = candidates.length;
    const paged = candidates.slice((page - 1) * limit, page * limit);

    // Chỉ truy vấn thông tin tác giả cho đúng trang hiện tại
    const authorIds = Array.from(
      new Set(
        paged
          .map((c) => c.storyDoc.authorId)
          .filter(Boolean)
          .map((id) => String(id)),
      ),
    ).map((id) => new Types.ObjectId(id));

    const [authorUsers, authorProfiles] =
      authorIds.length > 0
        ? await Promise.all([
            this.userModel
              .find({ _id: { $in: authorIds } })
              .select('username displayName avatarUrl')
              .lean()
              .exec(),
            this.authorProfileModel
              .find({ userId: { $in: authorIds } })
              .select('userId penName')
              .lean()
              .exec(),
          ])
        : [[], []];

    const authorUserMap = new Map(
      authorUsers.map((u) => [String(u._id), u]),
    );
    const authorProfileMap = new Map(
      authorProfiles.map((p) => [String(p.userId), p]),
    );

    const items: FollowedStoryUpdateItem[] = paged.map(
      ({ storyDoc, snapshot }) => {
        const authorIdStr = storyDoc.authorId ? String(storyDoc.authorId) : '';
        const authorUser = authorUserMap.get(authorIdStr);
        const authorProfile = authorProfileMap.get(authorIdStr);

        return {
          story: {
            _id: String(storyDoc._id),
            title: storyDoc.title,
            slug: storyDoc.slug,
            coverUrl: storyDoc.coverUrl ?? null,
            progressState: storyDoc.progressState,
            author: authorUser
              ? {
                  _id: String(authorUser._id),
                  username: authorUser.username,
                  displayName: authorUser.displayName,
                  penName: authorProfile?.penName || authorUser.displayName,
                  avatarUrl: authorUser.avatarUrl ?? null,
                }
              : null,
            stats: {
              chapterCount: storyDoc.stats?.chapterCount ?? 0,
              viewCount: storyDoc.stats?.viewCount ?? 0,
            },
          },
          followedAt: snapshot.followedAt,
          updatesSeenAt: snapshot.updatesSeenAt,
          latestChapter: snapshot.latestChapter!,
          recentNewChapters: snapshot.recentNewChapters,
          unreadChapterCount: snapshot.unreadChapterCount,
          hasUnread: snapshot.hasUnread,
          lastReadChapterNumber: snapshot.lastReadChapterNumber,
          targetChapterNumber:
            snapshot.targetChapterNumber ??
            snapshot.latestChapter!.chapterNumber,
        };
      },
    );

    return {
      items,
      pagination: buildPaginationMeta(totalItems, page, limit),
      summary: { unreadStoriesCount, unreadChaptersCount },
    };
  }

  async markFollowedUpdatesSeen(
    userId: string,
    storyId?: string,
  ): Promise<{ updatedCount: number; seenAt: Date }> {
    const userObjectId = this.toObjectId(userId);
    const now = new Date();

    if (storyId) {
      const storyObjectId = this.toObjectId(storyId);
      const result = await this.followModel
        .updateOne(
          {
            userId: userObjectId,
            targetType: FollowTargetType.STORY,
            targetId: storyObjectId,
          },
          { $set: { updatesSeenAt: now } },
        )
        .exec();

      try {
        await this.notificationsService?.markNewChapterNotificationsAsRead(
          userId,
          { storyId: storyObjectId },
        );
      } catch {
        // Bỏ qua lỗi đồng bộ notification
      }

      return { updatedCount: result.modifiedCount ?? 0, seenAt: now };
    }

    const result = await this.followModel
      .updateMany(
        {
          userId: userObjectId,
          targetType: FollowTargetType.STORY,
        },
        { $set: { updatesSeenAt: now } },
      )
      .exec();

    try {
      await this.notificationsService?.markNewChapterNotificationsAsRead(
        userId,
        {},
      );
    } catch {
      // Bỏ qua lỗi đồng bộ notification
    }

    return { updatedCount: result.modifiedCount ?? 0, seenAt: now };
  }

  /**
   * Tính toán snapshot chương mới nhất, danh sách chương mới chưa đọc/chưa xem và tiến độ đọc
   * cho một tập các truyện mà user đang theo dõi (tôn trọng ràng buộc liên tục & lịch phát hành).
   */
  private async computeStoryUpdateSnapshots(
    userObjectId: Types.ObjectId,
    followRows: Array<{
      targetId: Types.ObjectId;
      createdAt?: Date;
      updatesSeenAt?: Date | null;
      _id?: Types.ObjectId;
    }>,
  ): Promise<Map<string, StoryUpdateSnapshot>> {
    const result = new Map<string, StoryUpdateSnapshot>();
    if (!followRows || followRows.length === 0) {
      return result;
    }

    const storyIds = followRows.map((f) => new Types.ObjectId(String(f.targetId)));
    const now = new Date();

    const [firstUnreleasedRows, publishedChapters, readHistoryRows] =
      await Promise.all([
        this.chapterModel.aggregate<{
          _id: Types.ObjectId;
          minUnreleasedNumber: number;
        }>([
          {
            $match: {
              storyId: { $in: storyIds },
              $or: [
                { status: { $ne: ChapterStatus.PUBLISHED } },
                { scheduledAt: { $gt: now } },
              ],
            },
          },
          {
            $group: {
              _id: '$storyId',
              minUnreleasedNumber: { $min: '$chapterNumber' },
            },
          },
        ]),
        this.chapterModel
          .find({
            storyId: { $in: storyIds },
            status: ChapterStatus.PUBLISHED,
            $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }],
          })
          .select(
            '_id storyId chapterNumber title wordCount releasedAt scheduledAt createdAt',
          )
          .sort({ storyId: 1, chapterNumber: -1 })
          .lean()
          .exec(),
        this.readingHistoryModel.aggregate<{
          _id: { storyId: Types.ObjectId; chapterId: Types.ObjectId };
        }>([
          {
            $match: {
              userId: userObjectId,
              storyId: { $in: storyIds },
            },
          },
          {
            $group: {
              _id: { storyId: '$storyId', chapterId: '$chapterId' },
            },
          },
        ]),
      ]);

    const minUnreleasedMap = new Map<string, number>();
    for (const row of firstUnreleasedRows) {
      minUnreleasedMap.set(String(row._id), row.minUnreleasedNumber);
    }

    const readChapterIdSet = new Set<string>();
    for (const row of readHistoryRows) {
      if (row?._id?.chapterId) {
        readChapterIdSet.add(String(row._id.chapterId));
      }
    }

    const chaptersByStory = new Map<string, any[]>();
    for (const ch of publishedChapters as any[]) {
      const sId = String(ch.storyId);
      const cutoff = minUnreleasedMap.get(sId);
      if (cutoff !== undefined && ch.chapterNumber >= cutoff) {
        continue;
      }
      const list = chaptersByStory.get(sId) ?? [];
      list.push(ch);
      chaptersByStory.set(sId, list);
    }

    for (const follow of followRows) {
      const sId = String(follow.targetId);
      const followedAt = this.resolveDateFallback(
        follow.createdAt,
        follow._id,
      );
      const updatesSeenAt = follow.updatesSeenAt
        ? new Date(follow.updatesSeenAt)
        : null;
      const seenCutoff = updatesSeenAt ?? followedAt;

      const releasedChapters = chaptersByStory.get(sId) ?? [];
      if (releasedChapters.length === 0) {
        result.set(sId, {
          latestChapter: null,
          recentNewChapters: [],
          unreadChapterCount: 0,
          hasUnread: false,
          lastReadChapterNumber: null,
          targetChapterNumber: null,
          followedAt,
          updatesSeenAt,
        });
        continue;
      }

      let lastReadChapterNumber: number | null = null;
      const unreadChapters: FollowedChapterBrief[] = [];

      const mappedChapters: FollowedChapterBrief[] = releasedChapters.map(
        (ch) => {
          const chId = String(ch._id);
          const isRead = readChapterIdSet.has(chId);
          if (
            isRead &&
            (lastReadChapterNumber === null ||
              ch.chapterNumber > lastReadChapterNumber)
          ) {
            lastReadChapterNumber = ch.chapterNumber;
          }

          const releasedAt = this.resolveChapterReleasedAt(ch);
          const isUnread =
            !isRead && releasedAt.getTime() > seenCutoff.getTime();

          const brief: FollowedChapterBrief = {
            _id: chId,
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            wordCount: typeof ch.wordCount === 'number' ? ch.wordCount : 0,
            releasedAt,
            isUnread,
            isRead,
          };

          if (isUnread) {
            unreadChapters.push(brief);
          }

          return brief;
        },
      );

      const latestChapter = mappedChapters[0] ?? null;
      const recentNewChapters =
        unreadChapters.length > 0
          ? unreadChapters.slice(0, 4)
          : mappedChapters.slice(0, 3);

      const targetChapterNumber =
        unreadChapters.length > 0
          ? unreadChapters[unreadChapters.length - 1].chapterNumber
          : (latestChapter?.chapterNumber ?? null);

      result.set(sId, {
        latestChapter,
        recentNewChapters,
        unreadChapterCount: unreadChapters.length,
        hasUnread: unreadChapters.length > 0,
        lastReadChapterNumber,
        targetChapterNumber,
        followedAt,
        updatesSeenAt,
      });
    }

    return result;
  }

  private resolveChapterReleasedAt(ch: {
    releasedAt?: Date | null;
    scheduledAt?: Date | null;
    createdAt?: Date | null;
    _id?: Types.ObjectId;
  }): Date {
    if (ch.releasedAt) return new Date(ch.releasedAt);
    if (ch.scheduledAt) return new Date(ch.scheduledAt);
    return this.resolveDateFallback(ch.createdAt, ch._id);
  }

  private resolveDateFallback(
    value?: Date | null,
    objectId?: Types.ObjectId,
  ): Date {
    if (value) return new Date(value);
    if (objectId && typeof objectId.getTimestamp === 'function') {
      return objectId.getTimestamp();
    }
    return new Date(0);
  }

  async getFollowedAuthors(
    userId: string,
    query: QueryFollowedAuthorsDto,
  ): Promise<PaginatedResult<FollowedAuthorItem>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const userObjectId = this.toObjectId(userId);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: userObjectId,
          targetType: FollowTargetType.AUTHOR,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'targetId',
          foreignField: '_id',
          as: 'authorUser',
        },
      },
      { $unwind: '$authorUser' },
      {
        $match: {
          'authorUser.status': { $ne: UserStatus.BANNED },
        },
      },
      {
        $lookup: {
          from: 'author_profiles',
          localField: 'targetId',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      {
        $lookup: {
          from: 'follows',
          let: { authorId: '$targetId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', userObjectId] },
                    { $eq: ['$targetType', FollowTargetType.STORY] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'stories',
                localField: 'targetId',
                foreignField: '_id',
                as: 'story',
              },
            },
            { $unwind: '$story' },
            {
              $match: {
                'story.status': StoryStatus.PUBLISHED,
                'story.visibility': StoryVisibility.PUBLIC,
                $expr: { $eq: ['$story.authorId', '$$authorId'] },
              },
            },
            { $sort: { createdAt: -1 } },
            {
              $project: {
                _id: '$story._id',
                title: '$story.title',
                slug: '$story.slug',
                coverUrl: '$story.coverUrl',
                progressState: '$story.progressState',
                updatedAt: '$story.updatedAt',
                followedAt: '$createdAt',
                stats: {
                  chapterCount: { $ifNull: ['$story.stats.chapterCount', 0] },
                  viewCount: { $ifNull: ['$story.stats.viewCount', 0] },
                },
              },
            },
          ],
          as: 'followedStories',
        },
      },
    ];

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'authorUser.displayName': regex },
            { 'authorUser.username': regex },
            { 'profile.penName': regex },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: '$authorUser._id',
              username: '$authorUser.username',
              displayName: '$authorUser.displayName',
              penName: {
                $ifNull: [
                  { $arrayElemAt: ['$profile.penName', 0] },
                  '$authorUser.displayName',
                ],
              },
              avatarUrl: '$authorUser.avatarUrl',
              biography: {
                $ifNull: [
                  { $arrayElemAt: ['$profile.biography', 0] },
                  '',
                ],
              },
              followerCount: {
                $ifNull: [
                  { $arrayElemAt: ['$profile.followerCount', 0] },
                  0,
                ],
              },
              storyCount: {
                $ifNull: [
                  { $arrayElemAt: ['$profile.storyCount', 0] },
                  0,
                ],
              },
              totalViews: {
                $ifNull: [
                  { $arrayElemAt: ['$profile.totalViews', 0] },
                  0,
                ],
              },
              followedAt: '$createdAt',
              followedStories: { $slice: ['$followedStories', 6] },
              followedStoryCount: { $size: '$followedStories' },
            },
          },
        ],
        totalItems: [{ $count: 'count' }],
      },
    });

    const [result] = await this.followModel.aggregate(pipeline).exec();
    const items = (result?.items ?? []) as FollowedAuthorItem[];
    const totalItems = result?.totalItems?.[0]?.count ?? 0;

    return { items, pagination: buildPaginationMeta(totalItems, page, limit) };
  }

  private async validateTarget(
    currentUserId: string,
    targetType: FollowTargetType,
    targetId: Types.ObjectId,
  ): Promise<void> {
    if (targetType === FollowTargetType.STORY) {
      const story = await this.storyModel
        .findById(targetId)
        .select('_id status visibility')
        .lean()
        .exec();

      if (!story) {
        throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
      }
    } else if (targetType === FollowTargetType.AUTHOR) {
      if (targetId.toString() === currentUserId) {
        throw new BadRequestException(ErrorCode.CANNOT_FOLLOW_SELF);
      }

      const user = await this.userModel
        .findOne({
          _id: targetId,
          status: { $ne: UserStatus.BANNED },
        })
        .select('_id')
        .lean()
        .exec();

      if (!user) {
        throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
      }
    }
  }

  private async incrementCounter(
    targetType: FollowTargetType,
    targetId: Types.ObjectId,
  ): Promise<void> {
    try {
      if (targetType === FollowTargetType.STORY) {
        await this.storyModel
          .updateOne({ _id: targetId }, { $inc: { 'stats.followCount': 1 } })
          .exec();
      } else if (targetType === FollowTargetType.AUTHOR) {
        await this.authorProfileModel
          .updateOne({ userId: targetId }, { $inc: { followerCount: 1 } })
          .exec();
      }
    } catch (err) {
      this.logger.warn(
        `Không thể tăng counter cho ${targetType}:${targetId}: ${err}`,
      );
    }
  }

  private async decrementCounter(
    targetType: FollowTargetType,
    targetId: Types.ObjectId,
  ): Promise<void> {
    try {
      if (targetType === FollowTargetType.STORY) {
        await this.storyModel
          .updateOne(
            { _id: targetId, 'stats.followCount': { $gt: 0 } },
            { $inc: { 'stats.followCount': -1 } },
          )
          .exec();
      } else if (targetType === FollowTargetType.AUTHOR) {
        await this.authorProfileModel
          .updateOne(
            { userId: targetId, followerCount: { $gt: 0 } },
            { $inc: { followerCount: -1 } },
          )
          .exec();
      }
    } catch (err) {
      this.logger.warn(
        `Không thể giảm counter cho ${targetType}:${targetId}: ${err}`,
      );
    }
  }

  private buildStorySortStage(
    sortBy?: FollowStorySortOption,
  ): Record<string, 1 | -1> {
    switch (sortBy) {
      case FollowStorySortOption.TITLE:
        return { 'story.title': 1 };
      case FollowStorySortOption.UPDATED:
        return { 'story.updatedAt': -1 };
      case FollowStorySortOption.FOLLOWED_AT:
      default:
        return { createdAt: -1 };
    }
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }
    return new Types.ObjectId(value);
  }
}
