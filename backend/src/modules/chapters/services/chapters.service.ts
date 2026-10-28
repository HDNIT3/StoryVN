import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { countWords } from '../../../common/utils/text.util.js';
import { UserRole } from '../../users/schemas/user.schema.js';
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
    @InjectModel(ChapterUpdate.name)
    private readonly chapterUpdateModel: Model<ChapterUpdateDocument>,
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

  private countChapterWords(htmlContent: string): number {
    return countWords(htmlContent);
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

    // Xác định số thứ tự chương (chapterNumber) — bắt buộc liên tục, không nhảy cóc
    const highest = await this.chapterModel
      .findOne({ storyId: story._id })
      .sort({ chapterNumber: -1 })
      .select('chapterNumber')
      .lean();
    const nextValidNumber = (highest?.chapterNumber || 0) + 1;
    let chapterNumber = dto.chapterNumber;

    if (chapterNumber === undefined || chapterNumber === null) {
      chapterNumber = nextValidNumber;
    } else {
      if (chapterNumber !== nextValidNumber) {
        throw new BadRequestException(
          `Số thứ tự chương phải là ${nextValidNumber}. Không được nhảy cóc hoặc trùng lặp.`,
        );
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

    // RÀNG BUỘC THỜI GIAN: Hẹn giờ chương mới không được sớm hơn hẹn giờ của chương trước
    if (dto.scheduledAt) {
      const scheduledDate = new Date(dto.scheduledAt);
      const prevWithSchedule = await this.chapterModel
        .findOne({
          storyId: story._id,
          chapterNumber: { $lt: chapterNumber },
          scheduledAt: { $gt: scheduledDate },
        })
        .sort({ chapterNumber: -1 })
        .lean();

      if (prevWithSchedule && prevWithSchedule.scheduledAt) {
        throw new BadRequestException(
          `Thời gian hẹn giờ của Chương ${chapterNumber} không được sớm hơn thời gian hẹn giờ của Chương ${prevWithSchedule.chapterNumber} (${new Date(prevWithSchedule.scheduledAt).toLocaleString('vi-VN')}).`,
        );
      }
    }

    const chapter = new this.chapterModel({
      storyId: story._id,
      chapterNumber,
      title: dto.title.trim(),
      content: dto.content,
      wordCount,
      status,
      isFree,
      coinPrice,
      requirePreviousChapter,
      viewCount: 0,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
    });

    const saved = await chapter.save();

    // Cập nhật stats.chapterCount + stats.wordCount trên truyện
    await this.updateStoryStats(story._id);

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

    // Nếu không phải tác giả truyện và không phải Quản lý, chỉ cho xem chương PUBLISHED và đã đến giờ phát hành liên tục
    if (!isOwner && !isAdminOrManager) {
      const now = new Date();
      const firstUnreleased = await this.chapterModel
        .findOne({
          storyId: story._id,
          $or: [
            { status: { $ne: ChapterStatus.PUBLISHED } },
            { scheduledAt: { $gt: now } },
          ],
        })
        .sort({ chapterNumber: 1 })
        .lean();

      filter.status = ChapterStatus.PUBLISHED;
      filter.$or = [
        { scheduledAt: null },
        { scheduledAt: { $lte: now } },
      ];

      if (firstUnreleased) {
        filter.chapterNumber = { $lt: firstUnreleased.chapterNumber };
      }
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

    const rawItems = await queryBuilder.lean().exec();
    let items = rawItems;

    // Thống kê nhanh cho tác giả nếu là chủ truyện
    let stats = null;
    if (isOwner || isAdminOrManager) {
      // Đính kèm thông tin pendingUpdate mới nhất cho từng chương
      const chapterIds = rawItems.map((i: any) => i._id);
      const updates = await this.chapterUpdateModel
        .find({
          chapterId: { $in: chapterIds },
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

      const updateMap = new Map();
      for (const u of updates) {
        if (!updateMap.has(u.chapterId.toString())) {
          updateMap.set(u.chapterId.toString(), u);
        }
      }

      items = rawItems.map((item: any) => ({
        ...item,
        pendingUpdate: updateMap.get(item._id.toString()) || null,
      }));

      const allStoryChapters = await this.chapterModel
        .find({ storyId: story._id })
        .select('status viewCount wordCount isFree coinPrice')
        .lean();

      const pendingUpdatesCount = await this.chapterUpdateModel.countDocuments({
        storyId: story._id,
        status: ChapterUpdateStatus.PENDING_REVIEW,
      });

      stats = {
        totalChapters: allStoryChapters.length,
        published: allStoryChapters.filter((c) => c.status === ChapterStatus.PUBLISHED).length,
        pending: allStoryChapters.filter((c) => c.status === ChapterStatus.PENDING_REVIEW).length + pendingUpdatesCount,
        draft: allStoryChapters.filter((c) => c.status === ChapterStatus.DRAFT).length,
        rejected: allStoryChapters.filter((c) => c.status === ChapterStatus.REJECTED).length,
        totalViews: allStoryChapters.reduce((sum, c) => sum + (c.viewCount || 0), 0),
        totalWords: allStoryChapters.reduce((sum, c) => sum + (c.wordCount || 0), 0),
      };
    }

    return {
      items,
      total,
      page: query.page || 1,
      limit: query.limit || total,
      story: {
        _id: story._id,
        authorId: (story.authorId as any)?._id || story.authorId,
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
  ): Promise<any> {
    if (!Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(chapterId);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const story = await this.storyModel.findById(chapter.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const isOwner =
      userId && story.authorId.toString() === userId.toString();
    const isAdminOrManager =
      userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;

    // Nếu chương không phải PUBLISHED, cần quyền sở hữu hoặc Manager/Admin
    if (chapter.status !== ChapterStatus.PUBLISHED) {
      if (!isOwner && !isAdminOrManager) {
        throw new ForbiddenException(ErrorCode.CHAPTER_FORBIDDEN);
      }
    }

    // Nếu chương PUBLISHED nhưng có scheduledAt > now, độc giả không được xem
    if (
      chapter.status === ChapterStatus.PUBLISHED &&
      chapter.scheduledAt &&
      chapter.scheduledAt > new Date()
    ) {
      if (!isOwner && !isAdminOrManager) {
        throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
      }
    }

    // Độc giả không được xem nếu bất kỳ chương trước đó chưa được phát hành tới độc giả
    if (!isOwner && !isAdminOrManager) {
      const unreleasedPrev = await this.chapterModel
        .findOne({
          storyId: story._id,
          chapterNumber: { $lt: chapter.chapterNumber },
          $or: [
            { status: { $ne: ChapterStatus.PUBLISHED } },
            { scheduledAt: { $gt: new Date() } },
          ],
        })
        .sort({ chapterNumber: 1 })
        .lean();

      if (unreleasedPrev) {
        throw new NotFoundException(
          `Chương này chưa thể xem vì Chương ${unreleasedPrev.chapterNumber} trước đó chưa đến thời gian phát hành.`,
        );
      }
    }

    const chapterObj: any = chapter.toObject();
    chapterObj.wordCount = this.countChapterWords(chapterObj.content);

    // Nếu là tác giả hoặc quản trị viên, kiểm tra xem có bản ghi ChapterUpdate (bản sửa đang chờ duyệt/lưu nháp) không
    if (isOwner || isAdminOrManager) {
      const pendingUpdate = await this.chapterUpdateModel
        .findOne({
          chapterId: chapter._id,
          status: {
            $in: [
              ChapterUpdateStatus.DRAFT,
              ChapterUpdateStatus.PENDING_REVIEW,
              ChapterUpdateStatus.REJECTED,
            ],
          },
        })
        .sort({ createdAt: -1 })
        .lean();

      chapterObj.pendingUpdate = pendingUpdate || null;
    }

    return chapterObj;
  }

  /**
   * UC-15 & UC-16: Chỉnh sửa chương truyện
   */
  async updateChapter(
    userId: string | Types.ObjectId,
    chapterId: string,
    dto: UpdateChapterDto,
    userRole?: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(chapterId);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    await this.verifyStoryOwnership(userId, chapter.storyId, userRole);

    // Nếu tác giả yêu cầu hủy bỏ bản sửa đổi nháp của chương đã PUBLISHED
    if (dto.action === ChapterAction.DISCARD_UPDATE) {
      if (chapter.status === ChapterStatus.PUBLISHED) {
        await this.chapterUpdateModel.deleteMany({
          chapterId: chapter._id,
          status: {
            $in: [
              ChapterUpdateStatus.DRAFT,
              ChapterUpdateStatus.PENDING_REVIEW,
              ChapterUpdateStatus.REJECTED,
            ],
          },
        });
        const chapterObj: any = chapter.toObject();
        chapterObj.pendingUpdate = null;
        return chapterObj;
      }
      return chapter;
    }

    // TRƯỜNG HỢP 1: Chương ĐÃ XUẤT BẢN (PUBLISHED)
    // Giữ nguyên bản chính trong `chapters` cho độc giả đọc, lưu bản sửa vào `chapter_updates`
    if (chapter.status === ChapterStatus.PUBLISHED) {
      if (dto.content !== undefined) {
        const wordCount = this.countChapterWords(dto.content);
        if (wordCount > 2500) {
          throw new BadRequestException('Nội dung chương không được vượt quá 2.500 từ');
        }
      }

      // Tìm bản ghi đang hoạt động (DRAFT, PENDING_REVIEW, REJECTED) — lấy bản mới nhất
      let activeUpdate = await this.chapterUpdateModel
        .findOne({
          chapterId: chapter._id,
          status: {
            $in: [
              ChapterUpdateStatus.DRAFT,
              ChapterUpdateStatus.PENDING_REVIEW,
              ChapterUpdateStatus.REJECTED,
            ],
          },
        })
        .sort({ createdAt: -1 });

      const isFree =
        dto.isFree !== undefined
          ? dto.isFree
          : (activeUpdate?.isFree ?? chapter.isFree);

      let coinPrice =
        dto.coinPrice !== undefined
          ? dto.coinPrice
          : (activeUpdate?.coinPrice ?? chapter.coinPrice);

      let requirePreviousChapter =
        dto.requirePreviousChapter !== undefined
          ? dto.requirePreviousChapter
          : (activeUpdate?.requirePreviousChapter ?? chapter.requirePreviousChapter);

      if (!isFree) {
        if (coinPrice <= 0) {
          throw new BadRequestException(ErrorCode.CHAPTER_COIN_INVALID);
        }
      } else {
        coinPrice = 0;
        requirePreviousChapter = false;
      }

      const newTitle = dto.title !== undefined ? dto.title.trim() : (activeUpdate?.title ?? chapter.title);
      const newContent = dto.content !== undefined ? dto.content : (activeUpdate?.content ?? chapter.content);
      const newWordCount = this.countChapterWords(newContent);
      const newStatus =
        dto.action === ChapterAction.SUBMIT
          ? ChapterUpdateStatus.PENDING_REVIEW
          : ChapterUpdateStatus.DRAFT;

      if (!activeUpdate || activeUpdate.status === ChapterUpdateStatus.REJECTED) {
        // Tạo bản ghi ChapterUpdate MỚI (nếu chưa có hoặc bản cũ đã bị từ chối)
        activeUpdate = new this.chapterUpdateModel({
          chapterId: chapter._id,
          storyId: chapter.storyId,
          authorId: new Types.ObjectId(userId),
          title: newTitle,
          content: newContent,
          wordCount: newWordCount,
          isFree,
          coinPrice,
          requirePreviousChapter,
          status: newStatus,
        });
      } else {
        // Bản DRAFT hoặc PENDING_REVIEW đang mở: cập nhật tại chỗ
        activeUpdate.title = newTitle;
        activeUpdate.content = newContent;
        activeUpdate.wordCount = newWordCount;
        activeUpdate.isFree = isFree;
        activeUpdate.coinPrice = coinPrice;
        activeUpdate.requirePreviousChapter = requirePreviousChapter;
        activeUpdate.status = newStatus;
        activeUpdate.rejectReason = null;
      }

      const savedUpdate = await activeUpdate.save();
      const chapterObj: any = chapter.toObject();
      chapterObj.pendingUpdate = savedUpdate;
      return chapterObj;
    }

    // TRƯỜNG HỢP 2: Chương CHƯA PUBLISHED (DRAFT, PENDING_REVIEW, REJECTED)
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
      chapter.wordCount = wordCount;
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

    if (dto.scheduledAt !== undefined) {
      if (dto.scheduledAt) {
        const scheduledDate = new Date(dto.scheduledAt);
        const prevWithSchedule = await this.chapterModel
          .findOne({
            storyId: chapter.storyId,
            chapterNumber: { $lt: chapter.chapterNumber },
            scheduledAt: { $gt: scheduledDate },
          })
          .sort({ chapterNumber: -1 })
          .lean();

        if (prevWithSchedule && prevWithSchedule.scheduledAt) {
          throw new BadRequestException(
            `Thời gian hẹn giờ của Chương ${chapter.chapterNumber} không được sớm hơn thời gian hẹn giờ của Chương ${prevWithSchedule.chapterNumber} (${new Date(prevWithSchedule.scheduledAt).toLocaleString('vi-VN')}).`,
          );
        }

        const nextWithSchedule = await this.chapterModel
          .findOne({
            storyId: chapter.storyId,
            chapterNumber: { $gt: chapter.chapterNumber },
            scheduledAt: { $lt: scheduledDate },
          })
          .sort({ chapterNumber: 1 })
          .lean();

        if (nextWithSchedule && nextWithSchedule.scheduledAt) {
          throw new BadRequestException(
            `Thời gian hẹn giờ của Chương ${chapter.chapterNumber} không được muộn hơn thời gian hẹn giờ của Chương ${nextWithSchedule.chapterNumber} (${new Date(nextWithSchedule.scheduledAt).toLocaleString('vi-VN')}).`,
          );
        }
        chapter.scheduledAt = scheduledDate;
      } else {
        chapter.scheduledAt = null;
      }
    }

    // Luồng cập nhật trạng thái (UC-14, UC-16)
    if (dto.action === ChapterAction.SUBMIT) {
      chapter.status = ChapterStatus.PENDING_REVIEW;
      chapter.rejectReason = null;
    }

    const updated = await chapter.save();
    await this.updateStoryStats(chapter.storyId);

    return updated;
  }

  /**
   * Gửi duyệt hàng loạt các chương truyện (Tác giả)
   */
  async bulkSubmitChapters(
    userId: string | Types.ObjectId,
    chapterIds: string[],
    userRole?: string,
  ): Promise<{ submittedCount: number; message: string }> {
    if (!chapterIds || chapterIds.length === 0) {
      throw new BadRequestException('Danh sách chương không được để trống');
    }

    const validIds = chapterIds.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      throw new BadRequestException('Danh sách ID chương không hợp lệ');
    }

    const objectIds = validIds.map((id) => new Types.ObjectId(id));
    const chapters = await this.chapterModel.find({ _id: { $in: objectIds } });

    if (chapters.length === 0) {
      throw new NotFoundException('Không tìm thấy chương truyện nào hợp lệ');
    }

    // Xác thực quyền sở hữu cho từng câu chuyện
    const storyIds = [...new Set(chapters.map((c) => c.storyId.toString()))];
    for (const sId of storyIds) {
      await this.verifyStoryOwnership(userId, sId, userRole);
    }

    // Kiểm tra thứ tự liên tục: đối với mỗi truyện, các chương gửi duyệt phải liên tục
    // và các chương trước đó phải đã PUBLISHED/PENDING_REVIEW hoặc nằm trong mẻ gửi
    for (const sId of storyIds) {
      const storyObjectId = new Types.ObjectId(sId);
      const submittingChapters = chapters
        .filter((c) => c.storyId.toString() === sId)
        .filter(
          (c) =>
            c.status === ChapterStatus.DRAFT ||
            c.status === ChapterStatus.REJECTED,
        )
        .sort((a, b) => a.chapterNumber - b.chapterNumber);

      if (submittingChapters.length === 0) continue;

      // Lấy tất cả chương đã PUBLISHED hoặc PENDING_REVIEW của truyện này
      const existingApprovedNumbers = await this.chapterModel
        .find({
          storyId: storyObjectId,
          status: { $in: [ChapterStatus.PUBLISHED, ChapterStatus.PENDING_REVIEW] },
        })
        .select('chapterNumber')
        .lean();
      const approvedSet = new Set(existingApprovedNumbers.map((c) => c.chapterNumber));

      // Thêm các chương đang gửi vào tập hợp để kiểm tra liên tục
      const submittingSet = new Set(submittingChapters.map((c) => c.chapterNumber));

      for (const ch of submittingChapters) {
        // Mọi chương trước chương này phải đã có trong approved hoặc trong mẻ gửi
        for (let num = 1; num < ch.chapterNumber; num++) {
          if (!approvedSet.has(num) && !submittingSet.has(num)) {
            throw new BadRequestException(
              `Không thể gửi duyệt Chương ${ch.chapterNumber} vì Chương ${num} chưa được duyệt hoặc chưa nằm trong danh sách gửi.`,
            );
          }
        }
      }
    }

    let submittedCount = 0;

    // 1. Cập nhật các chương DRAFT hoặc REJECTED sang PENDING_REVIEW
    const draftOrRejectedIds = chapters
      .filter(
        (c) =>
          c.status === ChapterStatus.DRAFT ||
          c.status === ChapterStatus.REJECTED,
      )
      .map((c) => c._id);

    if (draftOrRejectedIds.length > 0) {
      const res = await this.chapterModel.updateMany(
        { _id: { $in: draftOrRejectedIds } },
        {
          $set: {
            status: ChapterStatus.PENDING_REVIEW,
            rejectReason: null,
          },
        },
      );
      submittedCount += res.modifiedCount;
    }

    // 2. Cập nhật các bản sửa ChapterUpdate đang ở DRAFT hoặc REJECTED sang PENDING_REVIEW
    const activeUpdateIds = await this.chapterUpdateModel
      .find({
        chapterId: { $in: objectIds },
        status: {
          $in: [ChapterUpdateStatus.DRAFT, ChapterUpdateStatus.REJECTED],
        },
      })
      .select('_id')
      .lean();

    if (activeUpdateIds.length > 0) {
      const updateRes = await this.chapterUpdateModel.updateMany(
        { _id: { $in: activeUpdateIds.map((u) => u._id) } },
        {
          $set: {
            status: ChapterUpdateStatus.PENDING_REVIEW,
            rejectReason: null,
          },
        },
      );
      submittedCount += updateRes.modifiedCount;
    }

    return {
      submittedCount,
      message: `Đã gửi yêu cầu phê duyệt thành công ${submittedCount} chương`,
    };
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

    // 1. Ràng buộc: Chương đã PUBLISHED tuyệt đối không được xóa
    if (chapter.status === ChapterStatus.PUBLISHED) {
      throw new BadRequestException(
        'Không thể xóa chương đã xuất bản. Bạn chỉ có thể gỡ duyệt hoặc tạm ẩn chương.',
      );
    }

    // 2. Ràng buộc: Nếu có chương phía sau đã xuất bản thì không được xóa chương trước
    const publishedLaterChapter = await this.chapterModel
      .findOne({
        storyId: chapter.storyId,
        chapterNumber: { $gt: chapter.chapterNumber },
        status: ChapterStatus.PUBLISHED,
      })
      .sort({ chapterNumber: 1 })
      .lean();

    if (publishedLaterChapter) {
      throw new BadRequestException(
        `Không thể xóa Chương ${chapter.chapterNumber} vì Chương ${publishedLaterChapter.chapterNumber} phía sau đã được xuất bản. Vui lòng gỡ duyệt các chương sau trước.`,
      );
    }

    const storyId = chapter.storyId;
    const deletedChapterNumber = chapter.chapterNumber;

    // 3. Xóa chapter và mọi bản ChapterUpdate liên quan
    await this.chapterModel.deleteOne({ _id: chapter._id });
    await this.chapterUpdateModel.deleteMany({ chapterId: chapter._id });

    // 4. Tự động dồn thứ tự các chương phía sau lên 1 bậc (dồn lên)
    const laterChapters = await this.chapterModel
      .find({
        storyId,
        chapterNumber: { $gt: deletedChapterNumber },
      })
      .sort({ chapterNumber: 1 });

    for (const laterCh of laterChapters) {
      await this.chapterModel.updateOne(
        { _id: laterCh._id },
        { $set: { chapterNumber: laterCh.chapterNumber - 1 } },
      );
    }

    // 5. Cập nhật lại stats.chapterCount + stats.wordCount trên Story
    await this.updateStoryStats(storyId);

    const message =
      laterChapters.length > 0
        ? `Xóa chương truyện thành công. Đã tự động dồn thứ tự cho ${laterChapters.length} chương phía sau.`
        : 'Xóa chương truyện thành công';

    return {
      success: true,
      message,
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

    // Cập nhật lại thống kê hiển thị (số chương + số từ) sau khi đổi thứ tự
    await this.updateStoryStats(story._id);

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
      .select('chapterNumber title status viewCount wordCount isFree coinPrice createdAt')
      .sort({ chapterNumber: 1 })
      .lean();

    const totalChapters = chapters.length;
    const published = chapters.filter((c) => c.status === ChapterStatus.PUBLISHED).length;
    const pending = chapters.filter((c) => c.status === ChapterStatus.PENDING_REVIEW).length;
    const draft = chapters.filter((c) => c.status === ChapterStatus.DRAFT).length;
    const rejected = chapters.filter((c) => c.status === ChapterStatus.REJECTED).length;
    const totalViews = chapters.reduce((sum, c) => sum + (c.viewCount || 0), 0);
    const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
    const paidCount = chapters.filter((c) => !c.isFree).length;
    const freeCount = chapters.filter((c) => c.isFree).length;

    return {
      totalChapters,
      published,
      pending,
      draft,
      rejected,
      totalViews,
      totalWords,
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

    // Chỉ hiển thị chương PUBLISHED mà scheduledAt <= now hoặc null cho độc giả
    const now = new Date();
    // BẢO VỆ TÍNH LIÊN TỤC: Tìm chương đầu tiên chưa phát hành tới độc giả (để không bị miss chương)
    const firstUnreleased = await this.chapterModel
      .findOne({
        storyId: story._id,
        $or: [
          { status: { $ne: ChapterStatus.PUBLISHED } },
          { scheduledAt: { $gt: now } },
        ],
      })
      .sort({ chapterNumber: 1 })
      .lean();

    const filter: Record<string, any> = {
      storyId: story._id,
      status: ChapterStatus.PUBLISHED,
      $or: [
        { scheduledAt: null },
        { scheduledAt: { $lte: now } },
      ],
    };

    if (firstUnreleased) {
      filter.chapterNumber = { $lt: firstUnreleased.chapterNumber };
    }
    const sortOrder = options?.order === 'desc' ? -1 : 1;

    const total = await this.chapterModel.countDocuments(filter);

    let queryBuilder = this.chapterModel
      .find(filter)
      .select('chapterNumber title wordCount viewCount createdAt updatedAt')
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

  /**
   * Lấy chi tiết một chương truyện để đọc (Công khai)
   * Kèm tăng view, tính số từ, lấy thông tin chương trước / chương sau
   */
  async getChapterByStorySlugAndNumber(
    slug: string,
    chapterNumber: number,
    userId?: string | Types.ObjectId,
    userRole?: string,
  ) {
    const story = await this.storyModel
      .findOne({ slug })
      .select('title slug coverUrl authorId status visibility')
      .populate('authorId', 'displayName username')
      .lean();

    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const chapter = await this.chapterModel.findOne({
      storyId: story._id,
      chapterNumber,
    });

    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const isOwner =
      userId && (story.authorId as any)?._id?.toString() === userId.toString();
    const isAdminOrManager =
      userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;

    // Nếu chương không phải PUBLISHED, cần quyền sở hữu hoặc Manager/Admin
    if (chapter.status !== ChapterStatus.PUBLISHED) {
      if (!isOwner && !isAdminOrManager) {
        throw new ForbiddenException(ErrorCode.CHAPTER_FORBIDDEN);
      }
    }

    // Nếu chương PUBLISHED nhưng có scheduledAt > now, chỉ tác giả/admin được xem
    if (
      chapter.status === ChapterStatus.PUBLISHED &&
      chapter.scheduledAt &&
      chapter.scheduledAt > new Date()
    ) {
      if (!isOwner && !isAdminOrManager) {
        throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
      }
    }

    // Nếu độc giả cố truy cập một chương mà các chương trước chưa được phát hành tới độc giả:
    if (!isOwner && !isAdminOrManager) {
      const unreleasedPrev = await this.chapterModel
        .findOne({
          storyId: story._id,
          chapterNumber: { $lt: chapterNumber },
          $or: [
            { status: { $ne: ChapterStatus.PUBLISHED } },
            { scheduledAt: { $gt: new Date() } },
          ],
        })
        .sort({ chapterNumber: 1 })
        .lean();

      if (unreleasedPrev) {
        throw new NotFoundException(
          `Chương này chưa thể xem vì Chương ${unreleasedPrev.chapterNumber} trước đó chưa đến thời gian phát hành.`,
        );
      }
    }

    // Tăng lượt đọc ngầm (atomic increment, không cập nhật updatedAt)
    await this.chapterModel.updateOne(
      { _id: chapter._id },
      { $inc: { viewCount: 1 } },
      { timestamps: false },
    );
    await this.storyModel.updateOne(
      { _id: story._id },
      { $inc: { 'stats.viewCount': 1 } },
      { timestamps: false },
    );

    // Tìm chương trước và chương sau — chỉ lấy chương PUBLISHED + scheduledAt <= now cho độc giả
    const now = new Date();
    const readerNavFilter: any = {
      storyId: story._id,
      status: ChapterStatus.PUBLISHED,
      $or: [
        { scheduledAt: null },
        { scheduledAt: { $lte: now } },
      ],
    };

    // Tìm chương đầu tiên chưa phát hành tới độc giả để chặn nav nhảy cóc
    if (!isOwner && !isAdminOrManager) {
      const firstUnreleasedForNav = await this.chapterModel
        .findOne({
          storyId: story._id,
          $or: [
            { status: { $ne: ChapterStatus.PUBLISHED } },
            { scheduledAt: { $gt: now } },
          ],
        })
        .sort({ chapterNumber: 1 })
        .lean();

      if (firstUnreleasedForNav) {
        readerNavFilter.chapterNumber = { $lt: firstUnreleasedForNav.chapterNumber };
      }
    }

    const navFilter = (isOwner || isAdminOrManager)
      ? { storyId: story._id }
      : readerNavFilter;

    const [prevChapter, nextChapter, allChaptersList] = await Promise.all([
      this.chapterModel
        .findOne({
          ...navFilter,
          chapterNumber: { $lt: chapterNumber },
        })
        .sort({ chapterNumber: -1 })
        .select('chapterNumber title')
        .lean(),
      this.chapterModel
        .findOne({
          ...navFilter,
          chapterNumber: { $gt: chapterNumber },
        })
        .sort({ chapterNumber: 1 })
        .select('chapterNumber title')
        .lean(),
      this.chapterModel
        .find(navFilter)
        .sort({ chapterNumber: 1 })
        .select('chapterNumber title')
        .lean(),
    ]);

    const wordCount =
      typeof chapter.wordCount === 'number'
        ? chapter.wordCount
        : this.countChapterWords(chapter.content);

    return {
      _id: chapter._id,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      content: chapter.content,
      viewCount: (chapter.viewCount || 0) + 1,
      wordCount,
      isFree: chapter.isFree,
      coinPrice: chapter.coinPrice,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      story: {
        _id: story._id,
        title: story.title,
        slug: story.slug,
        coverUrl: story.coverUrl,
        author:
          (story.authorId as any)?.displayName ||
          (story.authorId as any)?.username ||
          'Tác giả',
      },
      prevChapter: prevChapter
        ? { chapterNumber: prevChapter.chapterNumber, title: prevChapter.title }
        : null,
      nextChapter: nextChapter
        ? { chapterNumber: nextChapter.chapterNumber, title: nextChapter.title }
        : null,
      chaptersList: allChaptersList.map((c) => ({
        chapterNumber: c.chapterNumber,
        title: c.title,
      })),
    };
  }

  /**
   * Xem toàn bộ lịch sử các bản sửa đổi của chương (UC-15 & UC-16)
   */
  async getChapterUpdatesHistory(
    chapterId: string,
    userId: string | Types.ObjectId,
    userRole?: string,
  ): Promise<any[]> {
    if (!Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel.findById(chapterId);
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    await this.verifyStoryOwnership(userId, chapter.storyId, userRole);

    const history = await this.chapterUpdateModel
      .find({ chapterId: chapter._id })
      .populate('chapterId', 'chapterNumber title status')
      .populate('storyId', 'title slug coverUrl')
      .populate('authorId', 'displayName username avatarUrl')
      .populate('reviewerId', 'displayName username avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    return history;
  }

  /**
   * Xem danh sách tất cả lịch sử sửa đổi của các chương (UC-15 & UC-16)
   * Tác giả xem tất cả các bản chỉnh sửa thuộc truyện của mình, có thể lọc theo storyId, chapterId, status, search
   */
  async getAllChapterUpdatesHistory(
    userId: string | Types.ObjectId,
    userRole?: string,
    query?: {
      storyId?: string;
      chapterId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const filter: any = {};

    // Nếu không phải ADMIN hoặc MANAGER, chỉ xem các bản update của chính tác giả đó
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
      filter.authorId = new Types.ObjectId(userId.toString());
    }

    if (query?.storyId) {
      if (Types.ObjectId.isValid(query.storyId)) {
        filter.storyId = new Types.ObjectId(query.storyId);
      } else {
        const foundStory = await this.storyModel
          .findOne({ slug: query.storyId.trim() })
          .select('_id')
          .lean();
        if (foundStory) {
          filter.storyId = foundStory._id;
        }
      }
    }

    if (query?.chapterId) {
      if (Types.ObjectId.isValid(query.chapterId)) {
        filter.chapterId = new Types.ObjectId(query.chapterId);
      } else if (!isNaN(Number(query.chapterId))) {
        const chNum = Number(query.chapterId);
        const foundCh = await this.chapterModel
          .findOne({
            ...(filter.storyId ? { storyId: filter.storyId } : {}),
            chapterNumber: chNum,
          })
          .select('_id')
          .lean();
        if (foundCh) {
          filter.chapterId = foundCh._id;
        }
      }
    }

    if (query?.status && Object.values(ChapterUpdateStatus).includes(query.status as any)) {
      filter.status = query.status;
    }

    if (query?.search && query.search.trim()) {
      filter.title = { $regex: query.search.trim(), $options: 'i' };
    }

    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.chapterUpdateModel
        .find(filter)
        .populate('chapterId', 'chapterNumber title status')
        .populate('storyId', 'title slug coverUrl')
        .populate('authorId', 'displayName username avatarUrl')
        .populate('reviewerId', 'displayName username avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.chapterUpdateModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
