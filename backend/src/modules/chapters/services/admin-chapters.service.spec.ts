import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RevisionStatus } from '../../../common/enums/revision-status.enum.js';
import { ChapterStatus } from '../schemas/chapter.schema.js';
import { AdminChaptersService } from './admin-chapters.service.js';

function createChainQuery(result: any) {
  const q: any = Promise.resolve(result);
  q.select = vi.fn().mockReturnValue(q);
  q.sort = vi.fn().mockReturnValue(q);
  q.populate = vi.fn().mockReturnValue(q);
  q.lean = vi.fn().mockReturnValue(q);
  q.exec = vi.fn().mockResolvedValue(result);
  return q;
}

describe('AdminChaptersService - Follower Release Notification Trigger', () => {
  let service: AdminChaptersService;
  let mockChapterModel: any;
  let mockStoryModel: any;
  let mockNotificationsService: any;
  let mockChapterReleaseService: any;

  const reviewerId = new Types.ObjectId('507f1f77bcf86cd799439001').toString();
  const authorId = new Types.ObjectId('507f1f77bcf86cd799439002');
  const storyId = new Types.ObjectId('507f1f77bcf86cd799439003');
  const chapterId = new Types.ObjectId('507f1f77bcf86cd799439004');

  beforeEach(() => {
    mockChapterModel = {
      findById: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      bulkWrite: vi.fn().mockResolvedValue({}),
    };

    mockStoryModel = {
      findById: vi.fn(),
      updateOne: vi.fn().mockResolvedValue({}),
    };

    mockNotificationsService = {
      create: vi.fn().mockResolvedValue({}),
    };

    mockChapterReleaseService = {
      releaseAndNotifyStoryChapters: vi.fn().mockResolvedValue(2),
    };

    service = new AdminChaptersService(
      mockChapterModel,
      mockStoryModel,
      mockNotificationsService,
      mockChapterReleaseService,
    );
  });

  it('duyệt bản chỉnh sửa (revision) KHÔNG kích hoạt thông báo chương mới tới người theo dõi', async () => {
    const chapterDoc: any = {
      _id: chapterId,
      storyId,
      chapterNumber: 1,
      title: 'Chương 1 cũ',
      content: 'Nội dung cũ',
      isFree: true,
      coinPrice: 0,
      requirePreviousChapter: false,
      status: ChapterStatus.PUBLISHED,
      scheduledAt: new Date('2026-11-01T10:00:00.000Z'),
      revisions: [
        {
          _id: new Types.ObjectId(),
          status: RevisionStatus.PENDING_REVIEW,
          snapshot: {
            title: 'Chương 1 đã sửa chính tả',
            content: 'Nội dung mới đã sửa',
            isFree: true,
            coinPrice: 0,
            requirePreviousChapter: false,
          },
        },
      ],
      save: vi.fn().mockResolvedValue(true),
    };

    mockChapterModel.findById = vi
      .fn()
      .mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue(chapterDoc),
      }))
      .mockImplementationOnce(() => createChainQuery(chapterDoc));

    mockStoryModel.findById.mockResolvedValue({
      _id: storyId,
      title: 'Truyện Kiểm Thử',
      authorId,
    });

    // updateStoryStats
    mockChapterModel.findOne.mockReturnValue(createChainQuery(null));
    mockChapterModel.find.mockReturnValue(
      createChainQuery([{ _id: chapterId, wordCount: 5 }]),
    );

    await service.approveChapter(chapterId.toString(), reviewerId);

    expect(chapterDoc.notifyFollowersPending).toBeUndefined();
    expect(
      mockChapterReleaseService.releaseAndNotifyStoryChapters,
    ).not.toHaveBeenCalled();
  });

  it('duyệt chương mới đặt notifyFollowersPending = true và gọi ChapterReleaseService', async () => {
    const chapterDoc: any = {
      _id: chapterId,
      storyId,
      chapterNumber: 1,
      title: 'Chương 1 mới',
      content: 'Nội dung chương một có nhiều từ ngữ phong phú.',
      isFree: true,
      coinPrice: 0,
      requirePreviousChapter: false,
      status: ChapterStatus.PENDING_REVIEW,
      scheduledAt: null,
      followerNotifiedAt: null,
      notifyFollowersPending: false,
      revisions: [],
      save: vi.fn().mockResolvedValue(true),
    };

    mockChapterModel.findById = vi
      .fn()
      .mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue(chapterDoc),
      }))
      .mockImplementationOnce(() => createChainQuery(chapterDoc));

    mockStoryModel.findById.mockResolvedValue({
      _id: storyId,
      title: 'Truyện Mới Duyệt',
      authorId,
    });

    // check chương trước đó
    mockChapterModel.findOne
      .mockReturnValueOnce(createChainQuery(null))
      .mockReturnValueOnce(createChainQuery(null)); // updateStoryStats

    mockChapterModel.countDocuments.mockResolvedValue(0);
    mockChapterModel.find.mockReturnValue(
      createChainQuery([{ _id: chapterId, wordCount: 10 }]),
    );

    await service.approveChapter(chapterId.toString(), reviewerId);

    expect(chapterDoc.notifyFollowersPending).toBe(true);
    expect(chapterDoc.save).toHaveBeenCalled();
    expect(
      mockChapterReleaseService.releaseAndNotifyStoryChapters,
    ).toHaveBeenCalledWith(
      storyId,
      expect.objectContaining({ bumpStoryUpdatedAt: true }),
    );
  });
});
