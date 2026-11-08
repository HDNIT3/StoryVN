import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoryStatus, StoryVisibility } from '../../stories/schemas/story.schema.js';
import { ChapterStatus } from '../schemas/chapter.schema.js';
import { ChapterReleaseService } from './chapter-release.service.js';

function createChainQuery(result: any) {
  const q: any = {};
  q.select = vi.fn().mockReturnValue(q);
  q.sort = vi.fn().mockReturnValue(q);
  q.lean = vi.fn().mockReturnValue(q);
  q.exec = vi.fn().mockResolvedValue(result);
  return q;
}

describe('ChapterReleaseService', () => {
  let service: ChapterReleaseService;
  let mockChapterModel: any;
  let mockStoryModel: any;
  let mockFollowModel: any;
  let mockUserModel: any;
  let mockNotificationsService: any;

  const storyId = new Types.ObjectId('507f1f77bcf86cd799439011');
  const authorId = new Types.ObjectId('507f1f77bcf86cd799439012');
  const followerActiveId = new Types.ObjectId('507f1f77bcf86cd799439013');
  const followerBannedId = new Types.ObjectId('507f1f77bcf86cd799439014');
  const chapter1Id = new Types.ObjectId('507f1f77bcf86cd799439021');
  const chapter2Id = new Types.ObjectId('507f1f77bcf86cd799439022');

  beforeEach(() => {
    mockChapterModel = {
      distinct: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      findOneAndUpdate: vi.fn(),
      bulkWrite: vi.fn().mockResolvedValue({}),
    };

    mockStoryModel = {
      findById: vi.fn(),
      updateOne: vi.fn().mockResolvedValue({}),
    };

    mockFollowModel = {
      find: vi.fn(),
    };

    mockUserModel = {
      find: vi.fn(),
    };

    mockNotificationsService = {
      notifyFollowersNewChapter: vi.fn().mockResolvedValue(1),
    };

    service = new ChapterReleaseService(
      mockChapterModel,
      mockStoryModel,
      mockFollowModel,
      mockUserModel,
      mockNotificationsService,
    );
  });

  it('phát hành chương đủ điều kiện, lọc bỏ tác giả & user bị cấm rồi gửi NEW_CHAPTER', async () => {
    const now = new Date('2026-11-08T10:00:00.000Z');

    mockStoryModel.findById.mockReturnValue(
      createChainQuery({
        _id: storyId,
        title: 'Thiên Địa Chi Đạo',
        slug: 'thien-dia-chi-dao',
        coverUrl: null,
        authorId,
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PUBLIC,
      }),
    );

    // Không có chương chưa phát hành -> tất cả chương đều thông suốt
    mockChapterModel.findOne
      .mockReturnValueOnce(createChainQuery(null))
      .mockReturnValueOnce(createChainQuery(null));

    // Candidate chapters cần thông báo
    mockChapterModel.find
      .mockReturnValueOnce(
        createChainQuery([
          {
            _id: chapter1Id,
            chapterNumber: 1,
            title: 'Khởi đầu',
            scheduledAt: null,
            releasedAt: null,
            updatedAt: now,
          },
        ]),
      )
      // Sync stats
      .mockReturnValueOnce(
        createChainQuery([{ _id: chapter1Id, wordCount: 1200 }]),
      );

    mockChapterModel.findOneAndUpdate.mockReturnValue(
      createChainQuery({
        _id: chapter1Id,
        chapterNumber: 1,
        title: 'Khởi đầu',
      }),
    );

    mockFollowModel.find.mockReturnValue(
      createChainQuery([
        { userId: authorId }, // Tác giả tự follow -> phải bị loại
        { userId: followerActiveId },
        { userId: followerBannedId },
      ]),
    );

    // Chỉ followerActiveId chưa bị BANNED
    mockUserModel.find.mockReturnValue(
      createChainQuery([{ _id: followerActiveId }]),
    );

    const count = await service.releaseAndNotifyStoryChapters(storyId, {
      bumpStoryUpdatedAt: true,
      now,
    });

    expect(count).toBe(1);
    expect(mockChapterModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: chapter1Id,
        status: ChapterStatus.PUBLISHED,
        followerNotifiedAt: null,
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          notifyFollowersPending: false,
          followerNotifiedAt: now,
          releasedAt: now,
        }),
      }),
      { returnDocument: 'after' },
    );

    expect(
      mockNotificationsService.notifyFollowersNewChapter,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockNotificationsService.notifyFollowersNewChapter,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        followerIds: [followerActiveId.toString()],
        chapter: expect.objectContaining({
          _id: chapter1Id,
          chapterNumber: 1,
          title: 'Khởi đầu',
        }),
      }),
    );
  });

  it('không thông báo nếu truyện chưa PUBLISHED hoặc đang PRIVATE', async () => {
    mockStoryModel.findById.mockReturnValue(
      createChainQuery({
        _id: storyId,
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PRIVATE,
      }),
    );

    const count = await service.releaseAndNotifyStoryChapters(storyId);

    expect(count).toBe(0);
    expect(mockChapterModel.findOne).not.toHaveBeenCalled();
    expect(
      mockNotificationsService.notifyFollowersNewChapter,
    ).not.toHaveBeenCalled();
  });

  it('tôn trọng ràng buộc liên tục: Chương 2 không phát hành khi Chương 1 đang hẹn giờ tương lai', async () => {
    const now = new Date('2026-11-08T10:00:00.000Z');

    mockStoryModel.findById.mockReturnValue(
      createChainQuery({
        _id: storyId,
        title: 'Truyện Liên Tục',
        slug: 'truyen-lien-tuc',
        authorId,
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PUBLIC,
      }),
    );

    // firstUnreleased = Chương 1
    mockChapterModel.findOne.mockReturnValueOnce(
      createChainQuery({ chapterNumber: 1 }),
    );
    mockChapterModel.find.mockReturnValueOnce(createChainQuery([]));

    const count = await service.releaseAndNotifyStoryChapters(storyId, { now });

    expect(count).toBe(0);
    expect(mockChapterModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        chapterNumber: { $lt: 1 },
      }),
    );
  });

  it('không gửi thông báo trùng nếu atomic claim trả về null', async () => {
    const now = new Date('2026-11-08T10:00:00.000Z');

    mockStoryModel.findById.mockReturnValue(
      createChainQuery({
        _id: storyId,
        title: 'Chống Trùng',
        slug: 'chong-trung',
        authorId,
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PUBLIC,
      }),
    );

    mockChapterModel.findOne.mockReturnValueOnce(createChainQuery(null));
    mockChapterModel.find.mockReturnValueOnce(
      createChainQuery([
        {
          _id: chapter2Id,
          chapterNumber: 2,
          title: 'Chương 2',
          scheduledAt: null,
          releasedAt: null,
          updatedAt: now,
        },
      ]),
    );
    // Đã bị process khác claim trước
    mockChapterModel.findOneAndUpdate.mockReturnValue(createChainQuery(null));

    const count = await service.releaseAndNotifyStoryChapters(storyId, { now });

    expect(count).toBe(0);
    expect(
      mockNotificationsService.notifyFollowersNewChapter,
    ).not.toHaveBeenCalled();
  });

  it('processDueScheduledReleases quét các story có chương đến hạn phát hành', async () => {
    mockChapterModel.distinct.mockResolvedValue([storyId]);
    const releaseSpy = vi
      .spyOn(service, 'releaseAndNotifyStoryChapters')
      .mockResolvedValue(3);

    const total = await service.processDueScheduledReleases();

    expect(total).toBe(3);
    expect(releaseSpy).toHaveBeenCalledWith(
      storyId,
      expect.objectContaining({ bumpStoryUpdatedAt: true }),
    );
  });
});

