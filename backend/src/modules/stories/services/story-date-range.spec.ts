import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { validate } from 'class-validator';
import { QueryForumPostsDto } from '../../forum/dto/forum.dto.js';
import { QueryReportsDto } from '../../reports/dto/reports.dto.js';
import { describe, expect, it, vi } from 'vitest';
import { RevisionStatus } from '../../../common/enums/revision-status.enum.js';
import { AdminQueryStoriesDto } from '../dto/admin-query-stories.dto.js';
import { QueryMyStoriesDto } from '../dto/query-my-stories.dto.js';
import { StoryStatus, StoryVisibility } from '../schemas/story.schema.js';
import { AdminStoriesService } from './admin-stories.service.js';
import { StoriesService } from './stories.service.js';

const authorId = new Types.ObjectId();
const storyId = new Types.ObjectId();
const dates = { startDate: '2026-11-01', endDate: '2026-11-02' };
const createdAt = { $gte: new Date('2026-10-31T17:00:00Z'), $lt: new Date('2026-11-02T17:00:00Z') };
function chain(value: unknown) {
  const result: any = { exec: vi.fn().mockResolvedValue(value) };
  for (const method of ['select', 'populate', 'sort', 'skip', 'limit', 'lean']) result[method] = vi.fn().mockReturnValue(result);
  return result;
}

describe('story management date range', () => {
  it('preserves pagination getters and the maximum 100 limit in composed DTOs', async () => {
    for (const Dto of [QueryMyStoriesDto, AdminQueryStoriesDto, QueryForumPostsDto, QueryReportsDto]) {
      const input = Object.assign(new Dto(), dates, { page: 3, limit: 100 });
      expect(input.skip).toBe(200);
      expect(await validate(input)).toEqual([]);
      input.limit = 101;
      expect((await validate(input)).some((error) => error.property === 'limit')).toBe(true);
    }
  });
  it('shares createdAt cohort across admin list/count and preserves revision-aware status', async () => {
    const model: any = { find: vi.fn().mockReturnValue(chain([])), countDocuments: vi.fn().mockResolvedValue(0) };
    const service = new AdminStoriesService(model, {} as any, {} as any, {} as any);
    await service.findAll(Object.assign(new AdminQueryStoriesDto(), dates, { status: StoryStatus.PENDING_REVIEW }));
    expect(model.find.mock.calls[0][0]).toEqual({ createdAt, $and: [{ $or: [{ status: StoryStatus.PENDING_REVIEW }, { 'revisions.status': RevisionStatus.PENDING_REVIEW }] }] });
    await service.getCounts(dates);
    for (const [filter] of model.countDocuments.mock.calls) expect(filter.createdAt).toEqual(createdAt);
    model.countDocuments.mockClear();
    await service.getCounts();
    expect(model.countDocuments.mock.calls[0][0]).toEqual({});
  });

  it('keeps author ownership and supplies totals over more than 100 stories', async () => {
    const records = Array.from({ length: 101 }, () => ({ _id: new Types.ObjectId(), stats: { viewCount: 10, chapterCount: 2 } }));
    const model: any = { find: vi.fn().mockReturnValue(chain(records)), countDocuments: vi.fn().mockResolvedValue(101) };
    const daily: any = { find: vi.fn().mockReturnValue(chain([])), aggregate: vi.fn().mockReturnValue(chain([{ views: 9 }])) };
    const service = new StoriesService(model, {} as any, {} as any, {} as any, {} as any, undefined, daily);
    const counts = await service.getMyCounts(authorId, dates);
    expect(counts).toMatchObject({ all: 101, totalViews: 1010, totalChapters: 202, selectedPeriodViews: 9 });
    expect(model.find).toHaveBeenCalledWith({ authorId, createdAt });
    expect(daily.aggregate.mock.calls[0][0][0].$match).toEqual({ storyId: { $in: records.map((s) => s._id) }, date: { $gte: dates.startDate, $lte: dates.endDate } });
    model.find.mockReturnValue(chain([]));
    const input = Object.assign(new QueryMyStoriesDto(), dates, { status: StoryStatus.REJECTED, visibility: StoryVisibility.PRIVATE });
    expect(await validate(input)).toEqual([]);
    await service.getMyStories(authorId, input);
    expect(model.find.mock.lastCall[0]).toMatchObject({ authorId, createdAt, visibility: StoryVisibility.PRIVATE, $or: [{ status: StoryStatus.REJECTED }, { 'revisions.status': RevisionStatus.REJECTED }] });
  });

  it('daily views use actual selected records and zero-fill dates without lifetime substitution', async () => {
    const model: any = { findOne: vi.fn().mockResolvedValue({ _id: storyId, authorId, title: 'Story', stats: { viewCount: 500 } }) };
    const daily: any = { find: vi.fn().mockReturnValue(chain([{ date: '2026-11-02', views: 7 }])) };
    const service = new StoriesService(model, {} as any, {} as any, {} as any, {} as any, undefined, daily);
    const result = await service.getMyStoryDailyViews(authorId, storyId.toString(), 30, dates);
    expect(result.series.map((item: any) => item.views)).toEqual([0, 7]);
    expect(result.selectedPeriodViews).toBe(7);
    expect(result.story.totalViews).toBe(500);
    expect(daily.find).toHaveBeenCalledWith({ storyId, date: { $gte: dates.startDate, $lte: dates.endDate } });
    daily.find.mockReturnValue(chain([{ date: '2020-01-01', views: 12 }]));
    const allTime = await service.getMyStoryDailyViews(authorId, storyId.toString());
    expect(allTime.mode).toBe('all');
    expect(allTime.startDate).toBeNull();
    expect(allTime.series[0]).toMatchObject({ date: '2020-01-01', views: 12 });
    expect(allTime.series.length).toBeGreaterThan(366);
    expect(daily.find).toHaveBeenCalledWith({ storyId });
    await expect(service.getMyStoryDailyViews(new Types.ObjectId(), storyId.toString(), 30, dates)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
