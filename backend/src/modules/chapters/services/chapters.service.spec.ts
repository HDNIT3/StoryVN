import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ChaptersService } from './chapters.service.js';
import { ChapterStatus } from '../schemas/chapter.schema.js';
import { ChapterAction } from '../dto/create-chapter.dto.js';

describe('ChaptersService (UC-14, UC-15, UC-16)', () => {
  let service: ChaptersService;
  let mockChapterModel: any;
  let mockStoryModel: any;

  const authorId = new Types.ObjectId();
  const otherUserId = new Types.ObjectId();
  const storyId = new Types.ObjectId();
  const chapterId = new Types.ObjectId();

  const mockStory = {
    _id: storyId,
    authorId,
    title: 'Test Story',
    slug: 'test-story',
    status: 'PUBLISHED',
  };

  const mockChapter = {
    _id: chapterId,
    storyId,
    chapterNumber: 1,
    title: 'Chương 1',
    content: 'Nội dung chương 1',
    status: ChapterStatus.DRAFT,
    isFree: true,
    coinPrice: 0,
    requirePreviousChapter: false,
    viewCount: 100,
    save: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    mockStoryModel = {
      findById: vi.fn().mockImplementation((id) => {
        if (id.toString() === storyId.toString()) return Promise.resolve(mockStory);
        return Promise.resolve(null);
      }),
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    };

    function MockChapterInstance(this: any, data: any) {
      Object.assign(this, data);
      this.save = vi.fn().mockResolvedValue(this);
    }

    mockChapterModel = Object.assign(MockChapterInstance, {
      findOne: vi.fn().mockReturnValue({
        sort: () => ({ select: () => ({ lean: () => Promise.resolve(null) }) }),
      }),
      find: vi.fn(),
      findById: vi.fn(),
      countDocuments: vi.fn().mockResolvedValue(1),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      bulkWrite: vi.fn().mockResolvedValue({ ok: 1 }),
    });

    service = new ChaptersService(mockChapterModel as any, mockStoryModel as any);
  });

  describe('UC-14: Tạo chương truyện', () => {
    it('Tạo chương nháp thành công với status DRAFT', async () => {
      mockChapterModel.findOne.mockReturnValue({
        sort: () => ({ select: () => ({ lean: () => Promise.resolve(null) }) }),
      });

      const res = await service.createChapter(authorId, {
        storyId: storyId.toString(),
        title: 'Chương mở đầu',
        content: 'Nội dung truyện...',
        action: ChapterAction.DRAFT,
      });

      expect(res.status).toBe(ChapterStatus.DRAFT);
      expect(res.chapterNumber).toBe(1);
      expect(res.isFree).toBe(true);
      expect(res.coinPrice).toBe(0);
    });

    it('Gửi duyệt chương thành công với status PENDING_REVIEW', async () => {
      mockChapterModel.findOne.mockReturnValue({
        sort: () => ({ select: () => ({ lean: () => Promise.resolve({ chapterNumber: 5 }) }) }),
      });

      const res = await service.createChapter(authorId, {
        storyId: storyId.toString(),
        title: 'Chương 6',
        content: 'Nội dung chương 6...',
        action: ChapterAction.SUBMIT,
      });

      expect(res.status).toBe(ChapterStatus.PENDING_REVIEW);
      expect(res.chapterNumber).toBe(6);
    });

    it('Báo lỗi nếu người tạo không phải chủ sở hữu truyện', async () => {
      await expect(
        service.createChapter(otherUserId, {
          storyId: storyId.toString(),
          title: 'Chương lậu',
          content: 'Nội dung...',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Báo lỗi nếu số thứ tự chương bị trùng', async () => {
      mockChapterModel.findOne.mockResolvedValueOnce({ _id: new Types.ObjectId(), chapterNumber: 1 });

      await expect(
        service.createChapter(authorId, {
          storyId: storyId.toString(),
          chapterNumber: 1,
          title: 'Chương trùng số',
          content: 'Nội dung...',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('UC-15: Cài đặt xu cho chương', () => {
    it('Chương miễn phí thì coinPrice luôn bằng 0', async () => {
      mockChapterModel.findOne.mockReturnValue({
        sort: () => ({ select: () => ({ lean: () => Promise.resolve(null) }) }),
      });

      const res = await service.createChapter(authorId, {
        storyId: storyId.toString(),
        title: 'Chương free',
        content: 'Nội dung...',
        isFree: true,
        coinPrice: 50,
      });

      expect(res.isFree).toBe(true);
      expect(res.coinPrice).toBe(0);
      expect(res.requirePreviousChapter).toBe(false);
    });

    it('Chương trả phí với giá xu hợp lệ và ràng buộc mua chương trước', async () => {
      mockChapterModel.findOne.mockReturnValue({
        sort: () => ({ select: () => ({ lean: () => Promise.resolve(null) }) }),
      });

      const res = await service.createChapter(authorId, {
        storyId: storyId.toString(),
        title: 'Chương vip',
        content: 'Nội dung vip...',
        isFree: false,
        coinPrice: 15,
        requirePreviousChapter: true,
      });

      expect(res.isFree).toBe(false);
      expect(res.coinPrice).toBe(15);
      expect(res.requirePreviousChapter).toBe(true);
    });

    it('Báo lỗi nếu chương trả phí nhưng giá xu <= 0', async () => {
      await expect(
        service.createChapter(authorId, {
          storyId: storyId.toString(),
          title: 'Chương vip lỗi giá',
          content: 'Nội dung...',
          isFree: false,
          coinPrice: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('UC-16: Quản lý chương truyện', () => {
    it('Chương PUBLISHED khi chỉnh sửa phải chuyển sang PENDING_REVIEW để duyệt lại', async () => {
      const publishedChapter = {
        ...mockChapter,
        status: ChapterStatus.PUBLISHED,
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      mockChapterModel.findById.mockResolvedValue(publishedChapter);

      const res = await service.updateChapter(authorId, chapterId.toString(), {
        title: 'Tiêu đề mới sau sửa',
      });

      expect(res.status).toBe(ChapterStatus.PENDING_REVIEW);
      expect(res.title).toBe('Tiêu đề mới sau sửa');
    });

    it('Xóa chương nháp DRAFT thành công', async () => {
      mockChapterModel.findById.mockResolvedValue({
        ...mockChapter,
        status: ChapterStatus.DRAFT,
      });

      const res = await service.deleteChapter(authorId, chapterId.toString());
      expect(res.success).toBe(true);
      expect(mockChapterModel.deleteOne).toHaveBeenCalled();
    });

    it('Không cho phép xóa trực tiếp chương đã PUBLISHED', async () => {
      mockChapterModel.findById.mockResolvedValue({
        ...mockChapter,
        status: ChapterStatus.PUBLISHED,
      });

      await expect(
        service.deleteChapter(authorId, chapterId.toString()),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
