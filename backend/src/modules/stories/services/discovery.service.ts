import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  getTimeFrameStartDateKey,
  toVnDateKey,
} from '../../../common/utils/date-key.util.js';
import { ChapterUnlock } from '../../chapters/schemas/chapter-unlock.schema.js';
import { Follow, FollowTargetType } from '../../follows/schemas/follow.schema.js';
import { ReadingHistory } from '../../reading-history/schemas/reading-history.schema.js';
import {
  StoryRating,
  StoryRatingStatus,
} from '../../story-ratings/schemas/story-rating.schema.js';
import {
  RankingsQueryDto,
  RecommendationsQueryDto,
} from '../dto/discovery.dto.js';
import {
  Story,
  StoryStatus,
  StoryVisibility,
} from '../schemas/story.schema.js';
import {
  Chapter,
  ChapterStatus,
} from '../../chapters/schemas/chapter.schema.js';
import { StoryDailyView } from '../schemas/story-daily-view.schema.js';
import {
  AuthorProfile,
  AuthorProfileStatus,
} from '../../users/schemas/author-profile.schema.js';

const PUBLIC_STORY = {
  status: StoryStatus.PUBLISHED,
  visibility: StoryVisibility.PUBLIC,
};

export interface StoryResult {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  coverUrl: string | null;
  author: { _id: Types.ObjectId | null; name: string; username: string | null };
  stats: {
    chapterCount: number;
    viewCount: number;
    ratingAverage: number;
    ratingCount: number;
  };
  genres: { _id: Types.ObjectId; name: string; slug: string }[];
  updatedAt: Date;
  metricValue: number;
  metricCount?: number;
  description?: string;
}

export interface AuthorRankingResult {
  _id: Types.ObjectId;
  username: string;
  name: string;
  avatarUrl: string | null;
  stats: { followerCount: number; storyCount: number; totalViews: number };
  metricValue: number;
  metricCount?: number;
  score?: number;
}

