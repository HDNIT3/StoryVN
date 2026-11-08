import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FollowTargetType } from '../schemas/follow.schema.js';
import { FollowsService } from './follows.service.js';

function createChainQuery(result: any) {
  const q: any = {};
  q.select = vi.fn().mockReturnValue(q);
  q.sort = vi.fn().mockReturnValue(q);
  q.lean = vi.fn().mockReturnValue(q);
  q.exec = vi.fn().mockResolvedValue(result);
  return q;
}

describe('FollowsService - Updates & Read Sync', () => {
  let service: FollowsService;
  let mockFollowModel: any;
  let mockStoryModel: any;
  let mockUserModel: any;
  let mockAuthorProfileModel: any;
  let mockChapterModel: any;
  let mockReadingHistoryModel: any;
  let mockNotificationsService: any;

  const userId = new Types.ObjectId('507f1f77bcf86cd799439100');
  const authorId = new Types.ObjectId('507f1f77bcf86cd799439101');
  const storyAId = new Types.ObjectId('507f1f77bcf86cd799439111');
  const storyBId = new Types.ObjectId('507f1f77bcf86cd799439112');

  const chA1Id = new Types.ObjectId('507f1f77bcf86cd799439201');
  const chA2Id = new Types.ObjectId('507f1f77bcf86cd799439202');
  const chA3Id = new Types.ObjectId('507f1f77bcf86cd799439203');
  const chB1Id = new Types.ObjectId('507f1f77bcf86cd799439204');

  beforeEach(() => {
    mockFollowModel = {
      find: vi.fn(),
      updateOne: vi.fn(),
      updateMany: vi.fn(),
    };
    mockStoryModel = {
      find: vi.fn(),
    };
    mockUserModel = {
      find: vi.fn(),
    };
    mockAuthorProfileModel = {
      find: vi.fn(),
    };
    mockChapterModel = {
      aggregate: vi.fn(),
      find: vi.fn(),
    };
    mockReadingHistoryModel = {
      aggregate: vi.fn(),
    };
    mockNotificationsService = {
      markNewChapterNotificationsAsRead: vi.fn().mockResolvedValue(1),
    };

    service = new FollowsService(
      mockFollowModel,
      mockStoryModel,
      mockUserModel,
      mockAuthorProfileModel,
      mockChapterModel,
      mockReadingHistoryModel,
      mockNotificationsService,
    );
  });

  it('tính đúng unreadChapterCount, targetChapterNumber, lastReadChapterNumber và hỗ trợ lọc onlyUnread', async () => {
    const followedAt = new Date('2026-11-05T10:00:00.000Z');
    const seenAtB = new Date('2026-11-08T09:00:00.000Z');

    mockFollowModel.find.mockReturnValue(
      createChainQuery([
        { targetId: storyAId, createdAt: followedAt, updatesSeenAt: null },
        { targetId: storyBId, createdAt: followedAt, updatesSeenAt: seenAtB },
      ]),
    );

    mockStoryModel.find.mockReturnValue(
      createChainQuery([
        {
          _id: storyAId,
          title: 'Kiếm Lai',
          slug: 'kiem-lai',
          coverUrl: null,
          progressState: 'ONGOING',
          authorId,
          stats: { chapterCount: 3, viewCount: 500 },
        },
        {
          _id: storyBId,
          title: 'Quỷ Bí Chi Chủ',
          slug: 'quy-bi-chi-chu',
          coverUrl: null,
          progressState: 'COMPLETED',
          authorId,
          stats: { chapterCount: 1, viewCount: 900 },
        },
      ]),
    );

    // Không có chương nào bị ngắt quãng
    mockChapterModel.aggregate.mockResolvedValue([]);

    // Truyện A:
    // - Ch 1: phát hành trước followedAt (đã đọc)
    // - Ch 2: phát hành sau followedAt, CHƯA đọc -> unread
    // - Ch 3: phát hành sau followedAt, CHƯA đọc -> unread
    // Truyện B:
    // - Ch 1: phát hành trước updatesSeenAt (seenAtB) -> đã xem
    mockChapterModel.find.mockReturnValue(
      createChainQuery([
        {
          _id: chA3Id,
          storyId: storyAId,
          chapterNumber: 3,
          title: 'Chương 3 mới',
          wordCount: 1500,
          releasedAt: new Date('2026-11-08T12:00:00.000Z'),
        },
        {
          _id: chA2Id,
          storyId: storyAId,
          chapterNumber: 2,
          title: 'Chương 2 mới',
          wordCount: 1400,
          releasedAt: new Date('2026-11-07T12:00:00.000Z'),
        },
        {
          _id: chA1Id,
          storyId: storyAId,
          chapterNumber: 1,
          title: 'Chương 1 cũ',
          wordCount: 1100,
          releasedAt: new Date('2026-11-01T12:00:00.000Z'),
        },
        {
          _id: chB1Id,
          storyId: storyBId,
          chapterNumber: 1,
          title: 'Khởi hành',
          wordCount: 1000,
          releasedAt: new Date('2026-11-08T08:00:00.000Z'),
        },
      ]),
    );

    // Đã đọc Ch 1 của Truyện A
    mockReadingHistoryModel.aggregate.mockResolvedValue([
      { _id: { storyId: storyAId, chapterId: chA1Id } },
    ]);

    mockUserModel.find.mockReturnValue(
      createChainQuery([
        { _id: authorId, username: 'tacgia', displayName: 'Tác Giả', avatarUrl: null },
      ]),
    );
    mockAuthorProfileModel.find.mockReturnValue(
      createChainQuery([{ userId: authorId, penName: 'Bút Danh' }]),
    );

    const resultAll = await service.getFollowedStoryUpdates(userId.toString(), {
      page: 1,
      limit: 10,
    });

    expect(resultAll.summary).toEqual({
      unreadStoriesCount: 1,
      unreadChaptersCount: 2,
    });
    expect(resultAll.items).toHaveLength(2);

    // Truyện A xếp đầu vì Ch 3 mới nhất (12:00 > 08:00)
    const itemA = resultAll.items[0];
    expect(itemA.story._id).toBe(storyAId.toString());
    expect(itemA.unreadChapterCount).toBe(2);
    expect(itemA.hasUnread).toBe(true);
    expect(itemA.lastReadChapterNumber).toBe(1);
    expect(itemA.targetChapterNumber).toBe(2); // Nhảy tới chương chưa đọc sớm nhất (Ch.2)
    expect(itemA.latestChapter.chapterNumber).toBe(3);

    const itemB = resultAll.items[1];
    expect(itemB.story._id).toBe(storyBId.toString());
    expect(itemB.unreadChapterCount).toBe(0);
    expect(itemB.hasUnread).toBe(false);

    // Lọc onlyUnread = true chỉ còn Truyện A
    const resultUnread = await service.getFollowedStoryUpdates(
      userId.toString(),
      { page: 1, limit: 10, onlyUnread: true },
    );
    expect(resultUnread.items).toHaveLength(1);
    expect(resultUnread.items[0].story._id).toBe(storyAId.toString());
  });

  it('markFollowedUpdatesSeen cập nhật updatesSeenAt và đồng bộ đánh dấu đã đọc NEW_CHAPTER notification', async () => {
    mockFollowModel.updateOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    });
    mockFollowModel.updateMany.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ modifiedCount: 4 }),
    });

    const singleRes = await service.markFollowedUpdatesSeen(
      userId.toString(),
      storyAId.toString(),
    );

    expect(singleRes.updatedCount).toBe(1);
    expect(mockFollowModel.updateOne).toHaveBeenCalledWith(
      {
        userId,
        targetType: FollowTargetType.STORY,
        targetId: storyAId,
      },
      expect.objectContaining({
        $set: expect.objectContaining({ updatesSeenAt: expect.any(Date) }),
      }),
    );
    expect(
      mockNotificationsService.markNewChapterNotificationsAsRead,
    ).toHaveBeenCalledWith(userId.toString(), { storyId: storyAId });

    const allRes = await service.markFollowedUpdatesSeen(userId.toString());
    expect(allRes.updatedCount).toBe(4);
    expect(
      mockNotificationsService.markNewChapterNotificationsAsRead,
    ).toHaveBeenCalledWith(userId.toString(), {});
  });
});

