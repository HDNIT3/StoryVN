import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthorAnalyticsService } from './author-analytics.service.js';

const authorId = new Types.ObjectId();
const storyId = new Types.ObjectId();
const otherStoryId = new Types.ObjectId();
const chapterId = new Types.ObjectId();
const period = { startDate: '2026-01-01', endDate: '2026-01-02' };

function chain(value: unknown[]) {
  const result = {
    select: vi.fn(),
    lean: vi.fn(),
    exec: vi.fn().mockResolvedValue(value),
  };
  result.select.mockReturnValue(result);
  result.lean.mockReturnValue(result);
  return result;
}
function fixture(empty = false) {
  const storyDocs = empty
    ? []
    : [
        {
          _id: storyId,
          title: 'Truyện cũ',
          slug: 'truyen-cu',
          status: 'PUBLISHED',
          progressState: 'ONGOING',
          stats: { viewCount: 999 },
          createdAt: new Date('2020-01-01T00:00:00Z'),
        },
        {
          _id: otherStoryId,
          title: 'Truyện mới',
          slug: 'truyen-moi',
          status: 'DRAFT',
          stats: { viewCount: 1 },
          createdAt: new Date('2025-12-31T17:00:00Z'),
        },
      ];
  const stories = { find: vi.fn().mockReturnValue(chain(storyDocs)) };
  const chapters = {
    find: vi
      .fn()
      .mockReturnValue(
        chain(
          empty
            ? []
            : [
                {
                  _id: chapterId,
                  storyId,
                  title: 'Chương mới của truyện cũ',
                  chapterNumber: 1,
                  status: 'PUBLISHED',
                  isFree: false,
                  coinPrice: 99,
                  viewCount: 37,
                  wordCount: 1200,
                  createdAt: new Date('2025-12-31T17:00:00Z'),
                },
              ],
        ),
      ),
  };
  const aggregate = (items: unknown[]) => ({
    aggregate: vi.fn().mockResolvedValue(empty ? [] : items),
  });
  const views = aggregate([
    { _id: { storyId, date: '2025-12-30' }, count: 6 },
    { _id: { storyId, date: '2026-01-01' }, count: 12 },
  ]);
  const ratings = aggregate([
    { _id: { storyId, date: '2026-01-01', rating: 5 }, count: 10 },
    { _id: { storyId: otherStoryId, date: '2020-01-01', rating: 1 }, count: 1 },
  ]);
  const comments = aggregate([
    { _id: { storyId, date: '2026-01-02' }, count: 3 },
  ]);
  const follows = aggregate([
    { _id: { storyId, date: '2026-01-01' }, count: 2 },
    { _id: { storyId, date: '2020-01-01' }, count: 4 },
  ]);
  const unlocks = aggregate([
    { _id: { chapterId, date: '2026-01-02' }, count: 3, coins: 21 },
  ]);
  const service: AuthorAnalyticsService = Reflect.construct(
    AuthorAnalyticsService,
    [stories, chapters, views, ratings, comments, follows, unlocks],
  );
  return {
    service,
    stories,
    chapters,
    views,
    ratings,
    comments,
    follows,
    unlocks,
  };
}

