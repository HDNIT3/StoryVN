import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DateRangeQueryDto } from '../../../common/dto/date-range.dto.js';
import {
  calculateGrowthPercent,
  dateRangeKeys,
  previousDateRange,
  recordedDateRange,
  resolveDateRange,
} from '../../../common/utils/date-range.util.js';
import { toVnDateKey } from '../../../common/utils/date-key.util.js';
import { Story, StoryDocument } from '../../stories/schemas/story.schema.js';
import {
  StoryDailyView,
  StoryDailyViewDocument,
} from '../../stories/schemas/story-daily-view.schema.js';
import {
  Chapter,
  ChapterDocument,
  ChapterStatus,
} from '../../chapters/schemas/chapter.schema.js';
import {
  ChapterUnlock,
  ChapterUnlockDocument,
} from '../../chapters/schemas/chapter-unlock.schema.js';
import {
  Comment,
  CommentDocument,
  CommentStatus,
} from '../../comments/schemas/comment.schema.js';
import {
  StoryRating,
  StoryRatingDocument,
  StoryRatingStatus,
} from '../../story-ratings/schemas/story-rating.schema.js';
import {
  Follow,
  FollowDocument,
  FollowTargetType,
} from '../../follows/schemas/follow.schema.js';

type Metrics = {
  stories: number;
  chapters: number;
  views: number;
  comments: number;
  ratings: number;
  follows: number;
  unlocks: number;
  coins: number;
};
const emptyMetrics = (): Metrics => ({
  stories: 0,
  chapters: 0,
  views: 0,
  comments: 0,
  ratings: 0,
  follows: 0,
  unlocks: 0,
  coins: 0,
});

@Injectable()
export class AuthorAnalyticsService {
  constructor(
    @InjectModel(Story.name) private readonly stories: Model<StoryDocument>,
    @InjectModel(Chapter.name)
    private readonly chapters: Model<ChapterDocument>,
    @InjectModel(StoryDailyView.name)
    private readonly views: Model<StoryDailyViewDocument>,
    @InjectModel(StoryRating.name)
    private readonly ratings: Model<StoryRatingDocument>,
    @InjectModel(Comment.name)
    private readonly comments: Model<CommentDocument>,
    @InjectModel(Follow.name) private readonly follows: Model<FollowDocument>,
    @InjectModel(ChapterUnlock.name)
    private readonly unlocks: Model<ChapterUnlockDocument>,
  ) {}

