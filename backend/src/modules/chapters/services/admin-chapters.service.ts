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
import { NotificationsService } from '../../notifications/notifications.service.js';
import { NotificationType } from '../../notifications/schemas/notification.schema.js';
import { Story, StoryDocument } from '../../stories/schemas/story.schema.js';
import {
  Chapter,
  ChapterDocument,
  ChapterStatus,
} from '../schemas/chapter.schema.js';
import { AdminChapterModerationReasonDto } from '../dto/admin-chapter-moderation-reason.dto.js';
import { AdminQueryChaptersDto } from '../dto/admin-query-chapters.dto.js';
import { AdminRejectChapterDto } from '../dto/admin-reject-chapter.dto.js';

@Injectable()
export class AdminChaptersService {
  constructor(
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Story.name)
    private readonly storyModel: Model<StoryDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Helper cập nhật số lượng chương trong Story
   */
  private async updateStoryChapterCount(storyId: Types.ObjectId): Promise<number> {
    const totalChapters = await this.chapterModel.countDocuments({
      storyId,
      status: {
        $in: [
          ChapterStatus.PUBLISHED,
          ChapterStatus.PENDING_REVIEW,
          ChapterStatus.DRAFT,
        ],
      },
    });

    await this.storyModel.updateOne(
      { _id: storyId },
      { 'stats.chapterCount': totalChapters },
    );

    return totalChapters;
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

    if (query.status) {
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

      filter.$or = orConditions;
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

    return {
      items,
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

    return chapter;
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

    chapter.status = ChapterStatus.PUBLISHED;
    chapter.rejectReason = null;
    chapter.publishedAt = new Date();
    await chapter.save();

    await this.updateStoryChapterCount(story._id);

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

    chapter.status = ChapterStatus.REJECTED;
    chapter.rejectReason = dto.reason.trim();
    await chapter.save();

    await this.updateStoryChapterCount(story._id);

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

    const reason = dto?.reason?.trim() || null;
    chapter.status = ChapterStatus.DRAFT;
    chapter.publishedAt = null;
    if (reason) {
      chapter.rejectReason = reason;
    }
    await chapter.save();

    await this.updateStoryChapterCount(story._id);

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
      message: 'Gỡ duyệt chương truyện thành công (đã chuyển về DRAFT)',
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

    await this.updateStoryChapterCount(story._id);

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

    await this.updateStoryChapterCount(story._id);

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

    await this.updateStoryChapterCount(story._id);

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
