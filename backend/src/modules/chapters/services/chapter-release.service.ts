import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { countWords } from '../../../common/utils/text.util.js';
import {
  Follow,
  FollowDocument,
  FollowTargetType,
} from '../../follows/schemas/follow.schema.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import {
  Story,
  StoryDocument,
  StoryStatus,
  StoryVisibility,
} from '../../stories/schemas/story.schema.js';
import {
  User,
  UserDocument,
  UserStatus,
} from '../../users/schemas/user.schema.js';
import {
  Chapter,
  ChapterDocument,
  ChapterStatus,
} from '../schemas/chapter.schema.js';

const SCHEDULED_POLL_INTERVAL_MS = 60_000;
const SCHEDULE_GRACE_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class ChapterReleaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChapterReleaseService.name);
  private intervalRef: ReturnType<typeof setInterval> | null = null;
  private startupTimeoutRef: ReturnType<typeof setTimeout> | null = null;
  private isProcessingScheduled = false;

  constructor(
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Story.name)
    private readonly storyModel: Model<StoryDocument>,
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.startupTimeoutRef = setTimeout(() => {
      void this.processDueScheduledReleases();
    }, 3000);
    if (typeof this.startupTimeoutRef.unref === 'function') {
      this.startupTimeoutRef.unref();
    }

    this.intervalRef = setInterval(() => {
      void this.processDueScheduledReleases();
    }, SCHEDULED_POLL_INTERVAL_MS);
    if (typeof this.intervalRef.unref === 'function') {
      this.intervalRef.unref();
    }
  }

  onModuleDestroy(): void {
    if (this.startupTimeoutRef) {
      clearTimeout(this.startupTimeoutRef);
      this.startupTimeoutRef = null;
    }
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  /**
   * Quét định kỳ các chương đã được duyệt và tới giờ phát hành (scheduledAt <= now)
   * nhưng chưa từng gửi thông báo chương mới cho người theo dõi truyện.
   */
  async processDueScheduledReleases(): Promise<number> {
    if (this.isProcessingScheduled) {
      return 0;
    }

    this.isProcessingScheduled = true;
    try {
      const now = new Date();
      const storyIds = await this.chapterModel.distinct('storyId', {
        status: ChapterStatus.PUBLISHED,
        notifyFollowersPending: true,
        followerNotifiedAt: null,
        $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }],
      });

      if (!storyIds || storyIds.length === 0) {
        return 0;
      }

      let totalNotifications = 0;
      for (const storyId of storyIds) {
        try {
          totalNotifications += await this.releaseAndNotifyStoryChapters(
            storyId as Types.ObjectId,
            { bumpStoryUpdatedAt: true, now },
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Lỗi khi xử lý phát hành chương theo lịch cho story ${String(storyId)}: ${msg}`,
          );
        }
      }

      return totalNotifications;
    } finally {
      this.isProcessingScheduled = false;
    }
  }

  /**
   * Kiểm tra các chương đủ điều kiện phát hành liên tục của một truyện, đánh dấu releasedAt/followerNotifiedAt
   * một cách atomic (chống gửi trùng) rồi gửi thông báo NEW_CHAPTER tới tất cả độc giả đang theo dõi truyện.
   */
  async releaseAndNotifyStoryChapters(
    storyIdInput: string | Types.ObjectId,
    options: { bumpStoryUpdatedAt?: boolean; now?: Date } = {},
  ): Promise<number> {
    const storyIdStr = String(storyIdInput);
    if (!Types.ObjectId.isValid(storyIdStr)) {
      return 0;
    }

    const storyId = new Types.ObjectId(storyIdStr);
    const story = await this.storyModel
      .findById(storyId)
      .select('_id title slug coverUrl authorId status visibility')
      .lean()
      .exec();

    if (
      !story ||
      story.status !== StoryStatus.PUBLISHED ||
      story.visibility !== StoryVisibility.PUBLIC
    ) {
      return 0;
    }

    const now = options.now ?? new Date();

    // Chỉ xét chuỗi chương liên tục đã đến hạn hiển thị tới độc giả
    const firstUnreleased = await this.chapterModel
      .findOne({
        storyId,
        $or: [
          { status: { $ne: ChapterStatus.PUBLISHED } },
          { scheduledAt: { $gt: now } },
        ],
      })
      .sort({ chapterNumber: 1 })
      .select('chapterNumber')
      .lean()
      .exec();

    const releaseFilter: Record<string, any> = {
      storyId,
      status: ChapterStatus.PUBLISHED,
      notifyFollowersPending: true,
      followerNotifiedAt: null,
      $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }],
    };

    if (firstUnreleased) {
      releaseFilter.chapterNumber = { $lt: firstUnreleased.chapterNumber };
    }

    const candidates = await this.chapterModel
      .find(releaseFilter)
      .sort({ chapterNumber: 1 })
      .select('_id chapterNumber title scheduledAt releasedAt updatedAt')
      .lean()
      .exec();

    if (!candidates || candidates.length === 0) {
      return 0;
    }

    const claimedChapters: Array<{
      _id: Types.ObjectId;
      chapterNumber: number;
      title: string;
    }> = [];

    for (const candidate of candidates) {
      const effectiveReleasedAt = this.resolveReleasedAt(candidate, now);

      const claimed = await this.chapterModel
        .findOneAndUpdate(
          {
            _id: candidate._id,
            status: ChapterStatus.PUBLISHED,
            followerNotifiedAt: null,
            $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }],
          },
          {
            $set: {
              followerNotifiedAt: now,
              notifyFollowersPending: false,
              releasedAt: effectiveReleasedAt,
            },
          },
          { returnDocument: 'after' },
        )
        .select('_id chapterNumber title')
        .lean()
        .exec();

      if (claimed) {
        claimedChapters.push({
          _id: claimed._id,
          chapterNumber: claimed.chapterNumber,
          title: claimed.title,
        });
      }
    }

    if (claimedChapters.length === 0) {
      return 0;
    }

    await this.syncStoryReleasedStats(storyId, now, {
      bumpUpdatedAt: options.bumpStoryUpdatedAt !== false,
    });

    const follows = await this.followModel
      .find({
        targetType: FollowTargetType.STORY,
        targetId: story._id,
      })
      .select('userId')
      .lean()
      .exec();

    if (!follows || follows.length === 0) {
      return 0;
    }

    const authorIdStr = story.authorId ? String(story.authorId) : null;
    const candidateFollowerIds = Array.from(
      new Set(
        follows
          .map((f) => String(f.userId))
          .filter((uid) => Types.ObjectId.isValid(uid) && uid !== authorIdStr),
      ),
    );

    if (candidateFollowerIds.length === 0) {
      return 0;
    }

    const activeFollowers = await this.userModel
      .find({
        _id: {
          $in: candidateFollowerIds.map((id) => new Types.ObjectId(id)),
        },
        status: { $ne: UserStatus.BANNED },
      })
      .select('_id')
      .lean()
      .exec();

    const activeFollowerIds = activeFollowers.map((u) => String(u._id));
    if (activeFollowerIds.length === 0) {
      return 0;
    }

    let sentCount = 0;
    for (const chapter of claimedChapters) {
      sentCount += await this.notificationsService.notifyFollowersNewChapter({
        followerIds: activeFollowerIds,
        story: {
          _id: story._id,
          title: story.title,
          slug: story.slug,
          coverUrl: story.coverUrl ?? null,
          authorId: story.authorId ?? null,
        },
        chapter,
      });
    }

    return sentCount;
  }

  private resolveReleasedAt(
    chapter: {
      releasedAt?: Date | null;
      scheduledAt?: Date | null;
      updatedAt?: Date | null;
    },
    now: Date,
  ): Date {
    if (chapter.releasedAt) {
      return new Date(chapter.releasedAt);
    }

    if (chapter.scheduledAt) {
      const scheduledTime = new Date(chapter.scheduledAt).getTime();
      const updatedTime = chapter.updatedAt
        ? new Date(chapter.updatedAt).getTime()
        : 0;
      const elapsedSinceSchedule = now.getTime() - scheduledTime;

      // Nếu chương được hẹn giờ trước khi đến giờ phát hành và mới đến hạn gần đây,
      // giữ đúng mốc scheduledAt để đồng bộ với thời điểm độc giả bắt đầu nhìn thấy chương.
      if (
        elapsedSinceSchedule >= 0 &&
        elapsedSinceSchedule <= SCHEDULE_GRACE_WINDOW_MS &&
        updatedTime > 0 &&
        updatedTime < scheduledTime
      ) {
        return new Date(chapter.scheduledAt);
      }
    }

    return now;
  }

  private async syncStoryReleasedStats(
    storyId: Types.ObjectId,
    now: Date,
    options: { bumpUpdatedAt?: boolean } = {},
  ): Promise<void> {
    const firstUnreleased = await this.chapterModel
      .findOne({
        storyId,
        $or: [
          { status: { $ne: ChapterStatus.PUBLISHED } },
          { scheduledAt: { $gt: now } },
        ],
      })
      .sort({ chapterNumber: 1 })
      .select('chapterNumber')
      .lean()
      .exec();

    const countFilter: Record<string, any> = {
      storyId,
      status: ChapterStatus.PUBLISHED,
      $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }],
    };

    if (firstUnreleased) {
      countFilter.chapterNumber = { $lt: firstUnreleased.chapterNumber };
    }

    const chapters = await this.chapterModel
      .find(countFilter)
      .select('wordCount content')
      .lean()
      .exec();

    let wordCount = 0;
    const needWordCountBackfill: any[] = [];

    for (const ch of chapters as any[]) {
      let chWords = ch.wordCount;
      if (typeof chWords !== 'number') {
        chWords = countWords(ch.content || '');
        needWordCountBackfill.push({
          updateOne: {
            filter: { _id: ch._id },
            update: { $set: { wordCount: chWords } },
          },
        });
      }
      wordCount += chWords;
    }

    if (needWordCountBackfill.length > 0) {
      await this.chapterModel.bulkWrite(needWordCountBackfill);
    }

    const updateFields: Record<string, any> = {
      'stats.chapterCount': chapters.length,
      'stats.wordCount': wordCount,
    };

    if (options.bumpUpdatedAt) {
      updateFields.updatedAt = now;
    }

    await this.storyModel.updateOne(
      { _id: storyId },
      { $set: updateFields },
      options.bumpUpdatedAt ? {} : { timestamps: false },
    );
  }
}