  async getAnalytics(
    userId: string,
    query: DateRangeQueryDto = {},
    identifier?: string,
  ) {
    const range = resolveDateRange(query);
    const previous = previousDateRange(range);
    const ownedStories = await this.stories
      .find({
        authorId: new Types.ObjectId(userId),
        ...(identifier
          ? Types.ObjectId.isValid(identifier)
            ? { _id: new Types.ObjectId(identifier) }
            : { slug: identifier }
          : {}),
      })
      .select('_id title slug status progressState stats createdAt')
      .lean()
      .exec();
    if (identifier && !ownedStories.length)
      throw new NotFoundException(
        'Không tìm thấy tác phẩm thuộc tài khoản của bạn',
      );
    const storyIds = ownedStories.map((story) => story._id);
    const ownedChapters = await this.chapters
      .find({ storyId: { $in: storyIds } })
      .select(
        '_id storyId title chapterNumber status isFree coinPrice wordCount viewCount createdAt',
      )
      .lean()
      .exec();
    const dateGroup = (field: string) => ({
      $dateToString: {
        format: '%Y-%m-%d',
        date: `$${field}`,
        timezone: '+07:00',
      },
    });
    const [
      viewGroups,
      ratingGroups,
      commentGroups,
      followGroups,
      unlockGroups,
    ] = await Promise.all([
      this.views.aggregate([
        {
          $match: {
            storyId: { $in: storyIds },
            ...(range.allTime
              ? {}
              : { date: { $gte: previous.startDate, $lte: range.endDate } }),
          },
        },
        {
          $group: {
            _id: { storyId: '$storyId', date: '$date' },
            count: { $sum: '$views' },
          },
        },
      ]),
      this.ratings.aggregate([
        {
          $match: {
            storyId: { $in: storyIds },
            status: StoryRatingStatus.VISIBLE,
          },
        },
        {
          $group: {
            _id: {
              storyId: '$storyId',
              date: dateGroup('createdAt'),
              rating: '$rating',
            },
            count: { $sum: 1 },
          },
        },
      ]),
      this.comments.aggregate([
        {
          $match: { storyId: { $in: storyIds }, status: CommentStatus.VISIBLE },
        },
        {
          $group: {
            _id: { storyId: '$storyId', date: dateGroup('createdAt') },
            count: { $sum: 1 },
          },
        },
      ]),
      this.follows.aggregate([
        {
          $match: {
            targetType: FollowTargetType.STORY,
            targetId: { $in: storyIds },
          },
        },
        {
          $group: {
            _id: { storyId: '$targetId', date: dateGroup('createdAt') },
            count: { $sum: 1 },
          },
        },
      ]),
      this.unlocks.aggregate([
        {
          $match: {
            chapterId: { $in: ownedChapters.map((chapter) => chapter._id) },
            ...(range.allTime
              ? {}
              : {
                  unlockedAt: { $gte: previous.start, $lt: range.endExclusive },
                }),
          },
        },
        {
          $group: {
            _id: { chapterId: '$chapterId', date: dateGroup('unlockedAt') },
            count: { $sum: 1 },
            coins: { $sum: '$coinPrice' },
          },
        },
      ]),
    ]);
    const period = emptyMetrics();
    const previousPeriod = emptyMetrics();
    const timeline = new Map<
      string,
      Metrics & { date: string; label: string }
    >();
    const distribution = [1, 2, 3, 4, 5].map((stars) => ({ stars, count: 0 }));
    const snapshotDistribution = [1, 2, 3, 4, 5].map((stars) => ({
      stars,
      count: 0,
    }));
    const storyRows = new Map(
      ownedStories.map((story) => [
        story._id.toString(),
        {
          _id: story._id.toString(),
          title: story.title,
          slug: story.slug,
          status: story.status,
          progressState: story.progressState,
          ...emptyMetrics(),
          totalViews: story.stats?.viewCount || 0,
          totalChapters: 0,
          totalWords: 0,
          followers: 0,
          ratingCount: 0,
          ratingScore: 0,
          ratingAverage: null as number | null,
        },
      ]),
    );
    const chapterRows = new Map(
      ownedChapters.map((chapter) => [
        chapter._id.toString(),
        {
          _id: chapter._id.toString(),
          storyId: chapter.storyId.toString(),
          title: chapter.title,
          chapterNumber: chapter.chapterNumber,
          status: chapter.status,
          isFree: chapter.isFree,
          words: chapter.wordCount || 0,
          totalViews: chapter.viewCount || 0,
          unlocks: 0,
          coins: 0,
        },
      ]),
    );
    const storyStatuses: Record<string, number> = {};
    const chapterStatuses: Record<string, number> = {};
    const selected = (date: string) =>
      range.allTime || (date >= range.startDate && date <= range.endDate);
    const day = (date: string) => {
      if (!timeline.has(date))
        timeline.set(date, {
          date,
          label: `${date.slice(8)}/${date.slice(5, 7)}`,
          ...emptyMetrics(),
        });
      return timeline.get(date)!;
    };
    const record = (
      date: string | undefined,
      key: keyof Metrics,
      count: number,
      storyId: string,
    ) => {
      if (!date) return;
      if (selected(date)) {
        period[key] += count;
        day(date)[key] += count;
        const row = storyRows.get(storyId);
        if (row) row[key] += count;
      } else if (
        !range.allTime &&
        date >= previous.startDate &&
        date <= previous.endDate
      )
        previousPeriod[key] += count;
    };
    for (const story of ownedStories) {
      storyStatuses[story.status] = (storyStatuses[story.status] || 0) + 1;
      record(
        story.createdAt ? toVnDateKey(story.createdAt) : undefined,
        'stories',
        1,
        story._id.toString(),
      );
    }
    for (const chapter of ownedChapters) {
      chapterStatuses[chapter.status] =
        (chapterStatuses[chapter.status] || 0) + 1;
      const row = storyRows.get(chapter.storyId.toString());
      if (row) {
        row.totalChapters++;
        row.totalWords += chapter.wordCount || 0;
      }
      record(
        chapter.createdAt ? toVnDateKey(chapter.createdAt) : undefined,
        'chapters',
        1,
        chapter.storyId.toString(),
      );
    }
    for (const group of viewGroups)
      record(
        group._id.date,
        'views',
        group.count,
        group._id.storyId.toString(),
      );
    for (const group of ratingGroups) {
      const stars = Number(group._id.rating);
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) continue;
      record(
        group._id.date,
        'ratings',
        group.count,
        group._id.storyId.toString(),
      );
      snapshotDistribution[stars - 1].count += group.count;
      if (selected(group._id.date))
        distribution[stars - 1].count += group.count;
      const row = storyRows.get(group._id.storyId.toString());
      if (row) {
        row.ratingCount += group.count;
        row.ratingScore += stars * group.count;
      }
    }
    for (const group of commentGroups)
      record(
        group._id.date,
        'comments',
        group.count,
        group._id.storyId.toString(),
      );
    for (const group of followGroups) {
      record(
        group._id.date,
        'follows',
        group.count,
        group._id.storyId.toString(),
      );
      const row = storyRows.get(group._id.storyId.toString());
      if (row) row.followers += group.count;
    }
    for (const group of unlockGroups) {
      const chapter = chapterRows.get(group._id.chapterId.toString());
      if (!chapter) continue;
      record(group._id.date, 'unlocks', group.count, chapter.storyId);
      record(group._id.date, 'coins', group.coins, chapter.storyId);
      if (selected(group._id.date)) {
        chapter.unlocks += group.count;
        chapter.coins += group.coins;
      }
    }
    const chartRange = range.allTime
      ? recordedDateRange([...timeline.keys()])
      : range;
    for (const date of dateRangeKeys(chartRange)) day(date);
    const average = (items: typeof distribution) => {
      const count = items.reduce((sum, item) => sum + item.count, 0);
      return count
        ? Number(
            (
              items.reduce((sum, item) => sum + item.stars * item.count, 0) /
              count
            ).toFixed(2),
          )
        : null;
    };
    const rows = [...storyRows.values()]
      .map(({ ratingScore, ...row }) => ({
        ...row,
        ratingAverage: row.ratingCount
          ? Number((ratingScore / row.ratingCount).toFixed(2))
          : null,
      }))
      .sort(
        (a, b) =>
          b.views - a.views || b.coins - a.coins || a._id.localeCompare(b._id),
      );
    return {
      range: {
        mode: range.allTime ? 'all' : 'range',
        startDate: range.allTime ? null : range.startDate,
        endDate: range.allTime ? null : range.endDate,
      },
      period: { ...period, ratingAverage: average(distribution) },
      growth: range.allTime
        ? null
        : Object.fromEntries(
            Object.entries(period).map(([key, value]) => [
              key,
              calculateGrowthPercent(
                value,
                previousPeriod[key as keyof Metrics],
              ),
            ]),
          ),
      snapshot: {
        stories: ownedStories.length,
        chapters: ownedChapters.length,
        publishedChapters: chapterStatuses[ChapterStatus.PUBLISHED] || 0,
        words: rows.reduce((sum, row) => sum + row.totalWords, 0),
        views: rows.reduce((sum, row) => sum + row.totalViews, 0),
        follows: rows.reduce((sum, row) => sum + row.followers, 0),
        ratings: snapshotDistribution.reduce(
          (sum, item) => sum + item.count,
          0,
        ),
        ratingAverage: average(snapshotDistribution),
      },
      timeline: [...timeline.values()].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
      distribution,
      snapshotDistribution,
      storyStatuses,
      chapterStatuses,
      stories: rows,
      chapters: [...chapterRows.values()].sort(
        (a, b) =>
          a.chapterNumber - b.chapterNumber || a._id.localeCompare(b._id),
      ),
    };
  }
}