describe('author analytics', () => {
  it('keeps period activity on older stories and computes weighted visible ratings', async () => {
    const { service } = fixture();
    const data = await service.getAnalytics(authorId.toString(), period);
    expect(data.period).toEqual({
      stories: 1,
      chapters: 1,
      views: 12,
      comments: 3,
      ratings: 10,
      follows: 2,
      unlocks: 3,
      coins: 21,
      ratingAverage: 5,
    });
    expect(data.snapshot).toMatchObject({
      stories: 2,
      chapters: 1,
      views: 1000,
      words: 1200,
      follows: 6,
      ratings: 11,
      ratingAverage: 4.64,
    });
    expect(
      data.stories.find((row) => row._id === storyId.toString()),
    ).toMatchObject({
      chapters: 1,
      views: 12,
      coins: 21,
      ratingAverage: 5,
      ratingCount: 10,
    });
    expect(data.growth?.views).toBe(100);
  });

  it('reconciles daily, story and chapter totals using paid unlock amounts instead of current prices', async () => {
    const { service } = fixture();
    const data = await service.getAnalytics(authorId.toString(), period);
    for (const key of [
      'stories',
      'chapters',
      'views',
      'comments',
      'ratings',
      'follows',
      'unlocks',
      'coins',
    ] as const) {
      expect(data.timeline.reduce((sum, row) => sum + row[key], 0)).toBe(
        data.period[key],
      );
      expect(data.stories.reduce((sum, row) => sum + row[key], 0)).toBe(
        data.period[key],
      );
    }
    expect(data.chapters[0]).toMatchObject({
      totalViews: 37,
      unlocks: 3,
      coins: 21,
    });
    expect(data.timeline.map((row) => row.date)).toEqual([
      '2026-01-01',
      '2026-01-02',
    ]);
    expect(data.distribution.reduce((sum, row) => sum + row.count, 0)).toBe(
      data.period.ratings,
    );
  });

  it('scopes every source to owned stories, visible interactions and Vietnam calendar boundaries', async () => {
    const {
      service,
      stories,
      chapters,
      views,
      ratings,
      comments,
      follows,
      unlocks,
    } = fixture();
    await service.getAnalytics(authorId.toString(), period);
    expect(stories.find).toHaveBeenCalledWith({ authorId });
    const scope = { $in: [storyId, otherStoryId] };
    expect(chapters.find).toHaveBeenCalledWith({ storyId: scope });
    expect(views.aggregate.mock.calls[0][0][0]).toEqual({
      $match: {
        storyId: scope,
        date: { $gte: '2025-12-30', $lte: '2026-01-02' },
      },
    });
    expect(ratings.aggregate.mock.calls[0][0][0]).toEqual({
      $match: { storyId: scope, status: 'VISIBLE' },
    });
    expect(comments.aggregate.mock.calls[0][0][0]).toEqual({
      $match: { storyId: scope, status: 'VISIBLE' },
    });
    expect(follows.aggregate.mock.calls[0][0][0]).toEqual({
      $match: { targetType: 'STORY', targetId: scope },
    });
    expect(unlocks.aggregate.mock.calls[0][0][0]).toEqual({
      $match: {
        chapterId: { $in: [chapterId] },
        unlockedAt: {
          $gte: new Date('2025-12-29T17:00:00Z'),
          $lt: new Date('2026-01-02T17:00:00Z'),
        },
      },
    });
  });

  it.each([storyId.toString(), 'truyen-cua-nguoi-khac'])(
    'rejects an unavailable or unowned story before loading its analytics',
    async (identifier) => {
      const { service, stories, chapters, ratings } = fixture(true);
      await expect(
        service.getAnalytics(authorId.toString(), period, identifier),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(stories.find.mock.calls[0][0]).toMatchObject({ authorId });
      expect(chapters.find).not.toHaveBeenCalled();
      expect(ratings.aggregate).not.toHaveBeenCalled();
    },
  );

  it('returns null scores for no ratings and zero fills empty periods without fabricating reads', async () => {
    const { service } = fixture(true);
    const data = await service.getAnalytics(authorId.toString(), period);
    expect(data.period).toMatchObject({
      views: 0,
      ratings: 0,
      ratingAverage: null,
      coins: 0,
    });
    expect(data.snapshot.ratingAverage).toBeNull();
    expect(data.stories).toEqual([]);
    expect(data.timeline).toHaveLength(2);
  });

  it('includes all recorded activity for all time and disables period comparisons', async () => {
    const { service, views, unlocks } = fixture();
    const data = await service.getAnalytics(authorId.toString());
    expect(data.period.views).toBe(18);
    expect(data.period.ratingAverage).toBe(4.64);
    expect(data.growth).toBeNull();
    expect(data.timeline[0].date).toBe('2020-01-01');
    expect(views.aggregate.mock.calls[0][0][0].$match).not.toHaveProperty(
      'date',
    );
    expect(unlocks.aggregate.mock.calls[0][0][0].$match).not.toHaveProperty(
      'unlockedAt',
    );
  });
});
