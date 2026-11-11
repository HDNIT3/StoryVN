import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../users/schemas/user.schema.js';
import { ChapterStatus } from '../schemas/chapter.schema.js';
import { ChaptersService } from './chapters.service.js';

function createChainQuery(result: any) {
  const q: any = {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockImplementation(() => q),
    exec: vi.fn().mockResolvedValue(result),
    then: (resolve: any, reject: any) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return q;
}

describe('ChaptersService - Task 1: Mua & Mở khóa chương bằng Xu', () => {
  let service: ChaptersService;
  let mockChapterModel: any;
  let mockStoryModel: any;
  let mockStoryDailyViewModel: any;
  let mockNotificationsService: any;
  let mockChapterUnlockModel: any;
  let mockWalletService: any;

  const storyId = new Types.ObjectId('507f1f77bcf86cd799439011');
  const authorId = new Types.ObjectId('507f1f77bcf86cd799439012');
  const readerId = new Types.ObjectId('507f1f77bcf86cd799439013');
  const chapter1Id = new Types.ObjectId('507f1f77bcf86cd799439021');
  const chapter2Id = new Types.ObjectId('507f1f77bcf86cd799439022');
  const unlockRecordId = new Types.ObjectId('507f1f77bcf86cd799439099');

  beforeEach(() => {
    mockChapterModel = {
      findById: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      updateOne: vi.fn().mockResolvedValue({}),
    };

    mockStoryModel = {
      findById: vi.fn(),
      findOne: vi.fn(),
      updateOne: vi.fn().mockResolvedValue({}),
    };

    mockStoryDailyViewModel = {
      updateOne: vi.fn().mockResolvedValue({}),
    };

    mockNotificationsService = {
      notifyModerationToModerators: vi.fn(),
    };

    mockChapterUnlockModel = {
      findOne: vi.fn(),
      find: vi.fn().mockImplementation(() => createChainQuery([])),
      countDocuments: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    mockWalletService = {
      getMyWallet: vi.fn(),
      debit: vi.fn(),
    };

    service = new ChaptersService(
      mockChapterModel,
      mockStoryModel,
      mockStoryDailyViewModel,
      mockNotificationsService,
      mockChapterUnlockModel,
      mockWalletService,
    );
  });

  it('mở khóa chương trả phí thành công, trừ đúng số Xu và trả về nội dung chương', async () => {
    const unlockedAt = new Date('2026-11-10T05:00:00.000Z');

    mockChapterModel.findById.mockResolvedValue({
      _id: chapter1Id,
      storyId,
      chapterNumber: 1,
      title: 'Chương 1 VIP',
      content: '<p>Nội dung chương VIP bí mật</p>',
      wordCount: 6,
      viewCount: 10,
      status: ChapterStatus.PUBLISHED,
      isFree: false,
      coinPrice: 20,
      requirePreviousChapter: false,
      scheduledAt: null,
    });

    mockStoryModel.findById.mockReturnValue(
      createChainQuery({
        _id: storyId,
        authorId,
        title: 'Truyện Kiếm Hiệp',
      }),
    );

    // Không có chương trước chưa phát hành
    mockChapterModel.findOne.mockReturnValue(createChainQuery(null));
    // Chưa từng mở khóa trước đó
    mockChapterUnlockModel.findOne.mockReturnValue(createChainQuery(null));

    mockWalletService.getMyWallet.mockResolvedValue({
      userId: readerId.toString(),
      balance: 100,
      totalSpent: 0,
      createdAt: unlockedAt,
      updatedAt: unlockedAt,
    });

    mockChapterUnlockModel.create.mockResolvedValue({
      _id: unlockRecordId,
      userId: readerId,
      chapterId: chapter1Id,
      coinPrice: 20,
      unlockedAt,
    });

    mockWalletService.debit.mockResolvedValue({
      userId: readerId.toString(),
      balance: 80,
      totalSpent: 20,
      createdAt: unlockedAt,
      updatedAt: unlockedAt,
    });

    const result = await service.unlockChapter(
      readerId.toString(),
      chapter1Id.toString(),
      UserRole.USER,
    );

    expect(mockChapterUnlockModel.create).toHaveBeenCalledTimes(1);
    expect(mockChapterUnlockModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: readerId,
        chapterId: chapter1Id,
        coinPrice: 20,
      }),
    );
    expect(mockWalletService.debit).toHaveBeenCalledTimes(1);
    expect(mockWalletService.debit).toHaveBeenCalledWith(
      readerId.toString(),
      20,
    );
    expect(result.wallet.balance).toBe(80);
    expect(result.wallet.totalSpent).toBe(20);
    expect(result.chapter.isUnlocked).toBe(true);
    expect(result.chapter.content).toContain('Nội dung chương VIP bí mật');
  });

  it('đảm bảo mỗi chương chỉ tính phí 1 lần: từ chối nếu người dùng đã mở khóa trước đó', async () => {
    mockChapterModel.findById.mockResolvedValue({
      _id: chapter1Id,
      storyId,
      chapterNumber: 1,
      title: 'Chương 1 VIP',
      content: '<p>Nội dung</p>',
      status: ChapterStatus.PUBLISHED,
      isFree: false,
      coinPrice: 20,
      requirePreviousChapter: false,
      scheduledAt: null,
    });

    mockStoryModel.findById.mockReturnValue(
      createChainQuery({ _id: storyId, authorId }),
    );
    mockChapterModel.findOne.mockReturnValue(createChainQuery(null));

    // Đã có bản ghi mở khóa trong DB
    mockChapterUnlockModel.findOne.mockReturnValue(
      createChainQuery({ _id: unlockRecordId }),
    );

    await expect(
      service.unlockChapter(
        readerId.toString(),
        chapter1Id.toString(),
        UserRole.USER,
      ),
    ).rejects.toThrow(ConflictException);

    expect(mockWalletService.debit).not.toHaveBeenCalled();
    expect(mockChapterUnlockModel.create).not.toHaveBeenCalled();
  });

  it('xử lý giao dịch đồng thời (Concurrency): 10 request cùng lúc chỉ trừ ví đúng 1 lần duy nhất', async () => {
    mockChapterModel.findById.mockResolvedValue({
      _id: chapter1Id,
      storyId,
      chapterNumber: 1,
      title: 'Chương 1 VIP',
      content: '<p>Nội dung</p>',
      status: ChapterStatus.PUBLISHED,
      isFree: false,
      coinPrice: 25,
      requirePreviousChapter: false,
      scheduledAt: null,
    });

    mockStoryModel.findById.mockReturnValue(
      createChainQuery({ _id: storyId, authorId }),
    );
    mockChapterModel.findOne.mockReturnValue(createChainQuery(null));
    mockChapterUnlockModel.findOne.mockReturnValue(createChainQuery(null));

    mockWalletService.getMyWallet.mockResolvedValue({
      userId: readerId.toString(),
      balance: 25,
      totalSpent: 0,
    });

    mockChapterUnlockModel.create.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return {
        _id: unlockRecordId,
        userId: readerId,
        chapterId: chapter1Id,
        coinPrice: 25,
        unlockedAt: new Date(),
      };
    });

    mockWalletService.debit.mockResolvedValue({
      userId: readerId.toString(),
      balance: 0,
      totalSpent: 25,
    });

    // Bắn 10 request mua cùng 1 chương đồng thời
    const requests = Array.from({ length: 10 }, () =>
      service.unlockChapter(
        readerId.toString(),
        chapter1Id.toString(),
        UserRole.USER,
      ),
    );

    const results = await Promise.allSettled(requests);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(9);
    expect(mockChapterUnlockModel.create).toHaveBeenCalledTimes(1);
    expect(mockWalletService.debit).toHaveBeenCalledTimes(1);
  });

  it('xử lý trùng khóa Unique Index (E11000) từ DB khi đa tiến trình cạnh tranh: không trừ ví lần 2', async () => {
    mockChapterModel.findById.mockResolvedValue({
      _id: chapter1Id,
      storyId,
      chapterNumber: 1,
      title: 'Chương 1 VIP',
      content: '<p>Nội dung</p>',
      status: ChapterStatus.PUBLISHED,
      isFree: false,
      coinPrice: 15,
      requirePreviousChapter: false,
      scheduledAt: null,
    });

    mockStoryModel.findById.mockReturnValue(
      createChainQuery({ _id: storyId, authorId }),
    );
    mockChapterModel.findOne.mockReturnValue(createChainQuery(null));
    mockChapterUnlockModel.findOne.mockReturnValue(createChainQuery(null));

    mockWalletService.getMyWallet.mockResolvedValue({
      userId: readerId.toString(),
      balance: 50,
      totalSpent: 0,
    });

    // Giả lập MongoDB ném lỗi E11000 do Unique Index { userId: 1, chapterId: 1 }
    mockChapterUnlockModel.create.mockRejectedValue({ code: 11000 });

    await expect(
      service.unlockChapter(
        readerId.toString(),
        chapter1Id.toString(),
        UserRole.USER,
      ),
    ).rejects.toThrow(ConflictException);

    expect(mockWalletService.debit).not.toHaveBeenCalled();
  });

  it('hoàn tác (rollback) bản ghi chapter_unlocks nếu bước trừ ví nguyên tử thất bại', async () => {
    mockChapterModel.findById.mockResolvedValue({
      _id: chapter1Id,
      storyId,
      chapterNumber: 1,
      title: 'Chương 1 VIP',
      content: '<p>Nội dung</p>',
      status: ChapterStatus.PUBLISHED,
      isFree: false,
      coinPrice: 30,
      requirePreviousChapter: false,
      scheduledAt: null,
    });

    mockStoryModel.findById.mockReturnValue(
      createChainQuery({ _id: storyId, authorId }),
    );
    mockChapterModel.findOne.mockReturnValue(createChainQuery(null));
    mockChapterUnlockModel.findOne.mockReturnValue(createChainQuery(null));

    mockWalletService.getMyWallet.mockResolvedValue({
      userId: readerId.toString(),
      balance: 30,
      totalSpent: 0,
    });

    mockChapterUnlockModel.create.mockResolvedValue({
      _id: unlockRecordId,
      userId: readerId,
      chapterId: chapter1Id,
      coinPrice: 30,
      unlockedAt: new Date(),
    });

    // Giả lập ví bị giao dịch khác trừ mất ngay trước tích tắc debit
    mockWalletService.debit.mockRejectedValue(
      new BadRequestException('Số dư không đủ'),
    );

    await expect(
      service.unlockChapter(
        readerId.toString(),
        chapter1Id.toString(),
        UserRole.USER,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(mockChapterUnlockModel.deleteOne).toHaveBeenCalledWith({
      _id: unlockRecordId,
    });
  });

  it('chặn mở khóa nếu chương bật requirePreviousChapter mà chương trả phí liền trước chưa mở khóa', async () => {
    mockChapterModel.findById.mockResolvedValue({
      _id: chapter2Id,
      storyId,
      chapterNumber: 2,
      title: 'Chương 2 VIP',
      content: '<p>Nội dung chương 2</p>',
      status: ChapterStatus.PUBLISHED,
      isFree: false,
      coinPrice: 20,
      requirePreviousChapter: true,
      scheduledAt: null,
    });

    mockStoryModel.findById.mockReturnValue(
      createChainQuery({ _id: storyId, authorId }),
    );

    // Lần 1: unreleasedPrev = null; Lần 2: prevChapter = Chương 1 trả phí
    mockChapterModel.findOne
      .mockReturnValueOnce(createChainQuery(null))
      .mockReturnValueOnce(
        createChainQuery({
          _id: chapter1Id,
          chapterNumber: 1,
          title: 'Chương 1 VIP',
          isFree: false,
          coinPrice: 15,
        }),
      );

    // Chưa mở khóa Chương 1
    mockChapterUnlockModel.findOne.mockReturnValue(createChainQuery(null));

    await expect(
      service.unlockChapter(
        readerId.toString(),
        chapter2Id.toString(),
        UserRole.USER,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(mockWalletService.debit).not.toHaveBeenCalled();
  });

  it('ẩn nội dung chương trả phí trên API đọc chương khi độc giả chưa mở khóa', async () => {
    mockStoryModel.findOne.mockReturnValue(
      createChainQuery({
        _id: storyId,
        title: 'Truyện VIP',
        slug: 'truyen-vip',
        authorId: { _id: authorId, displayName: 'Tác giả A' },
      }),
    );

    mockChapterModel.findOne
      // Tìm chương cần đọc
      .mockResolvedValueOnce({
        _id: chapter1Id,
        storyId,
        chapterNumber: 1,
        title: 'Chương 1 VIP',
        content: '<p>Nội dung trả phí không được lộ</p>',
        wordCount: 7,
        viewCount: 5,
        status: ChapterStatus.PUBLISHED,
        isFree: false,
        coinPrice: 20,
        requirePreviousChapter: false,
        scheduledAt: null,
      })
      // unreleasedPrev
      .mockReturnValueOnce(createChainQuery(null))
      // firstUnreleasedForNav
      .mockReturnValueOnce(createChainQuery(null))
      // prevChapter
      .mockReturnValueOnce(createChainQuery(null))
      // nextChapter
      .mockReturnValueOnce(createChainQuery(null));

    mockChapterModel.find.mockReturnValue(createChainQuery([]));
    // Chưa mở khóa
    mockChapterUnlockModel.findOne.mockReturnValue(createChainQuery(null));

    const data = await service.getChapterByStorySlugAndNumber(
      'truyen-vip',
      1,
      readerId,
      UserRole.USER,
    );

    expect(data.isUnlocked).toBe(false);
    expect(data.content).toBe('');
    expect(mockChapterModel.updateOne).not.toHaveBeenCalled();
  });

  it('lấy danh sách ID các chương đã mua cho user (getPurchasedChapterIds)', async () => {
    mockChapterUnlockModel.find.mockReturnValue(
      createChainQuery([
        { chapterId: chapter1Id },
        { chapterId: chapter2Id },
      ]),
    );

    const result = await service.getPurchasedChapterIds(readerId);
    expect(result.total).toBe(2);
    expect(result.purchasedChapterIds).toContain(chapter1Id.toString());
    expect(result.purchasedChapterIds).toContain(chapter2Id.toString());
  });

  it('kiểm tra trạng thái mở khóa chương (checkChapterUnlockStatus)', async () => {
    // 1. Chương miễn phí -> luôn isUnlocked: true
    mockChapterModel.findById.mockReturnValueOnce(
      createChainQuery({
        _id: chapter1Id,
        storyId,
        isFree: true,
        coinPrice: 0,
        requirePreviousChapter: false,
      }),
    );
    const freeRes = await service.checkChapterUnlockStatus(chapter1Id.toString(), readerId);
    expect(freeRes.isUnlocked).toBe(true);
    expect(freeRes.isFree).toBe(true);

    // 2. Chương trả phí, tác giả sở hữu -> isUnlocked: true
    mockChapterModel.findById.mockReturnValueOnce(
      createChainQuery({
        _id: chapter2Id,
        storyId,
        isFree: false,
        coinPrice: 15,
        requirePreviousChapter: false,
      }),
    );
    mockStoryModel.findById.mockReturnValueOnce(
      createChainQuery({
        _id: storyId,
        authorId,
      }),
    );
    const authorRes = await service.checkChapterUnlockStatus(chapter2Id.toString(), authorId);
    expect(authorRes.isUnlocked).toBe(true);

    // 3. Chương trả phí, độc giả đã mua -> isUnlocked: true
    mockChapterModel.findById.mockReturnValueOnce(
      createChainQuery({
        _id: chapter2Id,
        storyId,
        isFree: false,
        coinPrice: 15,
        requirePreviousChapter: false,
      }),
    );
    mockStoryModel.findById.mockReturnValueOnce(
      createChainQuery({
        _id: storyId,
        authorId,
      }),
    );
    mockChapterUnlockModel.findOne.mockReturnValueOnce(
      createChainQuery({
        unlockedAt: new Date('2026-11-10T12:00:00.000Z'),
        coinPrice: 15,
      }),
    );
    const unlockedRes = await service.checkChapterUnlockStatus(chapter2Id.toString(), readerId);
    expect(unlockedRes.isUnlocked).toBe(true);
    expect(unlockedRes.unlockedAt).toBeDefined();

    // 4. Chương trả phí, độc giả chưa mua -> isUnlocked: false
    mockChapterModel.findById.mockReturnValueOnce(
      createChainQuery({
        _id: chapter2Id,
        storyId,
        isFree: false,
        coinPrice: 15,
        requirePreviousChapter: false,
      }),
    );
    mockStoryModel.findById.mockReturnValueOnce(
      createChainQuery({
        _id: storyId,
        authorId,
      }),
    );
    mockChapterUnlockModel.findOne.mockReturnValueOnce(createChainQuery(null));
    const lockedRes = await service.checkChapterUnlockStatus(chapter2Id.toString(), readerId);
    expect(lockedRes.isUnlocked).toBe(false);
  });

  it('lấy lịch sử mua chương của người dùng kèm phân trang và thống kê (getChapterPurchaseHistory)', async () => {
    mockChapterUnlockModel.countDocuments.mockResolvedValue(1);
    mockChapterUnlockModel.find.mockReturnValue(
      createChainQuery([
        {
          _id: unlockRecordId,
          coinPrice: 20,
          unlockedAt: new Date('2026-11-10T08:00:00.000Z'),
          chapterId: {
            _id: chapter1Id,
            chapterNumber: 1,
            title: 'Chương 1 VIP',
            coinPrice: 20,
            isFree: false,
            storyId: {
              _id: storyId,
              title: 'Truyện Thần Thoại',
              slug: 'truyen-than-thoai',
              coverUrl: 'https://example.com/cover.jpg',
              authorId: {
                displayName: 'Tác giả VIP',
              },
            },
          },
        },
      ]),
    );
    mockChapterUnlockModel.aggregate.mockResolvedValue([
      { totalUnlocked: 1, totalCoinsSpent: 20 },
    ]);

    const history = await service.getChapterPurchaseHistory(readerId, { page: 1, limit: 10 });
    expect(history.total).toBe(1);
    expect(history.items).toHaveLength(1);
    expect(history.items[0].coinPrice).toBe(20);
    expect(history.items[0].chapter?.title).toBe('Chương 1 VIP');
    expect(history.items[0].story?.title).toBe('Truyện Thần Thoại');
    expect(history.summary.totalUnlocked).toBe(1);
    expect(history.summary.totalCoinsSpent).toBe(20);
  });

  it('lấy danh sách chương theo slug kèm đồng bộ trạng thái isUnlocked (getChaptersBySlug)', async () => {
    mockStoryModel.findOne.mockReturnValue(
      createChainQuery({
        _id: storyId,
        title: 'Truyện Hay',
        slug: 'truyen-hay',
        authorId,
      }),
    );
    mockChapterModel.findOne.mockReturnValue(createChainQuery(null));
    mockChapterModel.countDocuments.mockResolvedValue(2);
    mockChapterModel.find.mockReturnValue(
      createChainQuery([
        {
          _id: chapter1Id,
          chapterNumber: 1,
          title: 'Chương 1 Free',
          isFree: true,
          coinPrice: 0,
        },
        {
          _id: chapter2Id,
          chapterNumber: 2,
          title: 'Chương 2 VIP',
          isFree: false,
          coinPrice: 20,
        },
      ]),
    );
    // Reader đã mở khóa chapter2
    mockChapterUnlockModel.find.mockReturnValue(
      createChainQuery([{ chapterId: chapter2Id }]),
    );

    const res = await service.getChaptersBySlug('truyen-hay', { order: 'asc' }, readerId, UserRole.USER);
    expect(res.items).toHaveLength(2);
    expect(res.items[0].isUnlocked).toBe(true); // Free
    expect(res.items[1].isUnlocked).toBe(true); // Đã mua
  });
});

