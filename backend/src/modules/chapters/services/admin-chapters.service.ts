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
import { RevisionStatus } from '../../../common/enums/revision-status.enum.js';
import { countWords } from '../../../common/utils/text.util.js';
import {
  getActiveRevision,
  getLatestRevisionWithStatus,
  hasRevisionWithStatus,
  toRevisionView,
  trimRevisions,
} from '../../../common/utils/revision.util.js';
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

  private mapChapterRevision(revision: any, chapter: any): any {
    if (!revision) return null;
    const snapshot = revision.snapshot || {};
    return toRevisionView(revision, {
      chapterId: chapter._id,
      storyId: chapter.storyId?._id ?? chapter.storyId,
      wordCount: countWords(snapshot.content || ''),
    });
  }

  private cloneChapterSnapshot(snapshot: any): Record<string, any> {
    const plain = snapshot?.toObject ? snapshot.toObject() : { ...(snapshot || {}) };
    delete plain._id;
    return plain;
  }

  private applyChapterSnapshot(
    chapter: ChapterDocument,
    snapshot: Record<string, any>,
  ): void {
    chapter.title = snapshot.title;
    chapter.content = snapshot.content;
    chapter.isFree = snapshot.isFree;
    chapter.coinPrice = snapshot.coinPrice;
    chapter.requirePreviousChapter = snapshot.requirePreviousChapter;
    chapter.wordCount = countWords(snapshot.content || '');
  }

  /**
   * Lấy danh sách tất cả chương dành cho Admin/Manager
   * Hỗ trợ lọc theo storyId, status, tìm kiếm theo tiêu đề chương/tên truyện, phân trang, sắp xếp
   */
  async findAll(query: AdminQueryChaptersDto): Promise<PaginatedResult<any>> {
    const filter: Record<string, any> = {};
    const andConditions: any[] = [];

    if (query.storyId && Types.ObjectId.isValid(query.storyId)) {
      filter.storyId = new Types.ObjectId(query.storyId);
    }

    if (query.status === ChapterStatus.PENDING_REVIEW) {
      andConditions.push({
        $or: [
          { status: ChapterStatus.PENDING_REVIEW },
          { 'revisions.status': RevisionStatus.PENDING_REVIEW },
        ],
      });
    } else if (query.status === ChapterStatus.REJECTED) {
      andConditions.push({
        $or: [
          { status: ChapterStatus.REJECTED },
          { 'revisions.status': RevisionStatus.REJECTED },
        ],
      });
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

      andConditions.push({ $or: orConditions });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
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

    const [rawItems, totalItems] = await Promise.all([
      this.chapterModel
        .find(filter)
        // Danh sách không lấy toàn bộ text content dài để tối ưu băng thông
        .select('-content +revisions')
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

    const items = rawItems.map((item: any) => {
      const activeRevision = getActiveRevision(item.revisions);
      const pendingRevision = this.mapChapterRevision(activeRevision, item);
      delete item.revisions;
      return {
        ...item,
        pendingRevision,
        isPendingRevisionReview:
          activeRevision?.status === RevisionStatus.PENDING_REVIEW,
      };
    });

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
    const base: Record<string, any> = {};
    if (storyId && Types.ObjectId.isValid(storyId)) {
      base.storyId = new Types.ObjectId(storyId);
    }

    const withBase = (extra: Record<string, any>) =>
      Object.keys(base).length > 0 ? { $and: [base, extra] } : extra;

    const [all, pending, published, rejected, draft, hidden] =
      await Promise.all([
        this.chapterModel.countDocuments(base),
        this.chapterModel.countDocuments(
          withBase({
            $or: [
              { status: ChapterStatus.PENDING_REVIEW },
              { 'revisions.status': RevisionStatus.PENDING_REVIEW },
            ],
          }),
        ),
        this.chapterModel.countDocuments(
          withBase({ status: ChapterStatus.PUBLISHED }),
        ),
        this.chapterModel.countDocuments(
          withBase({
            $or: [
              { status: ChapterStatus.REJECTED },
              { 'revisions.status': RevisionStatus.REJECTED },
            ],
          }),
        ),
        this.chapterModel.countDocuments(
          withBase({ status: ChapterStatus.DRAFT }),
        ),
        this.chapterModel.countDocuments(
          withBase({ status: ChapterStatus.HIDDEN }),
        ),
      ]);

    return { all, pending, published, rejected, draft, hidden };
  }

  /**
   * Xem chi tiết chương truyện (kèm toàn bộ nội dung, thông tin truyện và tác giả)
   */
  async findById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter: any = await this.chapterModel
      .findById(id)
      .select('+revisions')
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

    const activeRevision = getActiveRevision(chapter.revisions);
    const pendingRevision = this.mapChapterRevision(activeRevision, chapter);
    delete chapter.revisions;

    return {
      ...chapter,
      pendingRevision,
      isPendingRevisionReview:
        activeRevision?.status === RevisionStatus.PENDING_REVIEW,
    };
  }

  /**
   * Phê duyệt chương truyện (chuyển sang PUBLISHED và gửi thông báo cho tác giả)
   */
  async approveChapter(id: string, reviewerId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const chapter = await this.chapterModel
      .findById(id)
      .select('+revisions');
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const story = await this.storyModel.findById(chapter.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const revisions = (chapter.revisions || []) as any[];

    // Trường hợp A: Chương đã có bản chính thức và đang có bản chỉnh sửa chờ duyệt
    const pendingRevision = getLatestRevisionWithStatus(revisions, [
      RevisionStatus.PENDING_REVIEW,
    ]);

    if (pendingRevision) {
      this.applyChapterSnapshot(
        chapter,
        this.cloneChapterSnapshot(pendingRevision.snapshot),
      );
      chapter.status = ChapterStatus.PUBLISHED;
      chapter.rejectReason = null;
      chapter.scheduledAt = chapter.scheduledAt || new Date();

      pendingRevision.status = RevisionStatus.APPROVED;
      pendingRevision.rejectReason = null;
      pendingRevision.reviewerId = new Types.ObjectId(reviewerId);
      pendingRevision.reviewedAt = new Date();
      pendingRevision.updatedAt = new Date();

      trimRevisions(revisions);
      await chapter.save();
      await this.updateStoryStats(story._id);

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

    // Tạo mốc bản chính thức nếu chương chưa từng có bản APPROVED
    if (!hasRevisionWithStatus(revisions, RevisionStatus.APPROVED)) {
      revisions.push({
        snapshot: {
          title: chapter.title,
          content: chapter.content,
          isFree: chapter.isFree,
          coinPrice: chapter.coinPrice,
          requirePreviousChapter: chapter.requirePreviousChapter,
        },
        status: RevisionStatus.APPROVED,
        createdAt: now,
        updatedAt: now,
      } as any);
      trimRevisions(revisions);
    }

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

    const chapter = await this.chapterModel
      .findById(id)
      .select('+revisions');
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const story = await this.storyModel.findById(chapter.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    // Trường hợp A: Từ chối bản chỉnh sửa của chương đã có bản chính thức
    const revisions = (chapter.revisions || []) as any[];
    const pendingRevision = getLatestRevisionWithStatus(revisions, [
      RevisionStatus.PENDING_REVIEW,
    ]);

    if (pendingRevision) {
      pendingRevision.status = RevisionStatus.REJECTED;
      pendingRevision.rejectReason = dto.reason.trim();
      pendingRevision.reviewerId = new Types.ObjectId(reviewerId);
      pendingRevision.reviewedAt = new Date();
      pendingRevision.updatedAt = new Date();
      await chapter.save();

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
        message:
          'Từ chối bản chỉnh sửa chương thành công (bản phát hành vẫn hoạt động)',
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

    const chapter = await this.chapterModel
      .findById(id)
      .select('+revisions');
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

    // Đóng bản chỉnh sửa đang chờ duyệt để tránh trạng thái treo
    for (const revision of (chapter.revisions || []) as any[]) {
      if (revision.status === RevisionStatus.PENDING_REVIEW) {
        revision.status = RevisionStatus.DRAFT;
        revision.updatedAt = new Date();
      }
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

    const chapter = await this.chapterModel
      .findById(id)
      .select('+revisions');
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

    // Đóng bản chỉnh sửa đang chờ duyệt khi chương bị ẩn
    for (const revision of (chapter.revisions || []) as any[]) {
      if (revision.status === RevisionStatus.PENDING_REVIEW) {
        revision.status = RevisionStatus.DRAFT;
        revision.updatedAt = new Date();
      }
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

    const chapter = await this.chapterModel
      .findById(id)
      .select('+revisions');
    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const story = await this.storyModel.findById(chapter.storyId);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const revisions = (chapter.revisions || []) as any[];
    // Chương đã có bản chính thức: chỉ đưa bản chỉnh sửa bị từ chối về chờ duyệt
    if (hasRevisionWithStatus(revisions, RevisionStatus.APPROVED)) {
      const rejectedRevision = getLatestRevisionWithStatus(revisions, [
        RevisionStatus.REJECTED,
      ]);
      if (rejectedRevision) {
        rejectedRevision.status = RevisionStatus.PENDING_REVIEW;
        rejectedRevision.rejectReason = null;
        rejectedRevision.updatedAt = new Date();
      }
    } else {
      chapter.status = ChapterStatus.PENDING_REVIEW;
      chapter.rejectReason = null;
    }

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
