import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { ContentStatisticsQueryDto } from './content-statistics-query.dto.js';

const authorId = new Types.ObjectId();
const oldStoryId = new Types.ObjectId();
const newStoryId = new Types.ObjectId();
const genreId = new Types.ObjectId();
const query = {
  authorId: authorId.toString(),
  startDate: '2026-01-01',
  endDate: '2026-01-02',
};

function chain(value: unknown[]) {
  const result = {
    select: vi.fn(),
    sort: vi.fn(),
    limit: vi.fn(),
    lean: vi.fn().mockResolvedValue(value),
  };
  result.select.mockReturnValue(result);
  result.sort.mockReturnValue(result);
  result.limit.mockReturnValue(result);
  return result;
}

function fixture(withActivity = true, profilePenName: string | null = 'Bút danh A', applicationPenName: string | null = null) {
  const oldStory = {
    _id: oldStoryId,
    title: 'Truyện cũ',
    slug: 'truyen-cu',
    authorId,
    genreIds: [genreId],
    status: 'PUBLISHED',
    createdAt: new Date('2020-01-01T00:00:00Z'),
  };
  const newStory = {
    ...oldStory,
    _id: newStoryId,
    title: 'Truyện mới',
    slug: 'truyen-moi',
    status: 'PENDING_REVIEW',
    createdAt: new Date('2025-12-31T17:00:00Z'),
  };
  const stories = {
    find: vi
      .fn()
      .mockReturnValueOnce(chain(withActivity ? [oldStory, newStory] : []))
      .mockReturnValueOnce(chain(withActivity ? [newStory] : [])),
    distinct: vi.fn().mockResolvedValue(withActivity ? [authorId] : []),
  };
  const chapters = {
    aggregate: vi.fn().mockResolvedValue(
      withActivity
        ? [
            {
              _id: {
                storyId: oldStoryId,
                date: '2026-01-01',
                status: 'PUBLISHED',
              },
              count: 3,
            },
            {
              _id: {
                storyId: oldStoryId,
                date: '2026-01-02',
                status: 'PENDING_REVIEW',
              },
              count: 2,
            },
          ]
        : [],
    ),
    find: vi.fn().mockReturnValue(chain([])),
  };
  const views = {
    aggregate: vi
      .fn()
      .mockResolvedValue(
        withActivity
          ? [{ _id: { storyId: oldStoryId, date: '2026-01-01' }, views: 12 }]
          : [],
      ),
  };
  const users = {
    find: vi
      .fn()
      .mockReturnValue(
        chain([
          { _id: authorId, displayName: 'Tác giả A', username: 'author-a' },
        ]),
      ),
  };
  const requests = {
    distinct: vi.fn().mockResolvedValue([]),
    find: vi.fn().mockReturnValueOnce(chain([])).mockReturnValue(chain(applicationPenName ? [{ userId: authorId, penName: applicationPenName }] : [])),
    countDocuments: vi.fn().mockResolvedValue(0),
  };
  const genres = {
    find: vi.fn().mockReturnValue(chain([{ _id: genreId, name: 'Phiêu lưu' }])),
  };
  const profiles = { find: vi.fn().mockReturnValue(chain(profilePenName ? [{ userId: authorId, penName: profilePenName }] : [])) };
  const service: AdminDashboardService = Reflect.construct(
    AdminDashboardService,
    [{}, users, requests, stories, views, chapters, {}, {}, genres, profiles],
  );
  return { service, stories, chapters, views, requests };
}

