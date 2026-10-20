import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { countWords } from '../../../common/utils/text.util.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { NotificationType } from '../../notifications/schemas/notification.schema.js';
import { Story, StoryDocument } from '../../stories/schemas/story.schema.js';
import {
  Chapter,
  ChapterDocument,
  ChapterStatus,
} from '../schemas/chapter.schema.js';
import {
  ChapterUpdate,
  ChapterUpdateDocument,
  ChapterUpdateStatus,
} from '../schemas/chapter-update.schema.js';
import { AdminChapterModerationReasonDto } from '../dto/admin-chapter-moderation-reason.dto.js';
import { AdminQueryChaptersDto } from '../dto/admin-query-chapters.dto.js';
import { AdminRejectChapterDto } from '../dto/admin-reject-chapter.dto.js';

@Injectable()
export class AdminChaptersService {
  constructor(
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(ChapterUpdate.name)
    private readonly chapterUpdateModel: Model<ChapterUpdateDocument>,
    @InjectModel(Story.name)
    private readonly storyModel: Model<StoryDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Helper cập nhật thống kê hiển thị cho độc giả trong Story:
   * - stats.chapterCount: số chương PUBLISHED mà scheduledAt <= now hoặc null.
   * - stats.wordCount: tổng số từ của các chương đang hiển thị cho độc giả.
   * Đồng thời điền wordCount cho các chương cũ chưa từng được tính.
   */
  private async updateStoryStats(
    storyId: Types.ObjectId,
  ): Promise<{ chapterCount: number; wordCount: number }> {
    const now = new Date();
    // Tìm chương đầu tiên chưa được phát hành tới độc giả (để đảm bảo không đếm nhảy cóc)
    const firstUnreleased = await this.chapterModel
      .findOne({
        storyId,
        $or: [
          { status: { $ne: ChapterStatus.PUBLISHED } },
          { scheduledAt: { $gt: now } },
        ],
      })
      .sort({ chapterNumber: 1 })
      .lean();

    const countFilter: any = {
      storyId,
      status: ChapterStatus.PUBLISHED,
      $or: [
        { scheduledAt: null },
        { scheduledAt: { $lte: now } },
      ],
    };

    if (firstUnreleased) {
      countFilter.chapterNumber = { $lt: firstUnreleased.chapterNumber };
    }

    const chapters = await this.chapterModel
      .find(countFilter)
      .select('wordCount content')
      .lean();

    let wordCount = 0;
    const needUpdate: any[] = [];

    for (const chapter of chapters as any[]) {
      let chapterWordCount = chapter.wordCount;
      // Chương cũ (trước khi có trường wordCount) được tính bù tại đây
      if (typeof chapterWordCount !== 'number') {
        chapterWordCount = countWords(chapter.content);
        needUpdate.push({
          updateOne: {
            filter: { _id: chapter._id },
            update: { $set: { wordCount: chapterWordCount } },
          },
        });
      }
      wordCount += chapterWordCount;
    }

    if (needUpdate.length > 0) {
      await this.chapterModel.bulkWrite(needUpdate);
    }

    const totalChapters = chapters.length;

    await this.storyModel.updateOne(
      { _id: storyId },
      {
        'stats.chapterCount': totalChapters,
        'stats.wordCount': wordCount,
      },
    );

    return { chapterCount: totalChapters, wordCount };
  }

  /**
   * Lấy danh sách tất cả chương dành cho Admin/Manager
   * Hỗ trợ lọc theo storyId, status, tìm kiếm theo tiêu đề chương/tên truyện, phân trang, sắp xếp
   */
  async findAll(query: AdminQueryChaptersDto): Promise<PaginatedResult<any>> {
    const filter: Record<string, any> = {};

    if (query.storyId && Types.ObjectId.isValid(query.storyId)) {
      filter.storyId = new Types.ObjectId(query.storyId);
    }

    if (query.status === ChapterStatus.PENDING_REVIEW) {
      const pendingUpdates = await this.chapterUpdateModel
        .find({ status: ChapterUpdateStatus.PENDING_REVIEW })
        .select('chapterId')
        .lean();
      const pendingChapterIds = pendingUpdates.map((u) => u.chapterId);

      const statusCond: any = pendingChapterIds.length > 0
        ? { $or: [{ status: ChapterStatus.PENDING_REVIEW }, { _id: { $in: pendingChapterIds } }] }
        : { status: ChapterStatus.PENDING_REVIEW };

      Object.assign(filter, statusCond);
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.search?.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');

      // Tìm các truyện khớp từ khóa để lọc chương thuộc truyện đó
      const matchedStories = await this.storyModel
        .find({
          $or: [{ title: searchRegex }, { slug: searchRegex }],
        })
        .select('_id')
        .lean()
        .exec();

      const matchedStoryIds = matchedStories.map((s) => s._id);

      const orConditions: any[] = [{ title: searchRegex }];
      if (matchedStoryIds.length > 0) {
        orConditions.push({ storyId: { $in: matchedStoryIds } });
      }

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: orConditions }];
        delete filter.$or;
      } else {
        filter.$or = orConditions;
      }
    }

    const sortMap: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      chapterNumber: 'chapterNumber',
      title: 'title',
      viewCount: 'viewCount',
    };

    const sortField = sortMap[query.sortBy || 'createdAt'] || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = query.skip !== undefined ? query.skip : (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      this.chapterModel
        .find(filter)
        .select('-content') // Danh sách không lấy toàn bộ text content dài để tối ưu băng thông
        .populate({
          path: 'storyId',
          select: 'title slug coverUrl authorId status visibility',
          populate: {
            path: 'authorId',
            select: 'displayName username avatarUrl email role',
          },
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.chapterModel.countDocuments(filter),
    ]);

    // Đính kèm thông tin pendingUpdate nếu có cho từng item
    const chapterIds = items.map((i) => i._id);
    const pendingUpdates = await this.chapterUpdateModel
      .find({
        chapterId: { $in: chapterIds },
        status: ChapterUpdateStatus.PENDING_REVIEW,
      })
      .lean();
    const updateMap = new Map(
      pendingUpdates.map((u) => [u.chapterId.toString(), u]),
    );

    const enrichedItems = items.map((item: any) => {
      const pending = updateMap.get(item._id.toString());
      return pending
        ? Object.assign({}, item, {
            pendingUpdate: pending,
            isPendingUpdateReview: true,
          })
        : item;
    });

    return {
      items: enrichedItems,
      pagination: buildPaginationMeta(totalItems, page, limit),
    };
  }

  /**
   * Lấy số lượng thống kê chương theo từng tab trạng thái
   */
  async getCounts(storyId?: string): Promise<{
    all: number;
    pending: number;
    published: number;
    rejected: number;
    draft: number;
    hidden: number;
  }> {
    const matchFilter: Record<string, any> = {};
    if (storyId && Types.ObjectId.isValid(storyId)) {
      matchFilter.storyId = new Types.ObjectId(storyId);
    }

    const statusAggregate = await this.chapterModel.aggregate([
      ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      all: 0,
      pending: 0,
      published: 0,
      rejected: 0,
      draft: 0,
      hidden: 0,
    };

    let total = 0;
    for (const item of statusAggregate) {
      total += item.count;
      if (item._id === ChapterStatus.PENDING_REVIEW) {
        counts.pending = item.count;
      } else if (item._id === ChapterStatus.PUBLISHED) {
        counts.published = item.count;
      } else if (item._id === ChapterStatus.REJECTED) {
        counts.rejected = item.count;
      } else if (item._id === ChapterStatus.HIDDEN) {
        counts.hidden = item.count;
      } else if (item._id === ChapterStatus.DRAFT) {
        counts.draft = item.count;
      }
    }

    // Đếm thêm số lượng bản sửa đổi ChapterUpdate đang chờ duyệt
    const updateFilter: Record<string, any> = {
      status: ChapterUpdateStatus.PENDING_REVIEW,
    };
    if (storyId && Types.ObjectId.isValid(storyId)) {
      updateFilter.storyId = new Types.ObjectId(storyId);
    }
    const pendingUpdatesCount = await this.chapterUpdateModel.countDocuments(
      updateFilter,
    );
    counts.pending += pendingUpdatesCount;
    total += pendingUpdatesCount;

    counts.all = total;
    return counts;
  }

  /**
   * Xem chi tiết chương truyện (kèm toàn bộ nội dung, thông tin truyện và tác giả)
   */
  async findById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel
      .findById(id)
      .populate({
        path: 'storyId',
        select: 'title slug coverUrl authorId status visibility',
        populate: {
          path: 'authorId',
          select: 'displayName username avatarUrl email role',
        },
      })
      .lean()
      .exec();

    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const pendingUpdate = await this.chapterUpdateModel
      .findOne({
        chapterId: chapter._id,
        status: {
          $in: [
            ChapterUpdateStatus.PENDING_REVIEW,
            ChapterUpdateStatus.DRAFT,
            ChapterUpdateStatus.REJECTED,
          ],
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    return Object.assign({}, chapter, {
      pendingUpdate: pendingUpdate || null,
    });
  }

  /**
   * Phê duyệt chương truyện (chuyển sang PUBLISHED và gửi thông báo cho tác giả)
   */
  async approveChapter(id: string, reviewerId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(id);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const story = await this.storyModel.findById(chapter.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    // Trường hợp A: Chương đã PUBLISHED và đang có bản sửa ChapterUpdate chờ duyệt
    const pendingUpdate = await this.chapterUpdateModel
      .findOne({
        chapterId: chapter._id,
        status: ChapterUpdateStatus.PENDING_REVIEW,
      })
      .sort({ createdAt: -1 });

    if (pendingUpdate && chapter.status === ChapterStatus.PUBLISHED) {
      if (pendingUpdate.title) chapter.title = pendingUpdate.title;
      if (pendingUpdate.content) chapter.content = pendingUpdate.content;
      if (pendingUpdate.isFree !== undefined) chapter.isFree = pendingUpdate.isFree;
      if (pendingUpdate.coinPrice !== undefined) chapter.coinPrice = pendingUpdate.coinPrice;
      if (pendingUpdate.requirePreviousChapter !== undefined) {
        chapter.requirePreviousChapter = pendingUpdate.requirePreviousChapter;
      }
      chapter.rejectReason = null;
      if (pendingUpdate.content) {
        chapter.wordCount = countWords(pendingUpdate.content);
      }
      await chapter.save();

      await this.updateStoryStats(story._id);

      pendingUpdate.status = ChapterUpdateStatus.APPROVED;
      pendingUpdate.reviewerId = new Types.ObjectId(reviewerId);
      pendingUpdate.reviewedAt = new Date();
      await pendingUpdate.save();

      try {
        await this.notificationsService.create({
          userId: story.authorId.toString(),
          type: NotificationType.MODERATION,
          title: '🎉 Bản chỉnh sửa chương đã được phê duyệt!',
          message: `Bản chỉnh sửa của Chương ${chapter.chapterNumber}: "${chapter.title}" của tác phẩm "${story.title}" đã được duyệt và cập nhật thành công.`,
          storyId: story._id.toString(),
          chapterId: chapter._id.toString(),
          actorId: reviewerId,
        });
      } catch {}

      return {
        message: 'Phê duyệt bản chỉnh sửa chương thành công',
        chapter: await this.findById(chapter._id.toString()),
      };
    }

    // Trường hợp B: Duyệt chương mới / chương chưa PUBLISHED
    // RÀNG BUỘC NGHIỆP VỤ: Kiểm tra toàn bộ các chương trước đó. Tất cả phải đã ở trạng thái PUBLISHED!
    const unapprovedPrevChapter = await this.chapterModel
      .findOne({
        storyId: chapter.storyId,
        chapterNumber: { $lt: chapter.chapterNumber },
        status: { $ne: ChapterStatus.PUBLISHED },
      })
      .sort({ chapterNumber: 1 })
      .lean();

    if (unapprovedPrevChapter) {
      const statusLabels: Record<string, string> = {
        [ChapterStatus.PENDING_REVIEW]: 'Đang chờ duyệt',
        [ChapterStatus.DRAFT]: 'Bản nháp',
        [ChapterStatus.REJECTED]: 'Bị từ chối',
        [ChapterStatus.HIDDEN]: 'Tạm ẩn',
      };
      const prevStatusLabel =
        statusLabels[unapprovedPrevChapter.status] || 'Chưa xuất bản';

      throw new BadRequestException(
        `Không thể phê duyệt Chương ${chapter.chapterNumber} vì Chương ${unapprovedPrevChapter.chapterNumber} chưa được xuất bản (đang ở trạng thái: ${prevStatusLabel}). Vui lòng phê duyệt các chương trước theo đúng thứ tự liên tục.`,
      );
    }

    // Kiểm tra tính liên tục (không bị khuyết số chương trước đó)
    const prevCount = await this.chapterModel.countDocuments({
      storyId: chapter.storyId,
      chapterNumber: { $lt: chapter.chapterNumber },
      status: ChapterStatus.PUBLISHED,
    });

    if (prevCount !== chapter.chapterNumber - 1) {
      throw new BadRequestException(
        `Không thể phê duyệt Chương ${chapter.chapterNumber} vì danh sách chương trước đó không liên tục (thiếu chương). Vui lòng kiểm tra lại thứ tự chương của tác phẩm.`,
      );
    }

    const now = new Date();
    chapter.status = ChapterStatus.PUBLISHED;
    chapter.rejectReason = null;
    chapter.scheduledAt = chapter.scheduledAt || now;
    chapter.wordCount = countWords(chapter.content);
    await chapter.save();

    await this.updateStoryStats(story._id);

    // Gửi thông báo tới tác giả truyện
    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '🎉 Chương truyện đã được phê duyệt!',
        message: `Chương ${chapter.chapterNumber}: "${chapter.title}" của tác phẩm "${story.title}" đã được duyệt và chính thức xuất bản.`,
        storyId: story._id.toString(),
        chapterId: chapter._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // Bỏ qua lỗi gửi notification nếu có
    }

    return {
      message: 'Phê duyệt chương truyện thành công',
      chapter: await this.findById(chapter._id.toString()),
    };
  }

  /**
   * Hủy duyệt / Từ chối duyệt chương truyện (chuyển sang REJECTED kèm lý do và gửi thông báo)
   */
  async rejectChapter(
    id: string,
    reviewerId: string,
    dto: AdminRejectChapterDto,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(id);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const story = await this.storyModel.findById(chapter.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    // Trường hợp A: Từ chối bản sửa ChapterUpdate của chương đã PUBLISHED
    const pendingUpdate = await this.chapterUpdateModel
      .findOne({
        chapterId: chapter._id,
        status: ChapterUpdateStatus.PENDING_REVIEW,
      })
      .sort({ createdAt: -1 });

    if (pendingUpdate && chapter.status === ChapterStatus.PUBLISHED) {
      pendingUpdate.status = ChapterUpdateStatus.REJECTED;
      pendingUpdate.rejectReason = dto.reason.trim();
      pendingUpdate.reviewerId = new Types.ObjectId(reviewerId);
      pendingUpdate.reviewedAt = new Date();
      await pendingUpdate.save();

      try {
        await this.notificationsService.create({
          userId: story.authorId.toString(),
          type: NotificationType.MODERATION,
          title: '❌ Bản chỉnh sửa chương bị từ chối phê duyệt',
          message: `Bản chỉnh sửa Chương ${chapter.chapterNumber}: "${chapter.title}" của tác phẩm "${story.title}" đã bị từ chối. Lý do: ${dto.reason.trim()}`,
          storyId: story._id.toString(),
          chapterId: chapter._id.toString(),
          actorId: reviewerId,
        });
      } catch {}

      return {
        message: 'Từ chối bản chỉnh sửa chương thành công (bản phát hành vẫn hoạt động)',
        chapter: await this.findById(chapter._id.toString()),
      };
    }

    chapter.status = ChapterStatus.REJECTED;
    chapter.rejectReason = dto.reason.trim();
    await chapter.save();

    await this.updateStoryStats(story._id);

    // Gửi thông báo từ chối tới tác giả
    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '❌ Chương truyện bị từ chối phê duyệt',
        message: `Chương ${chapter.chapterNumber}: "${chapter.title}" của tác phẩm "${story.title}" đã bị từ chối phê duyệt. Lý do: ${dto.reason.trim()}`,
        storyId: story._id.toString(),
        chapterId: chapter._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // Bỏ qua lỗi gửi notification nếu có
    }

    return {
      message: 'Đã từ chối/hủy duyệt chương truyện',
      chapter: await this.findById(chapter._id.toString()),
    };
  }

  /**
   * Gỡ duyệt chương truyện (chuyển từ PUBLISHED về DRAFT kèm lý do tùy chọn và gửi thông báo)
   */
  async unpublishChapter(
    id: string,
    reviewerId: string,
    dto?: AdminChapterModerationReasonDto,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(id);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const story = await this.storyModel.findById(chapter.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    // RÀNG BUỘC NGHIỆP VỤ: Không thể gỡ duyệt nếu có chương phía sau vẫn đang xuất bản
    const publishedLaterChapter = await this.chapterModel
      .findOne({
        storyId: chapter.storyId,
        chapterNumber: { $gt: chapter.chapterNumber },
        status: ChapterStatus.PUBLISHED,
      })
      .sort({ chapterNumber: -1 })
      .lean();

    if (publishedLaterChapter) {
      throw new BadRequestException(
        `Không thể gỡ duyệt Chương ${chapter.chapterNumber} vì Chương ${publishedLaterChapter.chapterNumber} phía sau đang xuất bản. Vui lòng gỡ duyệt theo thứ tự từ chương lớn nhất trở về trước.`,
      );
    }

    const reason = dto?.reason?.trim() || null;
    chapter.status = ChapterStatus.DRAFT;
    chapter.scheduledAt = null;
    if (reason) {
      chapter.rejectReason = reason;
    }
    await chapter.save();

    await this.updateStoryStats(story._id);

    // Gửi thông báo gỡ duyệt
    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '⚠️ Chương truyện đã bị gỡ duyệt',
        message: `Chương ${chapter.chapterNumber}: "${chapter.title}" thuộc tác phẩm "${story.title}" đã bị gỡ duyệt về bản nháp.${
          reason ? ` Lý do: ${reason}` : ''
        }`,
        storyId: story._id.toString(),
        chapterId: chapter._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // Bỏ qua lỗi
    }

    return {
      message: 'Gỡ duyệt chương truyện thành công (đã chuyển về bản nháp)',
      chapter: await this.findById(chapter._id.toString()),
    };
  }

  /**
   * Ẩn chương truyện (chuyển sang HIDDEN và gửi thông báo)
   */
  async hideChapter(
    id: string,
    reviewerId: string,
    dto?: AdminChapterModerationReasonDto,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(id);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const story = await this.storyModel.findById(chapter.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const reason = dto?.reason?.trim() || null;
    chapter.status = ChapterStatus.HIDDEN;
    if (reason) {
      chapter.rejectReason = reason;
    }
    await chapter.save();

    await this.updateStoryStats(story._id);

    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '🔒 Chương truyện đã bị tạm ẩn',
        message: `Chương ${chapter.chapterNumber}: "${chapter.title}" thuộc tác phẩm "${story.title}" đã bị ban quản trị ẩn khỏi hệ thống.${
          reason ? ` Lý do: ${reason}` : ''
        }`,
        storyId: story._id.toString(),
        chapterId: chapter._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // Bỏ qua lỗi gửi notification
    }

    return {
      message: 'Đã ẩn chương truyện thành công',
      chapter: await this.findById(chapter._id.toString()),
    };
  }

  /**
   * Mở lại chương truyện bị ẩn (chuyển về PUBLISHED nếu đã từng xuất bản hoặc DRAFT)
   */
  async unhideChapter(id: string, reviewerId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(id);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const story = await this.storyModel.findById(chapter.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    chapter.status = ChapterStatus.PUBLISHED;
    chapter.rejectReason = null;
    await chapter.save();

    await this.updateStoryStats(story._id);

    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '🌐 Chương truyện đã được mở lại',
        message: `Chương ${chapter.chapterNumber}: "${chapter.title}" thuộc tác phẩm "${story.title}" đã được hiển thị công khai trở lại.`,
        storyId: story._id.toString(),
        chapterId: chapter._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // Bỏ qua lỗi
    }

    return {
      message: 'Đã mở lại chương truyện thành công',
      chapter: await this.findById(chapter._id.toString()),
    };
  }

  /**
   * Chuyển chương truyện (bị từ chối) quay lại chờ duyệt (chuyển sang PENDING_REVIEW và gửi thông báo)
   */
  async resetPendingChapter(id: string, reviewerId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(id);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const story = await this.storyModel.findById(chapter.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    chapter.status = ChapterStatus.PENDING_REVIEW;
    chapter.rejectReason = null;
    await chapter.save();

    await this.updateStoryStats(story._id);

    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '⏳ Chương truyện được chuyển về chờ duyệt',
        message: `Chương ${chapter.chapterNumber}: "${chapter.title}" thuộc tác phẩm "${story.title}" đã được ban quản lý đưa trở lại hàng đợi chờ duyệt.`,
        storyId: story._id.toString(),
        chapterId: chapter._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // Bỏ qua lỗi gửi notification nếu có
    }

    return {
      message: 'Đã chuyển chương truyện về trạng thái chờ duyệt',
      chapter: await this.findById(chapter._id.toString()),
    };
  }
}
