import 'reflect-metadata';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createConnection, type Connection, Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DiscoveryService } from './discovery.service.js';
import {
  AuthorProfile,
  AuthorProfileSchema,
} from '../../users/schemas/author-profile.schema.js';
import { Story, StorySchema } from '../schemas/story.schema.js';
import {
  StoryDailyView,
  StoryDailyViewSchema,
} from '../schemas/story-daily-view.schema.js';
import {
  Chapter,
  ChapterSchema,
} from '../../chapters/schemas/chapter.schema.js';
import {
  ChapterUnlock,
  ChapterUnlockSchema,
} from '../../chapters/schemas/chapter-unlock.schema.js';
import { Follow, FollowSchema } from '../../follows/schemas/follow.schema.js';
import {
  ReadingHistory,
  ReadingHistorySchema,
} from '../../reading-history/schemas/reading-history.schema.js';
import {
  StoryRating,
  StoryRatingSchema,
} from '../../story-ratings/schemas/story-rating.schema.js';
import {
  RankingsQueryDto,
  RecommendationsQueryDto,
} from '../dto/discovery.dto.js';
import { toVnDateKey } from '../../../common/utils/date-key.util.js';
import { DiscoveryController } from '../controllers/discovery.controller.js';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator.js';

describe('story discovery with isolated MongoDB', () => {
  let server: MongoMemoryServer;
  let connection: Connection;
  let service: DiscoveryService;
  const reader = new Types.ObjectId();
  const otherReader = new Types.ObjectId();
  const author = new Types.ObjectId();
  const genre = new Types.ObjectId();
  const otherGenre = new Types.ObjectId();

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    connection = await createConnection(server.getUri()).asPromise();
    service = new DiscoveryService(
      connection.model(Story.name, StorySchema),
      connection.model(StoryDailyView.name, StoryDailyViewSchema),
      connection.model(ChapterUnlock.name, ChapterUnlockSchema),
      connection.model(Follow.name, FollowSchema),
      connection.model(ReadingHistory.name, ReadingHistorySchema),
      connection.model(StoryRating.name, StoryRatingSchema),
      connection.model(Chapter.name, ChapterSchema),
      connection.model(AuthorProfile.name, AuthorProfileSchema),
    );
  }, 120_000);

  afterAll(async () => {
    await connection?.close();
    await server?.stop();
  });
  beforeEach(async () => {
    for (const collection of await connection.db!.collections())
      await collection.deleteMany({});
    await connection
      .collection('users')
      .insertOne({ _id: author, displayName: 'Tác giả' });
    await connection
      .collection('author_profiles')
      .insertOne({
        userId: author,
        slug: 'tac-gia',
        penName: 'Bút danh',
        status: 'ACTIVE',
        followerCount: 0,
        storyCount: 1,
        totalViews: 0,
      });
    await connection.collection('genres').insertMany([
      { _id: genre, name: 'Fantasy', slug: 'fantasy' },
      { _id: otherGenre, name: 'Other', slug: 'other' },
    ]);
  });

  async function story(
    title: string,
    stats: Record<string, number> = {},
    visibility = 'PUBLIC',
    genreId = genre,
  ) {
    const _id = new Types.ObjectId();
    await connection
      .collection('stories')
      .insertOne({
        _id,
        title,
        slug: title,
        authorId: author,
        genreIds: [genreId],
        status: 'PUBLISHED',
        visibility,
        updatedAt: new Date(),
        stats: {
          viewCount: 1,
          followCount: 0,
          ratingCount: 0,
          ratingAverage: 0,
          chapterCount: 4,
          ...stats,
        },
      });
    return _id;
  }

  async function chapter(
    storyId: Types.ObjectId,
    chapterNumber: number,
    status = 'PUBLISHED',
    scheduledAt: Date | null = null,
  ) {
    const _id = new Types.ObjectId();
    await connection
      .collection('chapters')
      .insertOne({
        _id,
        storyId,
        chapterNumber,
        title: `Chapter ${chapterNumber}`,
        status,
        scheduledAt,
      });
    return _id;
  }

  it('validates limits, periods, metrics and optional context identifiers', async () => {
    const valid = plainToInstance(RankingsQueryDto, {
      page: '2',
      limit: '10',
      metric: 'views',
    });
    expect(await validate(valid)).toEqual([]);
    for (const invalid of [
      { page: 0 },
      { limit: 51 },
      { limit: 'NaN' },
      { metric: 'wallet' },
      { timeFrame: 'invalid' },
    ]) {
      expect(
        (await validate(plainToInstance(RankingsQueryDto, invalid))).length,
      ).toBeGreaterThan(0);
    }
    expect(
      (
        await validate(
          plainToInstance(RecommendationsQueryDto, { storyId: 'invalid' }),
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_KEY,
        DiscoveryController.prototype.recommendations,
      ),
    ).not.toBe(true);
    const periodFollows = await service.rankings(
      Object.assign(new RankingsQueryDto(), {
        metric: 'follows',
        timeFrame: 'week',
      }),
    );
    expect(periodFollows.timeFrame).toBe('week');
  });

  it('filters private stories before pagination and keeps deterministic ranks', async () => {
    await story('private', { viewCount: 99999, followCount: 99999 }, 'PRIVATE');
    const first = await story('first', { viewCount: 10, followCount: 15 });
    const second = await story('second', { viewCount: 10, followCount: 10 });
    const result = await service.rankings(
      Object.assign(new RankingsQueryDto(), { limit: 1 }),
    );
    expect(result.items.map((item) => String(item._id))).toEqual([
      String(first),
    ]);
    expect(result.hasNextPage).toBe(true);
    expect(result.items[0].author.name).toBe('Bút danh');
    expect(result.items[0].author.slug).toBe('tac-gia');
    const next = await service.rankings(
      Object.assign(new RankingsQueryDto(), { limit: 1, page: 2 }),
    );
    expect(next.items[0].rank).toBe(2);
    expect(String(next.items[0]._id)).toBe(String(second));
    expect(next.hasNextPage).toBe(false);
    const follows = await service.rankings(
      Object.assign(new RankingsQueryDto(), { metric: 'follows' }),
    );
    expect(follows.items.map((item) => item.metricValue)).toEqual([15, 10]);
  });

  it('ranks ratings using vote confidence while returning actual averages', async () => {
    await story('one-perfect-vote', { ratingAverage: 5, ratingCount: 1 });
    await story('many-good-votes', { ratingAverage: 4.6, ratingCount: 100 });
    await story('unrated', { ratingAverage: 5, ratingCount: 0 });
    const result = await service.rankings(
      Object.assign(new RankingsQueryDto(), { metric: 'rating' }),
    );
    expect(result.items.map((item) => item.title)).toEqual([
      'many-good-votes',
      'one-perfect-vote',
    ]);
    expect(result.items[0].metricValue).toBe(4.6);
  });

  it('counts only period views without filling results with all-time totals', async () => {
    const todayStory = await story('today', { viewCount: 5 });
    const oldStory = await story('old', { viewCount: 9999 });
    await connection.collection('story_daily_views').insertMany([
      { storyId: todayStory, date: toVnDateKey(), views: 5 },
      { storyId: oldStory, date: '2000-01-01', views: 9999 },
    ]);
    const result = await service.rankings(
      Object.assign(new RankingsQueryDto(), { timeFrame: 'today' }),
    );
    expect(result.items.map((item) => item.title)).toEqual(['today']);
    expect(result.items[0].metricValue).toBe(5);
  });

  it('counts paid unlocks rather than coin revenue or free unlocks', async () => {
    const paidStory = await story('paid');
    const freeStory = await story('free');
    const paid = await chapter(paidStory, 1);
    const free = await chapter(freeStory, 1);
    await connection.collection('chapter_unlocks').insertMany([
      {
        userId: reader,
        chapterId: paid,
        coinPrice: 100,
        unlockedAt: new Date(),
      },
      {
        userId: otherReader,
        chapterId: paid,
        coinPrice: 1,
        unlockedAt: new Date(),
      },
      { userId: reader, chapterId: free, coinPrice: 0, unlockedAt: new Date() },
    ]);
    const result = await service.rankings(
      Object.assign(new RankingsQueryDto(), {
        metric: 'purchases',
        timeFrame: 'today',
      }),
    );
    expect(result.items.map((item) => item.title)).toEqual(['paid']);
    expect(result.items[0].metricValue).toBe(2);
  });

  it('supports period rankings for story follows and ratings', async () => {
    const ranked = await story('period-ranked', {
      viewCount: 10,
      ratingCount: 1,
      ratingAverage: 4,
    });
    const now = new Date();
    await connection.collection('follows').insertOne({
      userId: reader,
      targetType: 'STORY',
      targetId: ranked,
      createdAt: now,
    });
    await connection.collection('story_ratings').insertOne({
      userId: reader,
      storyId: ranked,
      rating: 4,
      status: 'VISIBLE',
      createdAt: now,
      updatedAt: now,
    });

    const follows = await service.rankings(
      Object.assign(new RankingsQueryDto(), {
        metric: 'follows',
        timeFrame: 'month',
      }),
    );
    const ratings = await service.rankings(
      Object.assign(new RankingsQueryDto(), {
        metric: 'rating',
        timeFrame: 'month',
      }),
    );

    expect(follows.items[0].metricValue).toBe(1);
    expect(ratings.items[0].metricValue).toBe(4);
    expect(ratings.items[0].metricCount).toBe(1);
  });

  it('ranks authors by period views, follows, ratings, and paid chapter unlocks', async () => {
    const ranked = await story('author-period-ranked', {
      viewCount: 200,
      ratingCount: 1,
      ratingAverage: 5,
    });
    const paidChapter = await chapter(ranked, 1);
    const now = new Date();
    await connection.collection('story_daily_views').insertOne({
      storyId: ranked,
      date: toVnDateKey(now),
      views: 24,
    });
    await connection.collection('follows').insertOne({
      userId: reader,
      targetType: 'AUTHOR',
      targetId: author,
      createdAt: now,
    });
    await connection.collection('story_ratings').insertOne({
      userId: reader,
      storyId: ranked,
      rating: 5,
      status: 'VISIBLE',
      createdAt: now,
      updatedAt: now,
    });
    await connection.collection('chapter_unlocks').insertOne({
      userId: reader,
      chapterId: paidChapter,
      coinPrice: 12,
      unlockedAt: now,
    });

    await connection
      .collection('author_profiles')
      .updateOne({ userId: author }, { $set: { followerCount: 1 } });

    for (const timeFrame of ['today', 'week', 'month', 'year', 'all'] as const) {
      const results = await Promise.all(
        (['views', 'follows', 'rating', 'purchases'] as const).map((metric) =>
          service.authorRankings(
            Object.assign(new RankingsQueryDto(), { metric, timeFrame }),
          ),
        ),
      );

      expect(results.map((result) => result.items[0]?.metricValue)).toEqual(
        timeFrame === 'all' ? [200, 1, 5, 1] : [24, 1, 5, 1],
      );
      expect(results.every((result) => result.items[0]?.name === 'Bút danh')).toBe(
        true,
      );
    }
  });

  it('uses reading preferences without borrowing another account history and excludes private candidates', async () => {
    const seed = await story('read-seed');
    const firstChapter = await chapter(seed, 1);
    await story('matching-genre', { viewCount: 10 });
    await story('globally-popular', { viewCount: 9999 }, 'PUBLIC', otherGenre);
    await story('private-match', { viewCount: 99999 }, 'PRIVATE');
    await connection
      .collection('reading_history')
      .insertOne({
        userId: reader,
        storyId: seed,
        chapterId: firstChapter,
        createdAt: new Date(),
      });
    const personalized = await service.recommendations(
      String(reader),
      new RecommendationsQueryDto(),
    );
    expect(personalized.personalized).toBe(true);
    expect(personalized.items[0].title).toBe('matching-genre');
    expect(personalized.items.map((item) => item.title)).not.toContain(
      'read-seed',
    );
    expect(personalized.items.map((item) => item.title)).not.toContain(
      'private-match',
    );
    const other = await service.recommendations(
      String(otherReader),
      new RecommendationsQueryDto(),
    );
    expect(other.personalized).toBe(false);
    expect(other.items[0].title).toBe('globally-popular');
  });

  it('uses purchased chapters and followed authors as recommendation signals', async () => {
    const seed = await story('purchase-seed');
    const paid = await chapter(seed, 1);
    await story('matching-purchase', { viewCount: 50 });
    await story('popular-other', { viewCount: 9999 }, 'PUBLIC', otherGenre);
    await connection
      .collection('chapter_unlocks')
      .insertOne({
        userId: reader,
        chapterId: paid,
        coinPrice: 10,
        unlockedAt: new Date(),
      });
    const result = await service.recommendations(
      String(reader),
      new RecommendationsQueryDto(),
    );
    expect(result.items[0].title).toBe('matching-purchase');
    const followedAuthor = new Types.ObjectId();
    const followedStory = await story(
      'followed-author-story',
      { viewCount: 1 },
      'PUBLIC',
      otherGenre,
    );
    await connection
      .collection('stories')
      .updateOne(
        { _id: followedStory },
        { $set: { authorId: followedAuthor } },
      );
    await connection
      .collection('follows')
      .insertOne({
        userId: otherReader,
        targetType: 'AUTHOR',
        targetId: followedAuthor,
        createdAt: new Date(),
      });
    const following = await service.recommendations(
      String(otherReader),
      new RecommendationsQueryDto(),
    );
    expect(following.items[0].title).toBe('followed-author-story');
  });

  it('resumes the latest available chapter, counts distinct chapters, and respects release gaps', async () => {
    const seed = await story('context');
    const first = await chapter(seed, 1);
    const second = await chapter(seed, 2);
    const hidden = await chapter(seed, 3, 'HIDDEN');
    const afterGap = await chapter(seed, 4);
    await connection.collection('reading_history').insertMany(
      [first, first, second, hidden, afterGap].map((chapterId, index) => ({
        userId: reader,
        storyId: seed,
        chapterId,
        createdAt: new Date(2000, 0, index + 1),
      })),
    );
    const result = await service.recommendations(
      String(reader),
      Object.assign(new RecommendationsQueryDto(), { storyId: String(seed) }),
    );
    expect(result.readingContext).toEqual({
      chapterNumber: 2,
      chaptersRead: 2,
      totalChapters: 2,
      progressPercent: 100,
    });
    expect(result.items.map((item) => String(item._id))).not.toContain(
      String(seed),
    );
    const other = await service.recommendations(
      String(otherReader),
      Object.assign(new RecommendationsQueryDto(), { storyId: String(seed) }),
    );
    expect(other.readingContext).toBeNull();
  });

  it('uses followed stories and positive ratings, and excludes completed reading even when old', async () => {
    const seed = await story('completed', { chapterCount: 1 });
    const readChapter = await chapter(seed, 1);
    await story('new-in-preferred-genre', { viewCount: 10 });
    await story('popular-unrelated', { viewCount: 5000 }, 'PUBLIC', otherGenre);
    await connection
      .collection('reading_history')
      .insertOne({
        userId: reader,
        storyId: seed,
        chapterId: readChapter,
        createdAt: new Date('2000-01-01'),
      });
    await connection
      .collection('follows')
      .insertOne({
        userId: otherReader,
        targetType: 'STORY',
        targetId: seed,
        createdAt: new Date(),
      });
    const followed = await service.recommendations(
      String(otherReader),
      new RecommendationsQueryDto(),
    );
    expect(followed.items[0].title).toBe('new-in-preferred-genre');
    const completed = await service.recommendations(
      String(reader),
      new RecommendationsQueryDto(),
    );
    expect(completed.items.map((item) => item.title)).not.toContain(
      'completed',
    );
    await connection.collection('follows').deleteMany({});
    await connection
      .collection('story_ratings')
      .insertOne({
        userId: otherReader,
        storyId: seed,
        rating: 5,
        status: 'VISIBLE',
        updatedAt: new Date(),
      });
    const rated = await service.recommendations(
      String(otherReader),
      new RecommendationsQueryDto(),
    );
    expect(rated.items[0].title).toBe('new-in-preferred-genre');
  });

  it('never resumes a scheduled chapter and falls back to the last available read', async () => {
    const seed = await story('scheduled');
    const first = await chapter(seed, 1);
    const future = await chapter(
      seed,
      2,
      'PUBLISHED',
      new Date(Date.now() + 86400000),
    );
    await connection.collection('reading_history').insertMany([
      {
        userId: reader,
        storyId: seed,
        chapterId: first,
        createdAt: new Date('2000-01-01'),
      },
      {
        userId: reader,
        storyId: seed,
        chapterId: future,
        createdAt: new Date(),
      },
    ]);
    const result = await service.recommendations(
      String(reader),
      Object.assign(new RecommendationsQueryDto(), { storyId: String(seed) }),
    );
    expect(result.readingContext?.chapterNumber).toBe(1);
    expect(result.readingContext?.totalChapters).toBe(1);
  });

  it('preserves different preferences for active accounts instead of saturating every genre equally', async () => {
    const follows: { userId: Types.ObjectId; targetType: string; targetId: Types.ObjectId; createdAt: Date }[] = [];
    for (let index = 0; index < 12; index++) {
      const a = await story(`seed-a-${index}`, {}, 'PUBLIC', genre);
      const b = await story(`seed-b-${index}`, {}, 'PUBLIC', otherGenre);
      follows.push({ userId: reader, targetType: 'STORY', targetId: a, createdAt: new Date() });
      follows.push({ userId: otherReader, targetType: 'STORY', targetId: b, createdAt: new Date() });
      if (index < 6) {
        follows.push({ userId: reader, targetType: 'STORY', targetId: b, createdAt: new Date() });
        follows.push({ userId: otherReader, targetType: 'STORY', targetId: a, createdAt: new Date() });
      }
    }
    await connection.collection('follows').insertMany(follows);
    await story('candidate-a', { viewCount: 1000 }, 'PUBLIC', genre);
    await story('candidate-b', { viewCount: 500 }, 'PUBLIC', otherGenre);
    const [a, b] = await Promise.all([
      service.recommendations(String(reader), new RecommendationsQueryDto()),
      service.recommendations(String(otherReader), new RecommendationsQueryDto()),
    ]);
    expect(a.items[0].title).toBe('candidate-a');
    expect(b.items[0].title).toBe('candidate-b');
  });

  it('handles legacy reading records without timestamps', async () => {
    const seed = await story('legacy');
    const readChapter = await chapter(seed, 1);
    await connection
      .collection('reading_history')
      .insertOne({ userId: reader, storyId: seed, chapterId: readChapter });
    const result = await service.recommendations(
      String(reader),
      Object.assign(new RecommendationsQueryDto(), { storyId: String(seed) }),
    );
    expect(result.personalized).toBe(true);
    expect(result.readingContext?.chapterNumber).toBe(1);
  });
});
