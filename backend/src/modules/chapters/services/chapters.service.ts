import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { Story, StoryDocument } from '../../stories/schemas/story.schema.js';
import {
  Chapter,
  ChapterDocument,
  ChapterStatus,
} from '../schemas/chapter.schema.js';
import {
  ChapterAction,
  CreateChapterDto,
} from '../dto/create-chapter.dto.js';
import { QueryChaptersDto } from '../dto/query-chapters.dto.js';
import { ReorderChaptersDto } from '../dto/reorder-chapters.dto.js';
import { UpdateChapterDto } from '../dto/update-chapter.dto.js';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Story.name)
    private readonly storyModel: Model<StoryDocument>,
  ) {}

  /**
   * Helper kiểm tra quyền sở hữu truyện của tác giả
   */
  private async verifyStoryOwnership(
    userId: string | Types.ObjectId,
    storyId: string | Types.ObjectId,
    userRole?: string,
  ): Promise<StoryDocument> {
    if (!Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel.findById(storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.CHAPTER_STORY_NOT_FOUND);
    }

    const isOwner = story.authorId.toString() === userId.toString();
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(ErrorCode.CHAPTER_FORBIDDEN);
    }

    return story;
  }

  /**
   * Helper cập nhật số lượng chương (stats.chapterCount) trong Story
   */
  private async updateStoryChapterCount(storyId: Types.ObjectId): Promise<number> {
    const totalChapters = await this.chapterModel.countDocuments({
      storyId,
      status: { $in: [ChapterStatus.PUBLISHED, ChapterStatus.PENDING_REVIEW, ChapterStatus.DRAFT] },
    });

    await this.storyModel.updateOne(
      { _id: storyId },
      { 'stats.chapterCount': totalChapters },
    );

    return totalChapters;
  }

  private countChapterWords(htmlContent: string): number {
    if (!htmlContent) return 0;
    const plainText = htmlContent.replace(/<[^>]*>/g, ' ').trim();
    return plainText ? plainText.split(/\s+/).length : 0;
  }

  /**
   * UC-14 & UC-15: Tạo chương mới
   */
  async createChapter(
    userId: string | Types.ObjectId,
    dto: CreateChapterDto,
    userRole?: string,
  ): Promise<ChapterDocument> {
    const story = await this.verifyStoryOwnership(userId, dto.storyId, userRole);

    // Kiểm tra giới hạn 2.500 từ
    const wordCount = this.countChapterWords(dto.content);
    if (wordCount > 2500) {
      throw new BadRequestException('Nội dung chương không được vượt quá 2.500 từ');
    }

    // Xác định số thứ tự chương (chapterNumber)
    let chapterNumber = dto.chapterNumber;
    if (chapterNumber === undefined || chapterNumber === null) {
      const highest = await this.chapterModel
        .findOne({ storyId: story._id })
        .sort({ chapterNumber: -1 })
        .select('chapterNumber')
        .lean();
      chapterNumber = (highest?.chapterNumber || 0) + 1;
    } else {
      const exists = await this.chapterModel.findOne({
        storyId: story._id,
        chapterNumber,
      });
      if (exists) {
        throw new BadRequestException(ErrorCode.CHAPTER_NUMBER_EXISTS);
      }
    }

    // Cấu hình xu (UC-15)
    const isFree = dto.isFree ?? true;
    let coinPrice = dto.coinPrice ?? 0;
    let requirePreviousChapter = dto.requirePreviousChapter ?? false;

    if (!isFree) {
      if (!coinPrice || coinPrice <= 0) {
        throw new BadRequestException(ErrorCode.CHAPTER_COIN_INVALID);
      }
    } else {
      coinPrice = 0;
      requirePreviousChapter = false;
    }

    // Xác định trạng thái (UC-14)
    const action = dto.action || ChapterAction.DRAFT;
    const status =
      action === ChapterAction.SUBMIT
        ? ChapterStatus.PENDING_REVIEW
        : ChapterStatus.DRAFT;

    const chapter = new this.chapterModel({
      storyId: story._id,
      chapterNumber,
      title: dto.title.trim(),
      content: dto.content,
      status,
      isFree,
      coinPrice,
      requirePreviousChapter,
      viewCount: 0,
      publishedAt: null,
    });

    const saved = await chapter.save();

    // Cập nhật stats.chapterCount trên truyện
    await this.updateStoryChapterCount(story._id);

    return saved;
  }

  /**
   * UC-16: Lấy danh sách chương của một truyện
   */
  async getChaptersByStory(
    userId?: string | Types.ObjectId,
    query?: QueryChaptersDto,
    userRole?: string,
  ) {
    if (!query?.storyId || !Types.ObjectId.isValid(query.storyId)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel.findById(query.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const isOwner =
      userId && story.authorId.toString() === userId.toString();
    const isAdminOrManager =
      userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;

    const filter: Record<string, any> = {
      storyId: new Types.ObjectId(query.storyId),
    };

    // Nếu không phải tác giả truyện và không phải Quản lý, chỉ cho xem chương PUBLISHED
    if (!isOwner && !isAdminOrManager) {
      filter.status = ChapterStatus.PUBLISHED;
    } else if (query.status) {
      filter.status = query.status;
    }

    const sortBy = query.sortBy || 'chapterNumber';
    const sortOrder = query.order === 'desc' ? -1 : 1;
    const sortObj: Record<string, any> = { [sortBy]: sortOrder };

    // Tổng số chương khớp filter
    const total = await this.chapterModel.countDocuments(filter);

    let queryBuilder = this.chapterModel
      .find(filter)
      .select('-content') // Trừ nội dung khi lấy danh sách để tối ưu băng thông
      .sort(sortObj);

    if (query.page && query.limit) {
      const skip = (query.page - 1) * query.limit;
      queryBuilder = queryBuilder.skip(skip).limit(query.limit);
    }

    const items = await queryBuilder.exec();

    // Thống kê nhanh cho tác giả nếu là chủ truyện
    let stats = null;
    if (isOwner || isAdminOrManager) {
      const allStoryChapters = await this.chapterModel
        .find({ storyId: story._id })
        .select('status viewCount isFree coinPrice')
        .lean();

      stats = {
        totalChapters: allStoryChapters.length,
        published: allStoryChapters.filter((c) => c.status === ChapterStatus.PUBLISHED).length,
        pending: allStoryChapters.filter((c) => c.status === ChapterStatus.PENDING_REVIEW).length,
        draft: allStoryChapters.filter((c) => c.status === ChapterStatus.DRAFT).length,
        rejected: allStoryChapters.filter((c) => c.status === ChapterStatus.REJECTED).length,
        totalViews: allStoryChapters.reduce((sum, c) => sum + (c.viewCount || 0), 0),
      };
    }

    return {
      items,
      total,
      page: query.page || 1,
      limit: query.limit || total,
      story: {
        _id: story._id,
        title: story.title,
        slug: story.slug,
        status: story.status,
      },
      stats,
    };
  }

  /**
   * UC-16: Lấy chi tiết một chương truyện
   */
  async getChapterDetail(
    chapterId: string,
    userId?: string | Types.ObjectId,
    userRole?: string,
  ): Promise<ChapterDocument> {
    if (!Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(chapterId);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    // Nếu chương không phải PUBLISHED, cần quyền sở hữu hoặc Manager/Admin
    if (chapter.status !== ChapterStatus.PUBLISHED) {
      const story = await this.storyModel.findById(chapter.storyId);
      if (!story) {
        throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
      }

      const isOwner =
        userId && story.authorId.toString() === userId.toString();
      const isAdminOrManager =
        userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;

      if (!isOwner && !isAdminOrManager) {
        throw new ForbiddenException(ErrorCode.CHAPTER_FORBIDDEN);
      }
    }

    return chapter;
  }

  /**
   * UC-15 & UC-16: Chỉnh sửa chương truyện
   */
  async updateChapter(
    userId: string | Types.ObjectId,
    chapterId: string,
    dto: UpdateChapterDto,
    userRole?: string,
  ): Promise<ChapterDocument> {
    if (!Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(chapterId);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    await this.verifyStoryOwnership(userId, chapter.storyId, userRole);

    // Kiểm tra trùng chapterNumber nếu cập nhật
    if (
      dto.chapterNumber !== undefined &&
      dto.chapterNumber !== chapter.chapterNumber
    ) {
      const exists = await this.chapterModel.findOne({
        storyId: chapter.storyId,
        chapterNumber: dto.chapterNumber,
        _id: { $ne: chapter._id },
      });
      if (exists) {
        throw new BadRequestException(ErrorCode.CHAPTER_NUMBER_EXISTS);
      }
      chapter.chapterNumber = dto.chapterNumber;
    }

    if (dto.title !== undefined) {
      chapter.title = dto.title.trim();
    }

    if (dto.content !== undefined) {
      const wordCount = this.countChapterWords(dto.content);
      if (wordCount > 2500) {
        throw new BadRequestException('Nội dung chương không được vượt quá 2.500 từ');
      }
      chapter.content = dto.content;
    }

    // Cấu hình xu (UC-15)
    if (dto.isFree !== undefined) {
      chapter.isFree = dto.isFree;
    }

    if (!chapter.isFree) {
      if (dto.coinPrice !== undefined) {
        if (dto.coinPrice <= 0) {
          throw new BadRequestException(ErrorCode.CHAPTER_COIN_INVALID);
        }
        chapter.coinPrice = dto.coinPrice;
      } else if (chapter.coinPrice <= 0) {
        throw new BadRequestException(ErrorCode.CHAPTER_COIN_INVALID);
      }

      if (dto.requirePreviousChapter !== undefined) {
        chapter.requirePreviousChapter = dto.requirePreviousChapter;
      }
    } else {
      chapter.coinPrice = 0;
      chapter.requirePreviousChapter = false;
    }

    // Luồng cập nhật trạng thái (UC-14, UC-16)
    if (dto.action === ChapterAction.SUBMIT) {
      chapter.status = ChapterStatus.PENDING_REVIEW;
      chapter.rejectReason = null;
    } else {
      // Nếu là chương PUBLISHED mà tác giả chỉnh sửa, quy trình yêu cầu gửi duyệt lại
      if (chapter.status === ChapterStatus.PUBLISHED) {
        chapter.status = ChapterStatus.PENDING_REVIEW;
      }
      // Nếu đang DRAFT, giữ nguyên DRAFT
    }

    const updated = await chapter.save();
    await this.updateStoryChapterCount(chapter.storyId);

    return updated;
  }

  /**
   * UC-16: Xóa chương truyện theo điều kiện nghiệp vụ
   */
  async deleteChapter(
    userId: string | Types.ObjectId,
    chapterId: string,
    userRole?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(chapterId);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    await this.verifyStoryOwnership(userId, chapter.storyId, userRole);

    // Nghiệp vụ: Không xóa trực tiếp chương đã PUBLISHED
    if (chapter.status === ChapterStatus.PUBLISHED) {
      throw new BadRequestException(ErrorCode.CHAPTER_CANNOT_DELETE);
    }

    const storyId = chapter.storyId;
    await this.chapterModel.deleteOne({ _id: chapter._id });

    // Cập nhật lại stats.chapterCount trên Story
    await this.updateStoryChapterCount(storyId);

    return {
      success: true,
      message: 'Xóa chương truyện thành công',
    };
  }

  /**
   * UC-16: Sắp xếp lại thứ tự chương
   */
  async reorderChapters(
    userId: string | Types.ObjectId,
    storyId: string,
    dto: ReorderChaptersDto,
    userRole?: string,
  ): Promise<{ success: boolean; message: string }> {
    const story = await this.verifyStoryOwnership(userId, storyId, userRole);

    // Tạm thời gán số âm để tránh xung đột unique index { storyId: 1, chapterNumber: 1 }
    const bulkTempOps = dto.orders.map((item, index) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(item.chapterId), storyId: story._id },
        update: { $set: { chapterNumber: -(index + 1) } },
      },
    }));

    await this.chapterModel.bulkWrite(bulkTempOps);

    // Gán lại số thứ tự mới chính thức
    const bulkFinalOps = dto.orders.map((item) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(item.chapterId), storyId: story._id },
        update: { $set: { chapterNumber: item.chapterNumber } },
      },
    }));

    await this.chapterModel.bulkWrite(bulkFinalOps);

    return {
      success: true,
      message: 'Cập nhật thứ tự chương thành công',
    };
  }

  /**
   * UC-16: Thống kê chi tiết các chương trong truyện
   */
  async getStoryChaptersStats(
    userId: string | Types.ObjectId,
    storyId: string,
    userRole?: string,
  ) {
    const story = await this.verifyStoryOwnership(userId, storyId, userRole);

    const chapters = await this.chapterModel
      .find({ storyId: story._id })
      .select('chapterNumber title status viewCount isFree coinPrice createdAt')
      .sort({ chapterNumber: 1 })
      .lean();

    const totalChapters = chapters.length;
    const published = chapters.filter((c) => c.status === ChapterStatus.PUBLISHED).length;
    const pending = chapters.filter((c) => c.status === ChapterStatus.PENDING_REVIEW).length;
    const draft = chapters.filter((c) => c.status === ChapterStatus.DRAFT).length;
    const rejected = chapters.filter((c) => c.status === ChapterStatus.REJECTED).length;
    const totalViews = chapters.reduce((sum, c) => sum + (c.viewCount || 0), 0);
    const paidCount = chapters.filter((c) => !c.isFree).length;
    const freeCount = chapters.filter((c) => c.isFree).length;

    return {
      totalChapters,
      published,
      pending,
      draft,
      rejected,
      totalViews,
      paidCount,
      freeCount,
      topViewed: [...chapters]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5),
    };
  }

  /**
   * Lấy danh sách chương theo slug truyện (công khai, mọi role).
   * Trả về TẤT CẢ chương kể cả chưa được duyệt.
   */
  async getChaptersBySlug(
    slug: string,
    options?: { page?: number; limit?: number; order?: 'asc' | 'desc' },
  ) {
    const story = await this.storyModel.findOne({ slug }).lean();
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const filter = { storyId: story._id };
    const sortOrder = options?.order === 'desc' ? -1 : 1;

    const total = await this.chapterModel.countDocuments(filter);

    let queryBuilder = this.chapterModel
      .find(filter)
      .select('chapterNumber title createdAt updatedAt')
      .sort({ chapterNumber: sortOrder });

    if (options?.page && options?.limit) {
      const skip = (options.page - 1) * options.limit;
      queryBuilder = queryBuilder.skip(skip).limit(options.limit);
    }

    const items = await queryBuilder.lean();

    return {
      items,
      total,
      page: options?.page || 1,
      limit: options?.limit || total,
      story: {
        _id: story._id,
        title: story.title,
        slug: story.slug,
      },
    };
  }
}