describe('content statistics', () => {
  it.each([
    ['Bút danh hiện tại', 'Bút danh đăng ký', 'Bút danh hiện tại'],
    [null, 'Bút danh đăng ký', 'Bút danh đăng ký'],
    [null, null, 'Chưa có bút danh'],
  ])('labels author options using the full display name and current or submitted pen name', async (profileName, applicationName, expectedName) => {
    const { service } = fixture(true, profileName, applicationName);
    const data = await service.getContentStatistics(query);
    expect(data.authors).toEqual([{
      _id: authorId.toString(), username: 'author-a', penName: profileName || applicationName,
      name: `Tác giả A - ${expectedName}`,
    }]);
  });

  it('includes new chapters and reads on old stories without counting the old story as new', async () => {
    const { service } = fixture();
    const data = await service.getContentStatistics(query);
    expect(data.counts).toEqual({
      stories: 1,
      chapters: 5,
      authors: 1,
      views: 12,
    });
    expect(data.stories[0]).toMatchObject({
      _id: oldStoryId.toString(),
      newStory: false,
      chapters: 5,
      publishedChapters: 3,
      pendingChapters: 2,
      views: 12,
      authorName: 'Tác giả A',
    });
    expect(data.storyStatuses).toEqual({ PENDING_REVIEW: 1 });
    expect(data.chapterStatuses).toEqual({ PUBLISHED: 3, PENDING_REVIEW: 2 });
    expect(data.pending).toEqual({
      stories: 1,
      chapters: 2,
      authorRequests: 0,
    });
    expect(data.categories).toEqual([
      { id: genreId.toString(), name: 'Phiêu lưu', count: 1, percentage: 100 },
    ]);
    expect(data.timeline).toEqual([
      {
        date: '2026-01-01',
        label: '01/01',
        stories: 1,
        chapters: 3,
        views: 12,
      },
      { date: '2026-01-02', label: '02/01', stories: 0, chapters: 2, views: 0 },
    ]);
  });

  it('applies the author and Vietnam date boundaries to content, reads and all queue types', async () => {
    const { service, stories, chapters, views, requests } = fixture();
    await service.getContentStatistics(query);
    expect(stories.find.mock.calls[0][0]).toEqual({ authorId });
    const createdAt = {
      $gte: new Date('2025-12-31T17:00:00Z'),
      $lt: new Date('2026-01-02T17:00:00Z'),
    };
    expect(chapters.aggregate.mock.calls[0][0][0]).toEqual({
      $match: { storyId: { $in: [oldStoryId, newStoryId] }, createdAt },
    });
    expect(views.aggregate.mock.calls[0][0][0]).toEqual({
      $match: {
        storyId: { $in: [oldStoryId, newStoryId] },
        date: { $gte: query.startDate, $lte: query.endDate },
      },
    });
    expect(stories.find.mock.calls[1][0]).toEqual({
      authorId,
      status: 'PENDING_REVIEW',
      createdAt,
    });
    expect(chapters.find.mock.calls[0][0]).toMatchObject({
      status: 'PENDING_REVIEW',
      createdAt,
    });
    expect(requests.countDocuments).toHaveBeenCalledWith({
      status: 'PENDING',
      userId: authorId,
      createdAt,
    });
  });

  it('omits date predicates for all time and retains older activity', async () => {
    const { service, chapters, views, requests } = fixture();
    const data = await service.getContentStatistics();
    expect(data.counts.stories).toBe(2);
    expect(data.timeline[0].date).toBe('2020-01-01');
    expect(chapters.aggregate.mock.calls[0][0][0].$match).not.toHaveProperty(
      'createdAt',
    );
    expect(views.aggregate.mock.calls[0][0][0].$match).not.toHaveProperty(
      'date',
    );
    expect(requests.countDocuments).toHaveBeenCalledWith({ status: 'PENDING' });
  });

  it('returns zero totals and a continuous empty timeline when no activity matches', async () => {
    const { service } = fixture(false);
    const data = await service.getContentStatistics(query);
    expect(data.counts).toEqual({
      stories: 0,
      chapters: 0,
      authors: 0,
      views: 0,
    });
    expect(data.stories).toEqual([]);
    expect(data.timeline).toHaveLength(2);
    expect(data.categories).toEqual([]);
  });

  it('validates author ids before passing them to MongoDB', async () => {
    expect(
      await validate(plainToInstance(ContentStatisticsQueryDto, query)),
    ).toEqual([]);
    expect(
      await validate(
        plainToInstance(ContentStatisticsQueryDto, { authorId: 'invalid' }),
      ),
    ).toHaveLength(1);
  });
});
