import { BadRequestException, ForbiddenException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForumService } from './forum.service.js';
import { ContentReportTargetType } from '../../reports/schemas/content-report.schema.js';
import { editableStatuses, ForumPostStatus } from '../schemas/forum-post.schema.js';
import { AdminQueryForumPostsDto, MyQueryForumPostsDto, QueryForumPostsDto } from '../dto/forum.dto.js';
import { ForumController } from '../controllers/forum.controller.js';

const owner = '507f1f77bcf86cd799439100';
const other = '507f1f77bcf86cd799439101';
const postId = '507f1f77bcf86cd799439111';

function query<T>(value: T) {
  const chain: any = {};
  for (const method of ['select', 'sort', 'skip', 'limit', 'populate']) chain[method] = vi.fn().mockReturnValue(chain);
  chain.lean = vi.fn().mockResolvedValue(value);
  chain.exec = vi.fn().mockResolvedValue(value);
  return chain;
}

describe('ForumService', () => {
  let service: ForumService;
  let posts: any;
  let reports: any;

  beforeEach(() => {
    posts = {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      exists: vi.fn(),
      create: vi.fn(),
    };
    reports = {
      submit: vi.fn().mockResolvedValue({ reported: true }),
      reportCounts: vi.fn().mockResolvedValue(new Map()),
      listForTarget: vi.fn(),
    };
    service = new ForumService(posts, reports);
  });

  it('rejects updates and deletes by a non-owner', async () => {
    posts.findOne.mockReturnValue(query({ _id: new Types.ObjectId(postId), userId: new Types.ObjectId(owner), status: ForumPostStatus.VISIBLE }));

    await expect(service.update(postId, other, { title: 'new' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.delete(postId, other)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not expose a hidden post to another user or a deleted post to its owner', async () => {
    posts.findOne.mockReturnValue(query(null));

    await expect(service.get(postId, other)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.get(postId, owner)).rejects.toBeInstanceOf(NotFoundException);
    expect(posts.findOne).toHaveBeenCalledTimes(2);
    expect(posts.findOne).toHaveBeenNthCalledWith(1, {
      _id: new Types.ObjectId(postId),
      $or: [
        { status: ForumPostStatus.VISIBLE },
        { status: { $in: [ForumPostStatus.HIDDEN, ForumPostStatus.PENDING, ForumPostStatus.REJECTED] }, userId: new Types.ObjectId(other) },
      ],
    });
  });

  it('does not restore a deleted post through admin status changes', async () => {
    posts.findOneAndUpdate.mockReturnValue(query(null));

    await expect(service.setStatus(postId, ForumPostStatus.VISIBLE)).rejects.toBeInstanceOf(NotFoundException);
    expect(posts.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: new Types.ObjectId(postId), status: { $in: editableStatuses } },
      { $set: { status: ForumPostStatus.VISIBLE } },
      expect.any(Object),
    );
  });

  it('resets status to PENDING for moderation when updating content', async () => {
    const post = { _id: new Types.ObjectId(postId), userId: new Types.ObjectId(owner), status: ForumPostStatus.HIDDEN };
    posts.findOne.mockReturnValue(query(post));
    posts.findOneAndUpdate.mockReturnValue(query(post));
    await service.update(postId, owner, { title: ' updated ' });
    expect(posts.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: post._id, userId: post.userId, status: { $in: editableStatuses } },
      { $set: { title: 'updated', status: ForumPostStatus.PENDING } },
      expect.any(Object),
    );
  });

  it('removes only the current user like and remains safe on repeated unlikes', async () => {
    posts.findOneAndUpdate.mockReturnValue(query({ likedBy: [] }));
    await expect(service.like(postId, owner, false)).resolves.toEqual({ liked: false, likeCount: 0 });
    await expect(service.like(postId, owner, false)).resolves.toEqual({ liked: false, likeCount: 0 });
    expect(posts.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: new Types.ObjectId(postId), status: ForumPostStatus.VISIBLE },
      { $pull: { likedBy: new Types.ObjectId(owner) } },
      expect.any(Object),
    );
  });

  it('rejects interactions when the post is unavailable', async () => {
    posts.findOneAndUpdate.mockReturnValue(query(null));
    await expect(service.like(postId, owner, true)).rejects.toBeInstanceOf(NotFoundException);
    expect(posts.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: new Types.ObjectId(postId), status: ForumPostStatus.VISIBLE },
      expect.any(Object), expect.any(Object),
    );
  });

  it('uses an atomic set to prevent duplicate likes', async () => {
    posts.findOneAndUpdate.mockReturnValue(query({ likedBy: [new Types.ObjectId(owner)] }));

    await expect(service.like(postId, owner, true)).resolves.toEqual({ liked: true, likeCount: 1 });
    expect(posts.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: new Types.ObjectId(postId), status: ForumPostStatus.VISIBLE },
      { $addToSet: { likedBy: new Types.ObjectId(owner) } },
      expect.objectContaining({ new: true }),
    );
  });

  it('stores reports idempotently and never returns report details from the report mutation', async () => {
    await expect(service.report(postId, owner, 'spam')).resolves.toEqual({ reported: true });
    expect(reports.submit).toHaveBeenCalledWith(owner, {
      targetType: ContentReportTargetType.FORUM_POST, targetId: postId, reason: 'spam',
    });
  });

  it('returns like totals without exposing user IDs or report counts to readers', async () => {
    posts.findOne.mockReturnValue(query({
      _id: new Types.ObjectId(postId), likedBy: [new Types.ObjectId(other)],
      title: 'Post', content: 'Text', status: ForumPostStatus.VISIBLE,
    }));
    const result = await service.get(postId, owner);
    expect(result.likeCount).toBe(1);
    expect(result).not.toHaveProperty('likedBy');
    expect(result).not.toHaveProperty('reportCount');
    expect(reports.reportCounts).not.toHaveBeenCalled();
  });

  it('applies the same dated cohort to admin rows and total and propagates dates to report counts', async () => {
    const input = Object.assign(new AdminQueryForumPostsDto(), { startDate: '2026-11-01', endDate: '2026-11-02' });
    posts.find = vi.fn().mockReturnValue(query([{ _id: new Types.ObjectId(postId), likedBy: [new Types.ObjectId(owner)] }]));
    posts.countDocuments = vi.fn().mockResolvedValue(1);
    const result = await service.adminList(input);
    expect(posts.find).toHaveBeenCalledWith({ status: { $in: Object.values(ForumPostStatus) }, createdAt: { $gte: new Date('2026-10-31T17:00:00Z'), $lt: new Date('2026-11-02T17:00:00Z') } });
    expect(posts.countDocuments).toHaveBeenCalledWith(posts.find.mock.calls[0][0]);
    expect(reports.reportCounts).toHaveBeenCalledWith(ContentReportTargetType.FORUM_POST, [new Types.ObjectId(postId)], input);
    expect(result.likeCountScope).toBe('lifetime');
    expect(result.items[0].likeCount).toBe(1);
  });

  it('retains owner and visibility constraints and all-time behavior without dates', async () => {
    posts.find = vi.fn().mockReturnValue(query([]));
    posts.countDocuments = vi.fn().mockResolvedValue(0);
    await service.list(new QueryForumPostsDto(), owner);
    expect(posts.find).toHaveBeenCalledWith({ userId: new Types.ObjectId(owner), status: { $in: editableStatuses } });
    await service.list(Object.assign(new QueryForumPostsDto(), { startDate: '2026-11-01', endDate: '2026-11-01' }), owner);
    expect(posts.find.mock.lastCall[0]).toMatchObject({ userId: new Types.ObjectId(owner), createdAt: { $gte: new Date('2026-10-31T17:00:00Z'), $lt: new Date('2026-11-01T17:00:00Z') } });
  });

  it('accepts each personal tab and filters rows and totals by owner and status', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
    const metadata = { type: 'query' as const, metatype: MyQueryForumPostsDto };
    const controller = new ForumController(service);
    const user = { _id: new Types.ObjectId(owner) };
    posts.find = vi.fn().mockReturnValue(query([]));
    posts.countDocuments = vi.fn().mockResolvedValue(0);

    for (const status of editableStatuses) {
      const input = await pipe.transform({ page: '1', limit: '10', status }, metadata);
      await expect(controller.mine(input, user)).resolves.toMatchObject({
        success: true,
        data: { items: [], pagination: { total: 0 } },
      });
      expect(posts.find).toHaveBeenLastCalledWith({ userId: user._id, status });
      expect(posts.countDocuments).toHaveBeenLastCalledWith({ userId: user._id, status });
    }

    await expect(pipe.transform({ status: ForumPostStatus.DELETED }, metadata)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('generates clean slug on create and supports resolving posts by slug without exposing MongoDB ID in URL', async () => {
    posts.exists.mockResolvedValue(null);
    posts.create.mockResolvedValue({ _id: new Types.ObjectId(postId) });
    posts.findOne.mockReturnValue(query({
      _id: new Types.ObjectId(postId),
      slug: 'goc-chia-se-truyen-hay',
      title: 'Góc chia sẻ truyện hay',
      content: 'Nội dung',
      status: ForumPostStatus.VISIBLE,
    }));

    const created = await service.create(owner, { title: 'Góc chia sẻ truyện hay', content: 'Nội dung' });
    expect(posts.create).toHaveBeenCalledWith(expect.objectContaining({
      slug: 'goc-chia-se-truyen-hay',
      title: 'Góc chia sẻ truyện hay',
    }));
    expect(created.slug).toBe('goc-chia-se-truyen-hay');

    const bySlug = await service.get('goc-chia-se-truyen-hay');
    expect(posts.findOne).toHaveBeenLastCalledWith(expect.objectContaining({
      slug: 'goc-chia-se-truyen-hay',
    }));
    expect(bySlug.title).toBe('Góc chia sẻ truyện hay');
  });
});
