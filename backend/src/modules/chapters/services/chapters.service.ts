import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { RevisionStatus } from '../../../common/enums/revision-status.enum.js';
import { countWords } from '../../../common/utils/text.util.js';
import {
  getActiveRevision,
  hasRevisionWithStatus,
  toRevisionView,
  trimRevisions,
} from '../../../common/utils/revision.util.js';
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

  private cloneRevisionSnapshot(snapshot: any): Record<string, any> {
    const plain = snapshot?.toObject ? snapshot.toObject() : { ...(snapshot || {}) };
    delete plain._id;
    return plain;
  }

  private chapterHasOfficialVersion(chapter: ChapterDocument): boolean {
    return (
      chapter.status === ChapterStatus.PUBLISHED ||
      chapter.status === ChapterStatus.HIDDEN ||
      hasRevisionWithStatus(chapter.revisions, RevisionStatus.APPROVED)
    );
  }

  private buildChapterSnapshotFromDoc(
    chapter: ChapterDocument,
  ): Record<string, any> {
    return {
      title: chapter.title,
      content: chapter.content,
      isFree: chapter.isFree,
      coinPrice: chapter.coinPrice,
      requirePreviousChapter: chapter.requirePreviousChapter,
    };
  }

  private mergeChapterSnapshot(
    base: Record<string, any>,
    dto: UpdateChapterDto,
  ): Record<string, any> {
    const merged = {
      title: dto.title !== undefined ? dto.title.trim() : base.title,
      content: dto.content !== undefined ? dto.content : base.content,
      isFree: dto.isFree !== undefined ? dto.isFree : base.isFree,
      coinPrice:
        dto.coinPrice !== undefined ? dto.coinPrice : base.coinPrice,
      requirePreviousChapter:
        dto.requirePreviousChapter !== undefined
          ? dto.requirePreviousChapter
          : base.requirePreviousChapter,
    };

    if (merged.isFree) {
      merged.coinPrice = 0;
      merged.requirePreviousChapter = false;
    } else if (!merged.coinPrice || merged.coinPrice <= 0) {
      throw new BadRequestException(ErrorCode.CHAPTER_COIN_INVALID);
    }

    return merged;
  }

  private chapterSnapshotChanged(
    a: Record<string, any>,
    b: Record<string, any>,
  ): boolean {
    return (
      a.title !== b.title ||
      a.content !== b.content ||
      a.isFree !== b.isFree ||
      a.coinPrice !== b.coinPrice ||
      a.requirePreviousChapter !== b.requirePreviousChapter
    );
  }

  /**
   * Chuyển revision nhúng thành object phẳng cho API (tương thích payload cũ).
   */
  private mapChapterRevision(revision: any, chapter: any): any {
    if (!revision) return null;
    const snapshot = revision.snapshot || {};
    return toRevisionView(revision, {
      chapterId: chapter._id,
      storyId: chapter.storyId,
      wordCount: countWords(snapshot.content || ''),
      reviewerId: revision.reviewerId ?? null,
      reviewedAt: revision.reviewedAt ?? null,
    });
  }

  private async buildChapterResponse(
    chapterId: Types.ObjectId | string,
  ): Promise<any> {
    const chapter: any = await this.chapterModel
      .findById(chapterId)
      .select('+revisions')
      .lean();

    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const activeRevision = getActiveRevision(chapter.revisions);
    const pendingRevision = this.mapChapterRevision(activeRevision, chapter);
    delete chapter.revisions;

    return {
      ...chapter,
      pendingRevision,
    };
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
      // Với tác giả/quản lý: gộp cả bản sửa đang chờ duyệt / bị từ chối của
      // chương đã xuất bản để khớp với số liệu thống kê.
      if (query.status === ChapterStatus.PENDING_REVIEW) {
        filter.$or = [
          { status: ChapterStatus.PENDING_REVIEW },
          { 'revisions.status': RevisionStatus.PENDING_REVIEW },
        ];
      } else if (query.status === ChapterStatus.REJECTED) {
        filter.$or = [
          { status: ChapterStatus.REJECTED },
          { 'revisions.status': RevisionStatus.REJECTED },
        ];
      } else {
        filter.status = query.status;
      }
    }

    const sortBy = query.sortBy || 'chapterNumber';
    const sortOrder = query.order === 'desc' ? -1 : 1;
    const sortObj: Record<string, any> = { [sortBy]: sortOrder };

    // Tổng số chương khớp filter
    const total = await this.chapterModel.countDocuments(filter);

    const canManage = isOwner || isAdminOrManager;

    let queryBuilder = this.chapterModel
      .find(filter)
      // Trừ nội dung khi lấy danh sách để tối ưu băng thông
      .select(canManage ? '-content +revisions' : '-content')
      .sort(sortObj);

    if (query.page && query.limit) {
      const skip = (query.page - 1) * query.limit;
      queryBuilder = queryBuilder.skip(skip).limit(query.limit);
    }

    const rawItems = await queryBuilder.lean().exec();
    let items: any[] = rawItems;

    // Thống kê nhanh cho tác giả nếu là chủ truyện
    let stats = null;
    if (canManage) {
      items = rawItems.map((item: any) => {
        const pendingRevision = this.mapChapterRevision(
          getActiveRevision(item.revisions),
          item,
        );
        delete item.revisions;
        return {
          ...item,
          pendingRevision,
        };
      });

      const allStoryChapters = await this.chapterModel
        .find({ storyId: story._id })
        .select('status viewCount wordCount isFree coinPrice')
        .lean();

      // Chương PUBLISHED/HIDDEN có bản chỉnh sửa chờ duyệt (không trùng với status PENDING_REVIEW)
      const pendingRevisionCount = await this.chapterModel.countDocuments({
        storyId: story._id,
        status: { $ne: ChapterStatus.PENDING_REVIEW },
        'revisions.status': RevisionStatus.PENDING_REVIEW,
      });

      stats = {
        totalChapters: allStoryChapters.length,
        published: allStoryChapters.filter((c) => c.status === ChapterStatus.PUBLISHED).length,
        pending:
          allStoryChapters.filter((c) => c.status === ChapterStatus.PENDING_REVIEW).length +
          pendingRevisionCount,
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

    // Nếu là tác giả hoặc quản trị viên, đính kèm bản chỉnh sửa đang mở (nếu có)
    if (isOwner || isAdminOrManager) {
      const withRevisions: any = await this.chapterModel
        .findById(chapter._id)
        .select('+revisions')
        .lean();

      chapterObj.pendingRevision = this.mapChapterRevision(
        getActiveRevision(withRevisions?.revisions),
        chapter,
      );
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

    const chapter = await this.chapterModel
      .findById(chapterId)
      .select('+revisions');
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    await this.verifyStoryOwnership(userId, chapter.storyId, userRole);

    // Chương chưa từng có bản chính thức: chỉnh sửa trực tiếp như bản nháp
    if (!this.chapterHasOfficialVersion(chapter)) {
      return this.updateDraftChapter(chapter, dto);
    }

    return this.updateOfficialChapter(chapter, dto);
  }

  /**
   * Chỉnh sửa trực tiếp chương chưa từng xuất bản (DRAFT/REJECTED/PENDING lần đầu).
   */
  private async updateDraftChapter(
    chapter: ChapterDocument,
    dto: UpdateChapterDto,
  ): Promise<any> {
    if (dto.action === ChapterAction.DISCARD_UPDATE) {
      return chapter;
    }

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
    } else if (
      dto.action === ChapterAction.WITHDRAW &&
      chapter.status === ChapterStatus.PENDING_REVIEW
    ) {
      chapter.status = ChapterStatus.DRAFT;
      chapter.rejectReason = null;
    }

    const updated = await chapter.save();
    await this.updateStoryStats(chapter.storyId);

    return updated;
  }

  /**
   * Chỉnh sửa chương đã có bản chính thức: giữ nguyên bản chính cho độc giả,
   * mọi thay đổi nội dung được lưu vào bản chỉnh sửa (revision) chờ duyệt.
   */
  private async updateOfficialChapter(
    chapter: ChapterDocument,
    dto: UpdateChapterDto,
  ): Promise<any> {
    const revisions = (chapter.revisions || []) as any[];
    const activeRevision = getActiveRevision(revisions);

    // Hủy bản đang chỉnh sửa
    if (dto.action === ChapterAction.DISCARD_UPDATE) {
      if (activeRevision) {
        const index = revisions.findIndex(
          (r) => r._id?.toString() === activeRevision._id?.toString(),
        );
        if (index >= 0) revisions.splice(index, 1);
      }
      trimRevisions(revisions);
      await chapter.save();
      return this.buildChapterResponse(chapter._id);
    }

    // Không cho đổi số thứ tự / lịch phát hành sau khi đã xuất bản
    if (
      dto.chapterNumber !== undefined &&
      dto.chapterNumber !== chapter.chapterNumber
    ) {
      throw new BadRequestException(
        'Không thể thay đổi số thứ tự của chương đã xuất bản',
      );
    }
    if (dto.scheduledAt !== undefined) {
      const nextTime = dto.scheduledAt
        ? new Date(dto.scheduledAt).getTime()
        : null;
      const currentTime = chapter.scheduledAt
        ? new Date(chapter.scheduledAt).getTime()
        : null;
      if (nextTime !== currentTime) {
        throw new BadRequestException(
          'Không thể thay đổi lịch phát hành của chương đã xuất bản',
        );
      }
    }

    const base = activeRevision
      ? this.cloneRevisionSnapshot(activeRevision.snapshot)
      : this.buildChapterSnapshotFromDoc(chapter);
    const merged = this.mergeChapterSnapshot(base, dto);

    if (
      dto.content !== undefined &&
      this.countChapterWords(merged.content) > 2500
    ) {
      throw new BadRequestException('Nội dung chương không được vượt quá 2.500 từ');
    }

    const contentChanged = this.chapterSnapshotChanged(base, merged);
    const now = new Date();

    // Rút bản đang chờ duyệt (có thể kèm chỉnh sửa)
    if (dto.action === ChapterAction.WITHDRAW) {
      if (
        activeRevision &&
        activeRevision.status === RevisionStatus.PENDING_REVIEW
      ) {
        activeRevision.status = RevisionStatus.DRAFT;
        activeRevision.updatedAt = now;
      }
      if (contentChanged) {
        if (activeRevision) {
          activeRevision.snapshot = merged as any;
          activeRevision.status = RevisionStatus.DRAFT;
          activeRevision.rejectReason = null;
          activeRevision.updatedAt = now;
        } else {
          revisions.push({
            snapshot: merged,
            status: RevisionStatus.DRAFT,
            createdAt: now,
            updatedAt: now,
          } as any);
        }
      }
      trimRevisions(revisions);
      await chapter.save();
      return this.buildChapterResponse(chapter._id);
    }

    // Đang chờ duyệt: phải rút trước khi sửa
    if (
      activeRevision &&
      activeRevision.status === RevisionStatus.PENDING_REVIEW
    ) {
      if (contentChanged || dto.action === ChapterAction.SUBMIT) {
        throw new ConflictException(
          'Chương đang có bản chỉnh sửa chờ duyệt. Vui lòng rút bản đó (WITHDRAW) trước khi chỉnh sửa hoặc gửi duyệt lại.',
        );
      }
      await chapter.save();
      return this.buildChapterResponse(chapter._id);
    }

    if (contentChanged) {
      if (activeRevision) {
        activeRevision.snapshot = merged as any;
        activeRevision.status =
          dto.action === ChapterAction.SUBMIT
            ? RevisionStatus.PENDING_REVIEW
            : RevisionStatus.DRAFT;
        activeRevision.rejectReason = null;
        activeRevision.updatedAt = now;
      } else {
        revisions.push({
          snapshot: merged,
          status:
            dto.action === ChapterAction.SUBMIT
              ? RevisionStatus.PENDING_REVIEW
              : RevisionStatus.DRAFT,
          createdAt: now,
          updatedAt: now,
        } as any);
      }
    } else if (
      dto.action === ChapterAction.SUBMIT &&
      activeRevision &&
      (activeRevision.status === RevisionStatus.DRAFT ||
        activeRevision.status === RevisionStatus.REJECTED)
    ) {
      activeRevision.status = RevisionStatus.PENDING_REVIEW;
      activeRevision.rejectReason = null;
      activeRevision.updatedAt = now;
    }

    trimRevisions(revisions);
    await chapter.save();
    return this.buildChapterResponse(chapter._id);
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
    const chapters = await this.chapterModel
      .find({ _id: { $in: objectIds } })
      .select('+revisions');

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
    const now = new Date();

    for (const chapter of chapters) {
      let changed = false;

      // 1. Chương chưa xuất bản: gửi duyệt trực tiếp
      if (
        chapter.status === ChapterStatus.DRAFT ||
        chapter.status === ChapterStatus.REJECTED
      ) {
        chapter.status = ChapterStatus.PENDING_REVIEW;
        chapter.rejectReason = null;
        changed = true;
        submittedCount++;
      } else {
        // 2. Chương đã xuất bản: gửi duyệt bản chỉnh sửa đang nháp/bị từ chối
        const activeRevision = getActiveRevision(chapter.revisions);
        if (
          activeRevision &&
          (activeRevision.status === RevisionStatus.DRAFT ||
            activeRevision.status === RevisionStatus.REJECTED)
        ) {
          activeRevision.status = RevisionStatus.PENDING_REVIEW;
          activeRevision.rejectReason = null;
          activeRevision.updatedAt = now;
          changed = true;
          submittedCount++;
        }
      }

      if (changed) {
        await chapter.save();
      }
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

    // 3. Xóa chương (lịch sử chỉnh sửa nhúng đi kèm)
    await this.chapterModel.deleteOne({ _id: chapter._id });

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
    const pendingRevisionCount = await this.chapterModel.countDocuments({
      storyId: story._id,
      status: { $ne: ChapterStatus.PENDING_REVIEW },
      'revisions.status': RevisionStatus.PENDING_REVIEW,
    });
    const pending =
      chapters.filter((c) => c.status === ChapterStatus.PENDING_REVIEW).length +
      pendingRevisionCount;
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

  private buildRevisionHistoryItem(
    revision: any,
    chapter: any,
    story: any,
    activeRevisionId?: string | null,
  ): any {
    const snapshot = revision.snapshot || {};
    const storyDoc = story && story.title !== undefined ? story : null;

    return {
      _id: revision._id,
      isActive: Boolean(
        activeRevisionId &&
          revision._id?.toString() === activeRevisionId,
      ),
      chapterId: {
        _id: chapter._id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        status: chapter.status,
      },
      storyId: storyDoc
        ? {
            _id: storyDoc._id,
            title: storyDoc.title,
            slug: storyDoc.slug,
            coverUrl: storyDoc.coverUrl ?? null,
            authorId: storyDoc.authorId ?? null,
          }
        : chapter.storyId,
      authorId: storyDoc?.authorId ?? null,
      title: snapshot.title,
      content: snapshot.content,
      isFree: snapshot.isFree,
      coinPrice: snapshot.coinPrice,
      requirePreviousChapter: snapshot.requirePreviousChapter,
      wordCount: countWords(snapshot.content || ''),
      status: revision.status,
      rejectReason: revision.rejectReason ?? null,
      reviewerId: revision.reviewerId ?? null,
      reviewedAt: revision.reviewedAt ?? null,
      createdAt: revision.createdAt,
      updatedAt: revision.updatedAt,
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

    const chapter = await this.chapterModel
      .findById(chapterId)
      .select('+revisions');
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    await this.verifyStoryOwnership(userId, chapter.storyId, userRole);

    const story: any = await this.storyModel
      .findById(chapter.storyId)
      .select('title slug coverUrl authorId')
      .populate('authorId', 'displayName username avatarUrl')
      .lean();

    const activeRevisionId = getActiveRevision(
      (chapter.revisions || []) as any[],
    )?._id?.toString();

    return [...((chapter.revisions || []) as any[])]
      .reverse()
      .map((revision) =>
        this.buildRevisionHistoryItem(
          revision,
          chapter,
          story,
          activeRevisionId,
        ),
      );
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
    const isAdmin =
      userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;

    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 20));
    const skip = (page - 1) * limit;

    const emptyResult = {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };

    const chapterFilter: any = { 'revisions.0': { $exists: true } };

    let restrictedStoryIds: Types.ObjectId[] | null = null;
    if (!isAdmin) {
      const ownedStories = await this.storyModel
        .find({ authorId: new Types.ObjectId(userId.toString()) })
        .select('_id')
        .lean();
      restrictedStoryIds = ownedStories.map((s) => s._id as Types.ObjectId);
    }

    let resolvedStoryId: Types.ObjectId | null = null;
    if (query?.storyId) {
      if (Types.ObjectId.isValid(query.storyId)) {
        resolvedStoryId = new Types.ObjectId(query.storyId);
      } else {
        const foundStory = await this.storyModel
          .findOne({ slug: query.storyId.trim() })
          .select('_id')
          .lean();
        if (foundStory) {
          resolvedStoryId = foundStory._id as Types.ObjectId;
        }
      }
      if (!resolvedStoryId) return emptyResult;
    }

    if (restrictedStoryIds) {
      if (resolvedStoryId) {
        const owned = restrictedStoryIds.some(
          (id) => id.toString() === resolvedStoryId!.toString(),
        );
        if (!owned) return emptyResult;
        chapterFilter.storyId = resolvedStoryId;
      } else {
        chapterFilter.storyId = { $in: restrictedStoryIds };
      }
    } else if (resolvedStoryId) {
      chapterFilter.storyId = resolvedStoryId;
    }

    if (query?.chapterId) {
      if (Types.ObjectId.isValid(query.chapterId)) {
        chapterFilter._id = new Types.ObjectId(query.chapterId);
      } else if (!isNaN(Number(query.chapterId))) {
        const foundCh = await this.chapterModel
          .findOne({
            ...(chapterFilter.storyId
              ? { storyId: chapterFilter.storyId }
              : {}),
            chapterNumber: Number(query.chapterId),
          })
          .select('_id')
          .lean();
        if (!foundCh) return emptyResult;
        chapterFilter._id = foundCh._id;
      }
    }

    const chapters: any[] = await this.chapterModel
      .find(chapterFilter)
      .select('+revisions chapterNumber title status storyId')
      .populate({
        path: 'storyId',
        select: 'title slug coverUrl authorId',
        populate: {
          path: 'authorId',
          select: 'displayName username avatarUrl',
        },
      })
      .lean();

    const search = query?.search?.trim().toLowerCase();

    const records: any[] = [];
    for (const chapter of chapters) {
      const story = chapter.storyId;
      const activeRevisionId = getActiveRevision(
        (chapter.revisions || []) as any[],
      )?._id?.toString();
      for (const revision of (chapter.revisions || []) as any[]) {
        if (query?.status && revision.status !== query.status) continue;

        const snapshot = revision.snapshot || {};
        if (
          search &&
          !String(snapshot.title || '').toLowerCase().includes(search)
        ) {
          continue;
        }

        records.push(
          this.buildRevisionHistoryItem(
            revision,
            chapter,
            story,
            activeRevisionId,
          ),
        );
      }
    }

    records.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = records.length;

    return {
      items: records.slice(skip, skip + limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Khôi phục một bản chỉnh sửa cũ thành bản nháp mới (phải qua duyệt lại).
   */
  async restoreChapterRevision(
    userId: string | Types.ObjectId,
    chapterId: string,
    revisionId: string,
    userRole?: string,
  ): Promise<any> {
    if (
      !Types.ObjectId.isValid(chapterId) ||
      !Types.ObjectId.isValid(revisionId)
    ) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel
      .findById(chapterId)
      .select('+revisions');
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    await this.verifyStoryOwnership(userId, chapter.storyId, userRole);

    const revisions = (chapter.revisions || []) as any[];
    const target = revisions.find(
      (revision) => revision._id?.toString() === revisionId,
    );
    if (!target) {
      throw new NotFoundException(
        'Không tìm thấy bản chỉnh sửa cần khôi phục',
      );
    }

    if (getActiveRevision(revisions)) {
      throw new ConflictException(
        'Đang có bản chỉnh sửa khác. Vui lòng hủy hoặc rút bản đó trước khi khôi phục bản cũ.',
      );
    }

    const now = new Date();
    revisions.push({
      snapshot: this.cloneRevisionSnapshot(target.snapshot),
      status: RevisionStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    } as any);

    trimRevisions(revisions);
    await chapter.save();

    return this.buildChapterResponse(chapter._id);
  }
}
