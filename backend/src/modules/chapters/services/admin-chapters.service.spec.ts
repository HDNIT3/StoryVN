import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AdminChaptersService } from './admin-chapters.service.js';
import { ChapterStatus } from '../schemas/chapter.schema.js';

describe('AdminChaptersService', () => {
  let service: AdminChaptersService;
  let mockChapterModel: any;
  let mockStoryModel: any;
  let mockNotificationsService: any;

  const authorId = new Types.ObjectId();
  const reviewerId = new Types.ObjectId().toString();
  const storyId = new Types.ObjectId();
  const chapterId = new Types.ObjectId();

  const mockStory = {
    _id: storyId,
    authorId,
    title: 'Truyện Test',
    slug: 'truyen-test',
    status: 'PUBLISHED',
  };

  const createMockChapterDoc = (status: ChapterStatus) => ({
    _id: chapterId,
    storyId,
    chapterNumber: 1,
    title: 'Chương 1 test',
    content: 'Nội dung chương test',
    status,
    isFree: true,
    coinPrice: 0,
    rejectReason: null,
    publishedAt: null,
    save: vi.fn().mockResolvedValue(true),
  });

  beforeEach(() => {
    mockStoryModel = {
      findById: vi.fn().mockImplementation((id) => {
        if (id.toString() === storyId.toString()) return Promise.resolve(mockStory);
        return Promise.resolve(null);
      }),
      find: vi.fn().mockReturnValue({
        select: () => ({
          lean: () => ({
            exec: () => Promise.resolve([{ _id: storyId }]),
          }),
        }),
      }),
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    };

    mockNotificationsService = {
      create: vi.fn().mockResolvedValue({}),
    };

    mockChapterModel = {
      find: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([createMockChapterDoc(ChapterStatus.PENDING_REVIEW)]),
        }),
      }),
      findById: vi.fn(),
      countDocuments: vi.fn().mockResolvedValue(1),
      aggregate: vi.fn().mockResolvedValue([
        { _id: ChapterStatus.PENDING_REVIEW, count: 5 },
        { _id: ChapterStatus.PUBLISHED, count: 10 },
      ]),
    };

    service = new AdminChaptersService(
      mockChapterModel as any,
      mockStoryModel as any,
      mockNotificationsService as any,
    );
  });

  describe('findAll', () => {
    it('Lấy danh sách chương phân trang thành công', async () => {
      const res = await service.findAll({
        page: 1,
        limit: 10,
        status: ChapterStatus.PENDING_REVIEW,
      } as any);

      expect(res).toBeDefined();
      expect(res.items.length).toBe(1);
      expect(res.pagination.totalItems).toBe(1);
    });
  });

  describe('getCounts', () => {
    it('Lấy số lượng thống kê theo từng tab trạng thái', async () => {
      const counts = await service.getCounts();
      expect(counts.pending).toBe(5);
      expect(counts.published).toBe(10);
      expect(counts.all).toBe(15);
    });
  });

  describe('approveChapter', () => {
    it('Duyệt chương thành công và chuyển sang PUBLISHED kèm thông báo', async () => {
      const chapterDoc = createMockChapterDoc(ChapterStatus.PENDING_REVIEW);
      mockChapterModel.findById.mockReturnValueOnce(Promise.resolve(chapterDoc));

      vi.spyOn(service, 'findById').mockResolvedValueOnce({
        ...chapterDoc,
        status: ChapterStatus.PUBLISHED,
      } as any);

      const res = await service.approveChapter(chapterId.toString(), reviewerId);

      expect(chapterDoc.status).toBe(ChapterStatus.PUBLISHED);
      expect(chapterDoc.save).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: authorId.toString(),
          chapterId: chapterId.toString(),
        }),
      );
      expect(res.chapter.status).toBe(ChapterStatus.PUBLISHED);
    });

    it('Ném lỗi nếu chapterId không hợp lệ hoặc không tồn tại', async () => {
      await expect(service.approveChapter('invalid-id', reviewerId)).rejects.toThrow(
        BadRequestException,
      );

      mockChapterModel.findById.mockResolvedValueOnce(null);
      await expect(service.approveChapter(new Types.ObjectId().toString(), reviewerId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('rejectChapter', () => {
    it('Từ chối/hủy duyệt chương thành công và chuyển sang REJECTED kèm lý do', async () => {
      const chapterDoc = createMockChapterDoc(ChapterStatus.PENDING_REVIEW);
      mockChapterModel.findById.mockReturnValueOnce(Promise.resolve(chapterDoc));

      vi.spyOn(service, 'findById').mockResolvedValueOnce({
        ...chapterDoc,
        status: ChapterStatus.REJECTED,
        rejectReason: 'Nội dung vi phạm',
      } as any);

      const res = await service.rejectChapter(chapterId.toString(), reviewerId, {
        reason: 'Nội dung vi phạm',
      });

      expect(chapterDoc.status).toBe(ChapterStatus.REJECTED);
      expect(chapterDoc.rejectReason).toBe('Nội dung vi phạm');
      expect(chapterDoc.save).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalled();
      expect(res.chapter.status).toBe(ChapterStatus.REJECTED);
    });
  });

  describe('unpublishChapter', () => {
    it('Gỡ duyệt chương truyện thành công và chuyển về DRAFT', async () => {
      const chapterDoc = createMockChapterDoc(ChapterStatus.PUBLISHED);
      mockChapterModel.findById.mockReturnValueOnce(Promise.resolve(chapterDoc));

      vi.spyOn(service, 'findById').mockResolvedValueOnce({
        ...chapterDoc,
        status: ChapterStatus.DRAFT,
      } as any);

      const res = await service.unpublishChapter(chapterId.toString(), reviewerId, {
        reason: 'Cần sửa đổi',
      });

      expect(chapterDoc.status).toBe(ChapterStatus.DRAFT);
      expect(chapterDoc.save).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalled();
      expect(res.chapter.status).toBe(ChapterStatus.DRAFT);
    });
  });
});
