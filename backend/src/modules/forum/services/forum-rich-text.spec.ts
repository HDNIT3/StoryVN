import { BadRequestException, ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForumService } from './forum.service.js';
import { editableStatuses, ForumContentFormat, ForumPostStatus } from '../schemas/forum-post.schema.js';

function query(value: unknown) {
  const chain: any = {};
  for (const key of ['select', 'populate']) chain[key] = vi.fn().mockReturnValue(chain);
  chain.lean = vi.fn().mockResolvedValue(value);
  return chain;
}

describe('forum rich text owner updates', () => {
  const owner = new Types.ObjectId();
  const id = new Types.ObjectId();
  let posts: any;
  let service: ForumService;
  beforeEach(() => {
    posts = { findOne: vi.fn(), findOneAndUpdate: vi.fn(), create: vi.fn() };
    service = new ForumService(posts, { reportCounts: vi.fn().mockResolvedValue(new Map()) } as any);
  });

  it.each([undefined, ForumContentFormat.PLAIN, ForumContentFormat.HTML])('preserves omitted format %s and guards concurrent format changes', async (format) => {
    const current = { _id: id, userId: owner, status: ForumPostStatus.HIDDEN, contentFormat: format };
    posts.findOne.mockReturnValue(query(current));
    posts.findOneAndUpdate.mockReturnValue(query(current));
    const result = await service.update(id.toString(), owner.toString(), { content: '<p onclick="evil()">Text</p>' });
    expect(posts.findOneAndUpdate).toHaveBeenCalledWith({
      _id: id, userId: owner, status: { $in: editableStatuses },
      contentFormat: format ?? { $exists: false },
    }, { $set: {
      contentFormat: format ?? ForumContentFormat.PLAIN,
      content: format === ForumContentFormat.HTML ? '<p>Text</p>' : '<p onclick="evil()">Text</p>',
      status: ForumPostStatus.PENDING,
    } }, expect.objectContaining({ new: true, runValidators: true }));
    expect(result.contentFormat).toBe(format ?? ForumContentFormat.PLAIN);
  });

  it('rejects format-only changes without persisting arbitrary previous markup', async () => {
    posts.findOne.mockReturnValue(query({ _id: id, userId: owner, content: '<script>evil()</script>' }));
    await expect(service.update(id.toString(), owner.toString(), { contentFormat: ForumContentFormat.HTML })).rejects.toBeInstanceOf(BadRequestException);
    expect(posts.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('sanitizes explicit transition from plain to HTML', async () => {
    const current = { _id: id, userId: owner, contentFormat: ForumContentFormat.PLAIN };
    posts.findOne.mockReturnValue(query(current));
    posts.findOneAndUpdate.mockReturnValue(query(current));
    await service.update(id.toString(), owner.toString(), { content: '<p onclick="evil()">Text</p>', contentFormat: ForumContentFormat.HTML });
    expect(posts.findOneAndUpdate.mock.calls[0][1]).toEqual({ $set: { content: '<p>Text</p>', contentFormat: ForumContentFormat.HTML, status: ForumPostStatus.PENDING } });
  });

  it('returns conflict if the atomic state predicate no longer matches', async () => {
    posts.findOne.mockReturnValue(query({ _id: id, userId: owner, contentFormat: ForumContentFormat.PLAIN }));
    posts.findOneAndUpdate.mockReturnValue(query(null));
    await expect(service.update(id.toString(), owner.toString(), { content: '<img src=x onerror=evil()>' })).rejects.toBeInstanceOf(ConflictException);
  });

  it.each([undefined, ForumContentFormat.HTML])('validates and stores create format %s', async (format) => {
    posts.create.mockResolvedValue({ _id: id });
    posts.findOne.mockReturnValue(query({ _id: id, userId: owner }));
    await service.create(owner.toString(), { title: 'Title', content: '<p onclick="evil()">Text</p>', contentFormat: format });
    expect(posts.create).toHaveBeenCalledWith(expect.objectContaining({
      contentFormat: format ?? ForumContentFormat.PLAIN,
      content: format === ForumContentFormat.HTML ? '<p>Text</p>' : '<p onclick="evil()">Text</p>',
    }));
  });
});