function getRankingDateRange(query: RankingsQueryDto, now: Date) {
  let startKey: string | null = null;
  let endKey: string | null = null;
  if (query.dateMode === 'day' && query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date)) {
    const parsed = new Date(`${query.date}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime()) && toVnDateKey(parsed) === query.date) {
      startKey = query.date;
      endKey = query.date;
    }
  } else if (query.dateMode === 'month' && query.month && /^\d{4}-\d{2}$/.test(query.month)) {
    const [year, month] = query.month.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    if (month >= 1 && month <= 12 && start.getUTCFullYear() === year) {
      startKey = `${query.month}-01`;
      endKey = toVnDateKey(new Date(Date.UTC(year, month, 0)));
    }
  } else if (query.dateMode === 'year' && query.year && /^\d{4}$/.test(query.year)) {
    const year = Number(query.year);
    if (year >= 2000 && year <= new Date().getUTCFullYear()) {
      startKey = `${query.year}-01-01`;
      endKey = `${query.year}-12-31`;
    }
  }
  if (!startKey || !endKey) {
    startKey = getTimeFrameStartDateKey(query.timeFrame, now);
    endKey = toVnDateKey(now);
  }
  const startDate = startKey ? new Date(`${startKey}T00:00:00+07:00`) : null;
  const endDate = endKey ? new Date(`${endKey}T23:59:59.999+07:00`) : null;
  return { startKey, endKey, startDate, endDate };
}

/** Only resolve display metadata after sorting/limiting. No per-story network queries. */
function displayStages(includeDescription = false): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'users',
        localField: 'authorId',
        foreignField: '_id',
        as: 'authorUser',
      },
    },
    {
      $lookup: {
        from: 'author_profiles',
        localField: 'authorId',
        foreignField: 'userId',
        as: 'profile',
      },
    },
    {
      $lookup: {
        from: 'genres',
        localField: 'genreIds',
        foreignField: '_id',
        as: 'genres',
      },
    },
    {
      $project: {
        title: 1,
        slug: 1,
        coverUrl: { $ifNull: ['$coverUrl', null] },
        updatedAt: 1,
        progressState: 1,
        metricValue: 1,
        metricCount: 1,
        ...(includeDescription ? { description: { $ifNull: ['$description', ''] } } : {}),
        author: {
          _id: '$authorId',
          username: { $ifNull: [{ $first: '$authorUser.username' }, null] },
          name: {
            $ifNull: [
              { $first: '$profile.penName' },
              { $first: '$authorUser.displayName' },
              { $first: '$authorUser.username' },
              'Tác giả',
            ],
          },
        },
        stats: {
          chapterCount: { $ifNull: ['$stats.chapterCount', 0] },
          viewCount: { $ifNull: ['$stats.viewCount', 0] },
          ratingAverage: { $ifNull: ['$stats.ratingAverage', 0] },
          ratingCount: { $ifNull: ['$stats.ratingCount', 0] },
        },
        genres: {
          $map: {
            input: '$genres',
            as: 'g',
            in: { _id: '$$g._id', name: '$$g.name', slug: '$$g.slug' },
          },
        },
      },
    },
  ];
}

function displayAuthorStages(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'author_profiles',
        localField: '_id',
        foreignField: 'userId',
        as: 'profile',
      },
    },
    { $unwind: '$profile' },
    { $match: { 'profile.status': AuthorProfileStatus.ACTIVE } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $project: {
        username: { $ifNull: [{ $first: '$user.username' }, ''] },
        name: {
          $ifNull: [
            '$profile.penName',
            { $first: '$user.displayName' },
            { $first: '$user.username' },
            'Tác giả',
          ],
        },
        avatarUrl: { $ifNull: [{ $first: '$user.avatarUrl' }, null] },
        stats: {
          followerCount: { $ifNull: ['$profile.followerCount', 0] },
          storyCount: { $ifNull: ['$profile.storyCount', 0] },
          totalViews: { $ifNull: ['$profile.totalViews', 0] },
        },
        metricValue: 1,
        metricCount: 1,
        score: 1,
      },
    },
  ];
}

function joinPublicStory(): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'stories',
        localField: '_id',
        foreignField: '_id',
        as: 'story',
      },
    },
    { $unwind: '$story' },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$story',
            {
              metricValue: '$metricValue',
              metricCount: '$metricCount',
              score: { $ifNull: ['$score', '$metricValue'] },
            },
          ],
        },
      },
    },
    { $match: PUBLIC_STORY },
  ];
}

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectModel(Story.name) private readonly stories: Model<Story>,
    @InjectModel(StoryDailyView.name)
    private readonly views: Model<StoryDailyView>,
    @InjectModel(ChapterUnlock.name)
    private readonly unlocks: Model<ChapterUnlock>,
    @InjectModel(Follow.name) private readonly follows: Model<Follow>,
    @InjectModel(ReadingHistory.name)
    private readonly history: Model<ReadingHistory>,
    @InjectModel(StoryRating.name) private readonly ratings: Model<StoryRating>,
    @InjectModel(Chapter.name) private readonly chapters: Model<Chapter>,
    @InjectModel(AuthorProfile.name)
    private readonly authorProfiles: Model<AuthorProfile>,
  ) {}

  async rankings(query: RankingsQueryDto) {
    const { metric, timeFrame, page, limit } = query;
    const now = new Date();
    const { startKey, endKey, startDate, endDate } = getRankingDateRange(query, now);
    let pipeline: PipelineStage[];
    let source: Model<any> = this.stories;
    if (metric === 'purchases' || metric === 'revenue') {
      source = this.unlocks;
      pipeline = [
        {
          $match: {
            coinPrice: { $gt: 0 },
            unlockedAt: {
              $lte: endDate ?? now,
              ...(startKey
                ? { $gte: startDate! }
                : {}),
            },
          },
        },
        {
          $lookup: {
            from: 'chapters',
            localField: 'chapterId',
            foreignField: '_id',
            as: 'chapter',
          },
        },
        { $unwind: '$chapter' },
        {
          $group: {
            _id: '$chapter.storyId',
            metricValue: { $sum: metric === 'revenue' ? '$coinPrice' : 1 },
          },
        },
        ...joinPublicStory(),
      ];
    } else if (metric === 'follows' && startKey) {
      source = this.follows;
      pipeline = [
        {
          $match: {
            targetType: FollowTargetType.STORY,
            createdAt: {
              $gte: new Date(`${startKey}T00:00:00+07:00`),
              $lte: endDate ?? now,
            },
          },
        },
        {
          $group: {
            _id: '$targetId',
            metricValue: { $sum: 1 },
          },
        },
        ...joinPublicStory(),
      ];
    } else if (metric === 'rating' && startKey) {
      source = this.ratings;
      pipeline = [
        {
          $match: {
            status: StoryRatingStatus.VISIBLE,
            updatedAt: {
              $gte: new Date(`${startKey}T00:00:00+07:00`),
              $lte: endDate ?? now,
            },
          },
        },
        {
          $group: {
            _id: '$storyId',
            metricValue: { $avg: '$rating' },
            metricCount: { $sum: 1 },
          },
        },
        {
          $set: {
            score: {
              $divide: [
                { $add: [{ $multiply: ['$metricValue', '$metricCount'] }, 17.5] },
                { $add: ['$metricCount', 5] },
              ],
            },
          },
        },
        ...joinPublicStory(),
      ];
    } else if (metric === 'views' && startKey) {
      source = this.views;
      pipeline = [
        { $match: { date: { $gte: startKey, $lte: endKey! } } },
        { $group: { _id: '$storyId', metricValue: { $sum: '$views' } } },
        ...joinPublicStory(),
      ];
    } else {
      const field =
        metric === 'views'
          ? '$stats.viewCount'
          : metric === 'follows'
            ? '$stats.followCount'
            : '$stats.ratingAverage';
      pipeline = [
        {
          $match: {
            ...PUBLIC_STORY,
            ...(metric === 'rating' ? { 'stats.ratingCount': { $gt: 0 } } : {}),
          },
        },
        { $set: { metricValue: { $ifNull: [field, 0] } } },
        ...(metric === 'rating'
          ? [{ $set: { metricCount: { $ifNull: ['$stats.ratingCount', 0] } } }]
          : []),
        // Fixed prior: five votes at 3.5 stars. Display the real average, sort by adjusted score.
        {
          $set: {
            score:
              metric === 'rating'
                ? {
                    $divide: [
                      {
                        $add: [
                          { $multiply: ['$metricValue', '$stats.ratingCount'] },
                          17.5,
                        ],
                      },
                      { $add: ['$stats.ratingCount', 5] },
                    ],
                  }
                : '$metricValue',
          },
        },
      ];
    }
    const rows = await source
      .aggregate<StoryResult>([
        ...pipeline,
        { $match: { metricValue: { $gt: 0 } } },
        { $sort: { score: -1, metricValue: -1, _id: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit + 1 },
        ...displayStages(),
      ])
      .exec();
    return {
      metric,
      timeFrame,
      page,
      hasNextPage: rows.length > limit,
      items: rows
        .slice(0, limit)
        .map((row, index) => ({
          ...row,
          rank: (page - 1) * limit + index + 1,
        })),
    };
  }

  async authorRankings(query: RankingsQueryDto) {
    const { metric, timeFrame, page, limit } = query;
    const now = new Date();
    const { startKey, endKey, startDate, endDate } = getRankingDateRange(query, now);
    const eventStart = startDate;
    let source: Model<any>;
    let pipeline: PipelineStage[];

    if (metric === 'follows' && !startKey) {
      source = this.authorProfiles;
      pipeline = [
        { $match: { status: AuthorProfileStatus.ACTIVE } },
        {
          $project: {
            _id: '$userId',
            metricValue: { $ifNull: ['$followerCount', 0] },
          },
        },
      ];
    } else if (metric === 'follows') {
      source = this.follows;
      pipeline = [
        {
          $match: {
            targetType: FollowTargetType.AUTHOR,
            createdAt: { $gte: eventStart, $lte: endDate },
          },
        },
        { $group: { _id: '$targetId', metricValue: { $sum: 1 } } },
      ];
    } else if (metric === 'views' && startKey) {
      source = this.views;
      pipeline = [
        { $match: { date: { $gte: startKey, $lte: endKey! } } },
        {
          $lookup: {
            from: 'stories',
            localField: 'storyId',
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
        {
          $group: {
            _id: '$story.authorId',
            metricValue: { $sum: '$views' },
          },
        },
      ];
    } else if (metric === 'views') {
      source = this.stories;
      pipeline = [
        { $match: PUBLIC_STORY },
        {
          $group: {
            _id: '$authorId',
            metricValue: { $sum: { $ifNull: ['$stats.viewCount', 0] } },
          },
        },
      ];
    } else if (metric === 'rating') {
      source = this.ratings;
      pipeline = [
        {
          $match: {
            status: StoryRatingStatus.VISIBLE,
            ...(eventStart
              ? { updatedAt: { $gte: eventStart, $lte: endDate } }
              : {}),
          },
        },
        {
          $lookup: {
            from: 'stories',
            localField: 'storyId',
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
        {
          $group: {
            _id: '$story.authorId',
            ratingTotal: { $sum: '$rating' },
            metricCount: { $sum: 1 },
          },
        },
        {
          $set: {
            metricValue: { $divide: ['$ratingTotal', '$metricCount'] },
            score: {
              $divide: [
                { $add: ['$ratingTotal', 17.5] },
                { $add: ['$metricCount', 5] },
              ],
            },
          },
        },
      ];
    } else {
      source = this.unlocks;
      pipeline = [
        {
          $match: {
            coinPrice: { $gt: 0 },
            ...(eventStart
              ? { unlockedAt: { $gte: eventStart, $lte: endDate } }
              : { unlockedAt: { $lte: now } }),
          },
        },
        {
          $lookup: {
            from: 'chapters',
            localField: 'chapterId',
            foreignField: '_id',
            as: 'chapter',
          },
        },
        { $unwind: '$chapter' },
        {
          $lookup: {
            from: 'stories',
            localField: 'chapter.storyId',
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
        {
          $group: {
            _id: '$story.authorId',
            metricValue: { $sum: metric === 'revenue' ? '$coinPrice' : 1 },
          },
        },
      ];
    }

    const rows = await source
      .aggregate<AuthorRankingResult>([
        ...pipeline,
        ...displayAuthorStages(),
        { $match: { metricValue: { $gt: 0 } } },
        { $sort: { score: -1, metricValue: -1, _id: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit + 1 },
      ])
      .exec();

    return {
      metric,
      timeFrame,
      page,
      hasNextPage: rows.length > limit,
      items: rows.slice(0, limit).map((row, index) => ({
        ...row,
        rank: (page - 1) * limit + index + 1,
      })),
    };
  }

  async recommendations(userId: string, query: RecommendationsQueryDto) {
    const user = new Types.ObjectId(userId);
    const [reads, purchases, follows, ratings, context] = await Promise.all([
      this.history
        .aggregate<{
          _id: Types.ObjectId;
          chapters: Types.ObjectId[];
          lastReadAt: Date;
        }>([
          { $match: { userId: user } },
          {
            $group: {
              _id: '$storyId',
              chapters: { $addToSet: '$chapterId' },
              lastReadAt: {
                $max: { $ifNull: ['$createdAt', { $toDate: '$_id' }] },
              },
            },
          },
          { $sort: { lastReadAt: -1 } },
          { $limit: 100 },
        ])
        .exec(),
      this.unlocks
        .aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: { userId: user, coinPrice: { $gt: 0 } } },
          { $sort: { unlockedAt: -1 } },
          { $limit: 500 },
          {
            $lookup: {
              from: 'chapters',
              localField: 'chapterId',
              foreignField: '_id',
              as: 'chapter',
            },
          },
          { $unwind: '$chapter' },
          { $group: { _id: '$chapter.storyId', count: { $sum: 1 } } },
        ])
        .exec(),
      this.follows
        .find({ userId: user })
        .sort({ createdAt: -1 })
        .limit(200)
        .select('targetId targetType')
        .lean()
        .exec(),
      this.ratings
        .find({ userId: user, status: StoryRatingStatus.VISIBLE })
        .sort({ updatedAt: -1 })
        .limit(100)
        .select('storyId rating')
        .lean()
        .exec(),
      query.storyId
        ? this.stories
            .findOne({ _id: query.storyId, ...PUBLIC_STORY })
            .select('genreIds')
            .lean()
            .exec()
        : null,
    ]);
    const weights = new Map<string, number>();
    const addWeight = (id: Types.ObjectId, weight: number) =>
      weights.set(String(id), (weights.get(String(id)) ?? 0) + weight);
    const readsById = new Map(reads.map((row) => [String(row._id), row]));
    for (const row of reads) {
      // Fresh reading should quickly influence discovery, then fade over a month
      // so a new preference can take precedence over older habits.
      const ageDays = Math.max(
        0,
        (Date.now() - row.lastReadAt.getTime()) / 86400000,
      );
      const freshnessBoost = 4 * Math.max(0, 1 - ageDays / 30);
      addWeight(row._id, 1 + freshnessBoost);
    }
    for (const row of purchases)
      addWeight(row._id, 3 + Math.min(row.count, 5) / 5);
    for (const row of follows)
      if (row.targetType === 'STORY') addWeight(row.targetId, 3);
    for (const row of ratings) addWeight(row.storyId, row.rating - 3);
    const seeds = await this.stories
      .find({
        _id: { $in: [...weights.keys()].map((id) => new Types.ObjectId(id)) },
        ...PUBLIC_STORY,
      })
      .select('genreIds authorId stats.chapterCount')
      .lean()
      .exec();
    const genreWeights = new Map<string, number>();
    const authorWeights = new Map<string, number>();
    const excluded = new Set<string>(query.storyId ? [query.storyId] : []);
    for (const seed of seeds) {
      const read = readsById.get(String(seed._id));
      const progress =
        read && seed.stats?.chapterCount
          ? Math.min(read.chapters.length / seed.stats.chapterCount, 1)
          : 0;
      const weight = (weights.get(String(seed._id)) ?? 0) + progress * 2;
      for (const genre of seed.genreIds)
        genreWeights.set(
          String(genre),
          (genreWeights.get(String(genre)) ?? 0) + weight,
        );
      authorWeights.set(
        String(seed.authorId),
        (authorWeights.get(String(seed.authorId)) ?? 0) + weight / 2,
      );
      // Recommendations are discovery: completed/recently opened stories remain in the existing library/history.
      if (
        progress >= 1 ||
        (read && Date.now() - read.lastReadAt.getTime() < 7 * 86400000)
      )
        excluded.add(String(seed._id));
    }
    for (const follow of follows)
      if (follow.targetType === 'AUTHOR')
        authorWeights.set(String(follow.targetId), 8);
    for (const genre of context?.genreIds ?? [])
      genreWeights.set(
        String(genre),
        (genreWeights.get(String(genre)) ?? 0) + 4,
      );
    // Normalize the whole profile, rather than clipping each interest independently.
    // Per-interest caps made all genres tie for active readers, falling back to global views.
    const genreScale = Math.max(1, ...[...genreWeights.values()].map(Math.abs));
    const authorScale = Math.max(1, ...[...authorWeights.values()].map(Math.abs));
    const terms = [
      ...[...genreWeights].map(([id, weight]) => ({
        $cond: [
          { $in: [new Types.ObjectId(id), { $ifNull: ['$genreIds', []] }] },
          (weight / genreScale) * 12,
          0,
        ],
      })),
      ...[...authorWeights].map(([id, weight]) => ({
        $cond: [
          { $eq: ['$authorId', new Types.ObjectId(id)] },
          (weight / authorScale) * 8,
          0,
        ],
      })),
    ];
    const items = await this.stories
      .aggregate<StoryResult>([
        {
          $match: {
            ...PUBLIC_STORY,
            _id: { $nin: [...excluded].map((id) => new Types.ObjectId(id)) },
          },
        },
        { $set: { score: terms.length ? { $add: terms } : 0 } },
        { $sort: { score: -1, 'stats.viewCount': -1, updatedAt: -1, _id: 1 } },
        { $limit: query.limit },
        ...displayStages(true),
      ])
      .exec();
    const readingContext = context
      ? await this.readingContext(user, context._id)
      : null;
    return {
      items,
      readingContext,
      personalized:
        seeds.length > 0 || follows.some((row) => row.targetType === 'AUTHOR'),
    };
  }

  private async readingContext(
    userId: Types.ObjectId,
    storyId: Types.ObjectId,
  ) {
    const now = new Date();
    // Match the reader's sequential-release rule; do not navigate into hidden or scheduled chapters.
    const firstUnreleased = await this.chapters
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
    const available = {
      storyId,
      status: ChapterStatus.PUBLISHED,
      $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }],
      ...(firstUnreleased
        ? { chapterNumber: { $lt: firstUnreleased.chapterNumber } }
        : {}),
    };
    const [total, readChapters] = await Promise.all([
      this.chapters.countDocuments(available).exec(),
      this.history
        .aggregate<{ chapterNumber: number; lastReadAt: Date }>([
          { $match: { userId, storyId } },
          {
            $group: {
              _id: '$chapterId',
              lastReadAt: {
                $max: { $ifNull: ['$createdAt', { $toDate: '$_id' }] },
              },
            },
          },
          {
            $lookup: {
              from: 'chapters',
              localField: '_id',
              foreignField: '_id',
              as: 'chapter',
            },
          },
          { $unwind: '$chapter' },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: ['$chapter', { lastReadAt: '$lastReadAt' }],
              },
            },
          },
          { $match: available },
          { $sort: { lastReadAt: -1, _id: 1 } },
          { $project: { chapterNumber: 1, lastReadAt: 1 } },
        ])
        .exec(),
    ]);
    if (!readChapters.length || !total) return null;
    return {
      chapterNumber: readChapters[0].chapterNumber,
      chaptersRead: readChapters.length,
      totalChapters: total,
      progressPercent: Math.min(
        100,
        Math.round((readChapters.length / total) * 100),
      ),
    };
  }
}
