import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { ForumPostDocument, ForumPostStatus } from '../../forum/schemas/forum-post.schema.js';
import { StoryDocument, StoryStatus, StoryVisibility } from '../../stories/schemas/story.schema.js';
import { AdminQueryReportsDto } from '../dto/reports.dto.js';
import { ContentReportDocument, ContentReportSchema, ContentReportTargetType } from '../schemas/content-report.schema.js';
import { ReportsService } from './reports.service.js';

const userId = '507f1f77bcf86cd799439100';
const targetId = '507f1f77bcf86cd799439111';
const dto = { targetType: ContentReportTargetType.FORUM_POST, targetId, reason: ' spam ' };

describe('ReportsService', () => {
  const chain = {
    select: vi.fn().mockReturnThis(), sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(), lean: vi.fn(),
  };
  const reports = { updateOne: vi.fn(), aggregate: vi.fn(), find: vi.fn(), countDocuments: vi.fn() };
  const posts = { exists: vi.fn() };
  const stories = { exists: vi.fn() };
  const chapters = { exists: vi.fn() };
  const comments = { exists: vi.fn() };
  let service: ReportsService;

  beforeEach(() => {
    vi.clearAllMocks();
    reports.updateOne.mockResolvedValue({});
    reports.aggregate.mockResolvedValue([]);
    reports.find.mockReturnValue(chain);
    reports.countDocuments.mockResolvedValue(0);
    chain.lean.mockResolvedValue([]);
    posts.exists.mockResolvedValue({ _id: targetId });
    stories.exists.mockResolvedValue({ _id: targetId });
    chapters.exists.mockResolvedValue({ _id: targetId });
    comments.exists.mockResolvedValue({ _id: targetId });
    service = new ReportsService(
      reports as unknown as Model<ContentReportDocument>,
      posts as unknown as Model<ForumPostDocument>,
      stories as unknown as Model<StoryDocument>,
      chapters as any,
      comments as any,
    );
  });

  it('has one report per user and target, with a bounded trimmed reason', () => {
    expect(ContentReportSchema.get('collection')).toBe('content_reports');
    expect(ContentReportSchema.indexes()).toContainEqual([
      { targetType: 1, targetId: 1, userId: 1 }, { unique: true },
    ]);
    expect(ContentReportSchema.path('reason').options).toMatchObject({ trim: true, minlength: 1, maxlength: 1000 });
  });

  it('upserts once without replacing the first reason or timestamps', async () => {
    await expect(service.submit(userId, dto)).resolves.toEqual({ reported: true });
    expect(posts.exists).toHaveBeenCalledWith({ _id: new Types.ObjectId(targetId), status: ForumPostStatus.VISIBLE });
    expect(reports.updateOne).toHaveBeenCalledWith(
      { targetType: dto.targetType, targetId: new Types.ObjectId(targetId), userId: new Types.ObjectId(userId) },
      { $setOnInsert: { reason: 'spam', createdAt: expect.any(Date), updatedAt: expect.any(Date) } },
      { upsert: true, runValidators: true, timestamps: false },
    );
    expect(stories.exists).not.toHaveBeenCalled();
  });

  it('accepts only published public stories', async () => {
    await service.submit(userId, { ...dto, targetType: ContentReportTargetType.STORY });
    expect(stories.exists).toHaveBeenCalledWith({
      _id: new Types.ObjectId(targetId), status: StoryStatus.PUBLISHED, visibility: StoryVisibility.PUBLIC,
    });
    expect(posts.exists).not.toHaveBeenCalled();
  });

  it.each(Object.values(ContentReportTargetType))('rejects unavailable %s targets without writing', async (targetType) => {
    posts.exists.mockResolvedValue(null);
    stories.exists.mockResolvedValue(null);
    chapters.exists.mockResolvedValue(null);
    comments.exists.mockResolvedValue(null);
    await expect(service.submit(userId, { ...dto, targetType })).rejects.toBeInstanceOf(NotFoundException);
    expect(reports.updateOne).not.toHaveBeenCalled();
  });

  it.each([
    { ...dto, targetId: 'bad' },
    { ...dto, targetType: 'OTHER' as ContentReportTargetType },
    { ...dto, reason: '   ' },
    { ...dto, reason: 'x'.repeat(1001) },
  ])('validates direct service submissions: %j', async (input) => {
    await expect(service.submit(userId, input)).rejects.toBeInstanceOf(BadRequestException);
    expect(reports.updateOne).not.toHaveBeenCalled();
    expect(posts.exists).not.toHaveBeenCalled();
  });

  it('validates reporter IDs before querying targets', async () => {
    await expect(service.submit('bad', dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(posts.exists).not.toHaveBeenCalled();
  });

  it('handles duplicate races but propagates other database failures', async () => {
    reports.updateOne.mockRejectedValueOnce({ code: 11000 });
    await expect(service.submit(userId, dto)).resolves.toEqual({ reported: true });
    const error = new Error('Database unavailable');
    reports.updateOne.mockRejectedValueOnce(error);
    await expect(service.submit(userId, dto)).rejects.toBe(error);
  });

  it('counts in one target-type-scoped aggregate and skips empty batches', async () => {
    await expect(service.reportCounts(dto.targetType, [])).resolves.toEqual(new Map());
    expect(reports.aggregate).not.toHaveBeenCalled();
    reports.aggregate.mockResolvedValue([{ _id: new Types.ObjectId(targetId), count: 3 }]);
    await expect(service.reportCounts(dto.targetType, [targetId])).resolves.toEqual(new Map([[targetId, 3]]));
    expect(reports.aggregate).toHaveBeenCalledWith([
      { $match: { targetType: dto.targetType, targetId: { $in: [new Types.ObjectId(targetId)] } } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]);
  });

  it('supports global review and independently optional filters with pagination', async () => {
    await expect(service.list(new AdminQueryReportsDto())).resolves.toEqual({
      items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });
    expect(reports.find).toHaveBeenLastCalledWith({});
    await service.list(Object.assign(new AdminQueryReportsDto(), { targetType: dto.targetType }));
    expect(reports.find).toHaveBeenLastCalledWith({ targetType: dto.targetType });
    await service.list(Object.assign(new AdminQueryReportsDto(), { targetId, page: 2, limit: 5 }));
    expect(reports.find).toHaveBeenLastCalledWith({ targetId: new Types.ObjectId(targetId) });
    expect(chain.skip).toHaveBeenLastCalledWith(5);
    expect(chain.limit).toHaveBeenLastCalledWith(5);
    expect(chain.sort).toHaveBeenLastCalledWith({ createdAt: -1, _id: -1 });
  });

  it('allows admin target review after hiding or deleting content', async () => {
    await service.listForTarget(dto.targetType, targetId, new PaginationQueryDto());
    expect(posts.exists).toHaveBeenCalledWith({ _id: new Types.ObjectId(targetId) });
    expect(reports.find).toHaveBeenCalledWith({ targetType: dto.targetType, targetId: new Types.ObjectId(targetId) });
    posts.exists.mockResolvedValue(null);
    await expect(service.listForTarget(dto.targetType, targetId, new PaginationQueryDto())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uses report timestamps consistently for counts and target drilldown', async () => {
    const input = Object.assign(new AdminQueryReportsDto(), { startDate: '2026-11-01', endDate: '2026-11-02' });
    const createdAt = { $gte: new Date('2026-10-31T17:00:00Z'), $lt: new Date('2026-11-02T17:00:00Z') };
    await service.reportCounts(dto.targetType, [targetId], input);
    expect(reports.aggregate.mock.calls[0][0][0].$match.createdAt).toEqual(createdAt);
    await service.listForTarget(dto.targetType, targetId, input);
    expect(reports.find).toHaveBeenCalledWith({ targetType: dto.targetType, targetId: new Types.ObjectId(targetId), createdAt });
    expect(reports.countDocuments).toHaveBeenCalledWith(reports.find.mock.lastCall![0]);
  });

  it('rejects invalid date ranges even with an empty count batch', async () => {
    await expect(service.reportCounts(dto.targetType, [], { startDate: '2026-02-30', endDate: '2026-03-01' })).rejects.toBeInstanceOf(BadRequestException);
    expect(reports.aggregate).not.toHaveBeenCalled();
  });
});
