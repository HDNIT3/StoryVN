import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { FilterStoriesDto, StorySortOption, StoryViewTimeFrame } from '../dto/filter-stories.dto.js';
import { StoryStatus, StoryVisibility } from '../schemas/story.schema.js';
import { StoriesService } from './stories.service.js';

function query<T>(value: T) {
  return {
    select: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(value),
  };
}

function setup() {
  const tagId = new Types.ObjectId();
  const genreId = new Types.ObjectId();
  const tags = [
    { _id: tagId, name: 'Trọng sinh', slug: 'trong-sinh' },
    { _id: new Types.ObjectId(), name: 'Hệ thống', slug: 'he-thong' },
    { _id: new Types.ObjectId(), name: 'Sư đồ', slug: 'su-do' },
  ];
  const story = {
    _id: new Types.ObjectId(),
    tagIds: tags,
    stats: { chapterCount: 0, wordCount: 0 },
  };
  const results = query([story]);
  const stories = {
    find: vi.fn().mockReturnValue(results),
    countDocuments: vi.fn().mockResolvedValue(1),
  };
  const tagModel = { findOne: vi.fn(() => query({ _id: tagId })) };
  const dailyViews = {
    aggregate: vi.fn(() => query([])),
    find: vi.fn(() => query([])),
  };
  const service = new StoriesService(
    stories as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    tagModel as never,
    undefined,
    dailyViews as never,
  );
  vi.spyOn(service, 'getLiveStats').mockResolvedValue({ chapterCount: 0, wordCount: 0 });

  return { genreId, tagId, tags, stories, results, tagModel, service };
}

describe('public story tag filter', () => {
  it.each([false, true])('combines genre and tag and returns at most two tags per card (period sort: %s)', async (periodSort) => {
    const { genreId, tagId, tags, stories, results, tagModel, service } = setup();
    const dto = Object.assign(new FilterStoriesDto(), {
      genre: genreId.toString(),
      tag: 'trong-sinh',
      ...(periodSort && { sortBy: StorySortOption.MOST_VIEWED, timeFrame: StoryViewTimeFrame.WEEK }),
    });

    const result = await service.filterStories(dto);

    expect(tagModel.findOne).toHaveBeenCalledWith({ slug: 'trong-sinh', isActive: true });
    expect(stories.find).toHaveBeenNthCalledWith(1, {
      status: StoryStatus.PUBLISHED,
      visibility: StoryVisibility.PUBLIC,
      genreIds: genreId,
      tagIds: tagId,
    });
    expect(results.populate).toHaveBeenCalledWith({
      path: 'tagIds', select: 'name slug', match: { isActive: true },
    });
    expect(result.items[0].tags).toEqual(tags.slice(0, 2));
    expect(result.pagination.totalItems).toBe(1);
  });

  it('returns no stories for an unknown or inactive tag', async () => {
    const { stories, tagModel, service } = setup();
    tagModel.findOne.mockReturnValueOnce(query(null));
    const result = await service.filterStories(Object.assign(new FilterStoriesDto(), { tag: 'khong-hop-le' }));

    expect(result.items).toEqual([]);
    expect(result.pagination.totalItems).toBe(0);
    expect(stories.find).not.toHaveBeenCalled();
  });
});
