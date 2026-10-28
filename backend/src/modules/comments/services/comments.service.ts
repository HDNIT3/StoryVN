import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, PaginatedResult } from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { Chapter, ChapterDocument } from '../../chapters/schemas/chapter.schema.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { NotificationType } from '../../notifications/schemas/notification.schema.js';
import { Story, StoryDocument, StoryStatus } from '../../stories/schemas/story.schema.js';
import { User, UserDocument, UserRole } from '../../users/schemas/user.schema.js';
import { AdminCommentStatusFilter, AdminQueryCommentsDto } from '../dto/admin-query-comments.dto.js';
import { CreateCommentDto } from '../dto/create-comment.dto.js';
import { CommentSortOrder, QueryCommentsDto } from '../dto/query-comments.dto.js';
import { QueryRepliesDto } from '../dto/query-replies.dto.js';
import { UpdateCommentDto } from '../dto/update-comment.dto.js';
import {
  Comment,
  CommentDocument,
  CommentStatus,
} from '../schemas/comment.schema.js';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(Story.name)
    private readonly storyModel: Model<StoryDocument>,
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    private readonly notificationsService: NotificationsService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Tạo bình luận mới (hỗ trợ bình luận truyện, bình luận chương, hoặc reply)
   * Mặc định bình luận hiện ra luôn (status: VISIBLE)
   */
  async createComment(
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDocument> {
    if (!Types.ObjectId.isValid(dto.storyId)) {
      throw new BadRequestException('ID tác phẩm không hợp lệ');
    }

    const story = await this.storyModel.findById(dto.storyId).lean();
    if (!story) {
      throw new NotFoundException('Không tìm thấy tác phẩm');
    }

    if (story.status !== StoryStatus.PUBLISHED) {
      throw new BadRequestException(ErrorCode.STORY_NOT_PUBLISHED);
    }

    let chapterObjectId: Types.ObjectId | null = null;
    if (dto.chapterId) {
      if (!Types.ObjectId.isValid(dto.chapterId)) {
        throw new BadRequestException('ID chương không hợp lệ');
      }
      const chapter = await this.chapterModel.findById(dto.chapterId).lean();
      if (!chapter || chapter.storyId.toString() !== dto.storyId) {
        throw new NotFoundException('Không tìm thấy chương trong tác phẩm này');
      }
      chapterObjectId = new Types.ObjectId(dto.chapterId);
    }

    let parentComment: CommentDocument | null = null;
    let effectiveParentId: Types.ObjectId | null = null;
    let effectiveReplyToUserId: Types.ObjectId | null = null;

    if (dto.replyToUserId) {
      if (!Types.ObjectId.isValid(dto.replyToUserId)) {
        throw new BadRequestException('ID người dùng được trả lời không hợp lệ');
      }
      effectiveReplyToUserId = new Types.ObjectId(dto.replyToUserId);
    }

    if (dto.parentId) {
      if (!Types.ObjectId.isValid(dto.parentId)) {
        throw new BadRequestException('ID bình luận cha không hợp lệ');
      }
      parentComment = await this.commentModel.findById(dto.parentId);
      if (!parentComment || parentComment.status === CommentStatus.DELETED) {
        throw new NotFoundException(ErrorCode.PARENT_COMMENT_NOT_FOUND);
      }
      if (parentComment.storyId.toString() !== dto.storyId) {
        throw new BadRequestException(ErrorCode.INVALID_COMMENT_PARENT);
      }

      // Chuẩn hóa cấu trúc 2 cấp: Nếu reply vào 1 comment con, gán parentId về comment gốc
      effectiveParentId = parentComment.parentId
        ? parentComment.parentId
        : parentComment._id;

      // Nếu reply vào comment con (tầng 2) và chưa có explicit replyToUserId:
      if (!effectiveReplyToUserId && parentComment.parentId) {
        effectiveReplyToUserId = parentComment.userId;
      }
    }

    const newComment = await this.commentModel.create({
      userId: new Types.ObjectId(userId),
      storyId: new Types.ObjectId(dto.storyId),
      chapterId: chapterObjectId,
      parentId: effectiveParentId,
      replyToUserId: effectiveReplyToUserId,
      content: dto.content.trim(),
      status: CommentStatus.VISIBLE,
      replyCount: 0,
    });

    // Tăng số lượng bình luận của Story
    await this.storyModel.findByIdAndUpdate(dto.storyId, {
      $inc: { 'stats.commentCount': 1 },
    });

    // Nếu là reply -> tăng replyCount của comment cha
    if (effectiveParentId) {
      await this.commentModel.findByIdAndUpdate(effectiveParentId, {
        $inc: { replyCount: 1 },
      });
    }

    // Gửi thông báo bất đồng bộ
    this.sendCommentNotification(
      userId,
      story,
      newComment,
      parentComment,
      dto.chapterId,
    ).catch((err) => {
      this.logger.error(`Lỗi gửi thông báo bình luận: ${err.message}`, err.stack);
    });

    const createdDoc: any = await this.commentModel
      .findById(newComment._id)
      .populate('userId', 'displayName username avatarUrl role')
      .populate('replyToUserId', 'displayName username avatarUrl role')
      .populate('chapterId', 'chapterNumber title')
      .lean();

    return {
      ...createdDoc,
      isStoryAuthor: story.authorId.toString() === userId,
    };
  }

  /**
   * Lấy danh sách bình luận gốc của truyện hoặc chương
   * Quản lý/Admin/Tác giả truyện có thể thấy cả bình luận bị HIDDEN để bật lại
   */
  async getStoryComments(
    storyId: string,
    query: QueryCommentsDto,
    currentUser?: { _id: any; role?: UserRole },
  ): Promise<PaginatedResult<any>> {
    if (!Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException('ID tác phẩm không hợp lệ');
    }

    const story = await this.storyModel.findById(storyId).lean();
    if (!story) {
      throw new NotFoundException('Không tìm thấy tác phẩm');
    }

    const currentUserIdStr = currentUser?._id ? currentUser._id.toString() : null;
    const canModerate =
      currentUser &&
      (currentUser.role === UserRole.ADMIN ||
        currentUser.role === UserRole.MANAGER ||
        story.authorId.toString() === currentUserIdStr);

    const filter: any = {
      storyId: new Types.ObjectId(storyId),
      parentId: null, // Chỉ lấy bình luận gốc cấp 1
    };

    if (canModerate) {
      // Người có quyền kiểm duyệt xem được cả VISIBLE và HIDDEN (và DELETED có replies)
      filter.status = { $in: [CommentStatus.VISIBLE, CommentStatus.HIDDEN, CommentStatus.DELETED] };
    } else {
      // Độc giả thông thường: lấy VISIBLE hoặc DELETED mà có phản hồi con (để giữ cây)
      filter.$or = [
        { status: CommentStatus.VISIBLE },
        { status: CommentStatus.DELETED, replyCount: { $gt: 0 } },
      ];
    }

    if (query.chapterId) {
      if (!Types.ObjectId.isValid(query.chapterId)) {
        throw new BadRequestException('ID chương không hợp lệ');
      }
      filter.chapterId = new Types.ObjectId(query.chapterId);
    } else if (query.onlyStoryLevel) {
      filter.chapterId = null;
    }

    const sort =
      query.sort === CommentSortOrder.OLDEST
        ? { createdAt: 1 }
        : { createdAt: -1 };

    const [items, totalItems] = await Promise.all([
      this.commentModel
        .find(filter)
        .sort(sort as any)
        .skip(query.skip)
        .limit(query.limit)
        .populate('userId', 'displayName username avatarUrl role')
        .populate('replyToUserId', 'displayName username avatarUrl role')
        .populate('chapterId', 'chapterNumber title')
        .lean(),
      this.commentModel.countDocuments(filter),
    ]);

    // Format nội dung cho bình luận đã xóa và gắn cờ tác giả chính của truyện
    const storyAuthorIdStr = story.authorId?.toString();
    const formattedItems = items.map((item) => {
      const commenterId = (item.userId as any)?._id
        ? (item.userId as any)._id.toString()
        : item.userId?.toString();
      const isStoryAuthor = Boolean(
        storyAuthorIdStr && commenterId === storyAuthorIdStr,
      );
      return {
        ...item,
        isStoryAuthor,
        content:
          item.status === CommentStatus.DELETED
            ? 'Bình luận này đã bị xóa'
            : item.content,
      };
    });

    return {
      items: formattedItems,
      pagination: buildPaginationMeta(totalItems, query.page, query.limit),
    };
  }

  /**
   * Lấy danh sách câu trả lời (replies) của một bình luận cha
   */
  async getCommentReplies(
    parentId: string,
    query: QueryRepliesDto,
    currentUser?: { _id: any; role?: UserRole },
  ): Promise<PaginatedResult<any>> {
    if (!Types.ObjectId.isValid(parentId)) {
      throw new BadRequestException('ID bình luận không hợp lệ');
    }

    const parentComment = await this.commentModel.findById(parentId).lean();
    if (!parentComment) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND);
    }

    const story = await this.storyModel.findById(parentComment.storyId).lean();
    const currentUserIdStr = currentUser?._id ? currentUser._id.toString() : null;
    const canModerate =
      currentUser &&
      story &&
      (currentUser.role === UserRole.ADMIN ||
        currentUser.role === UserRole.MANAGER ||
        story.authorId.toString() === currentUserIdStr);

    const filter: any = {
      parentId: new Types.ObjectId(parentId),
    };

    if (canModerate) {
      filter.status = { $in: [CommentStatus.VISIBLE, CommentStatus.HIDDEN] };
    } else {
      filter.status = CommentStatus.VISIBLE;
    }

    const [items, totalItems] = await Promise.all([
      this.commentModel
        .find(filter)
        .sort({ createdAt: 1 })
        .skip(query.skip)
        .limit(query.limit)
        .populate('userId', 'displayName username avatarUrl role')
        .populate('replyToUserId', 'displayName username avatarUrl role')
        .lean(),
      this.commentModel.countDocuments(filter),
    ]);

    const storyAuthorIdStr = story?.authorId?.toString();
    const formattedItems = items.map((item) => {
      const commenterId = (item.userId as any)?._id
        ? (item.userId as any)._id.toString()
        : item.userId?.toString();
      const isStoryAuthor = Boolean(
        storyAuthorIdStr && commenterId === storyAuthorIdStr,
      );
      return {
        ...item,
        isStoryAuthor,
      };
    });

    return {
      items: formattedItems,
      pagination: buildPaginationMeta(totalItems, query.page, query.limit),
    };
  }

  /**
   * Chỉnh sửa nội dung bình luận (chỉ chính chủ mới được sửa)
   */
  async updateComment(
    userId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentDocument> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('ID bình luận không hợp lệ');
    }

    const comment = await this.commentModel.findById(commentId);
    if (!comment || comment.status === CommentStatus.DELETED) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND);
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException(ErrorCode.COMMENT_FORBIDDEN);
    }

    comment.content = dto.content.trim();
    await comment.save();

    return (await this.commentModel
      .findById(comment._id)
      .populate('userId', 'displayName username avatarUrl role')
      .lean()) as any;
  }

  /**
   * Xóa bình luận (Chính chủ hoặc Quản trị viên/Quản lý)
   * Nếu có replies con -> soft delete để bảo toàn cây thảo luận
   */
  async deleteComment(
    userId: string,
    userRole: UserRole,
    commentId: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('ID bình luận không hợp lệ');
    }

    const comment = await this.commentModel.findById(commentId);
    if (!comment || comment.status === CommentStatus.DELETED) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND);
    }

    const isOwner = comment.userId.toString() === userId;
    const isAdminOrManager =
      userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;

    if (!isOwner && !isAdminOrManager) {
      throw new ForbiddenException(ErrorCode.COMMENT_FORBIDDEN);
    }

    // Nếu bình luận gốc có replies con -> soft delete
    if (comment.replyCount > 0) {
      comment.status = CommentStatus.DELETED;
      await comment.save();
    } else {
      // Nếu không có replies con -> xóa bản ghi
      await this.commentModel.findByIdAndDelete(commentId);
    }

    // Nếu đây là câu trả lời con -> giảm replyCount của comment cha
    if (comment.parentId) {
      await this.commentModel.findByIdAndUpdate(comment.parentId, {
        $inc: { replyCount: -1 },
      });
    }

    // Giảm commentCount của Story
    await this.storyModel.findByIdAndUpdate(comment.storyId, {
      $inc: { 'stats.commentCount': -1 },
    });

    return true;
  }

  /**
   * Admin, Quản lý hoặc Tác giả của truyện ẩn hoặc cho hiện lại bình luận
   */
  async toggleCommentVisibility(
    userId: string,
    userRole: UserRole,
    commentId: string,
    newStatus: CommentStatus,
  ): Promise<CommentDocument> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('ID bình luận không hợp lệ');
    }

    if (newStatus !== CommentStatus.VISIBLE && newStatus !== CommentStatus.HIDDEN) {
      throw new BadRequestException('Trạng thái chỉ có thể là VISIBLE hoặc HIDDEN');
    }

    const comment = await this.commentModel.findById(commentId);
    if (!comment || comment.status === CommentStatus.DELETED) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND);
    }

    const story = await this.storyModel.findById(comment.storyId).lean();
    if (!story) {
      throw new NotFoundException('Không tìm thấy tác phẩm chứa bình luận');
    }

    const isStoryAuthor = story.authorId.toString() === userId;
    const isAdminOrManager =
      userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;

    // Chỉ Admin, Quản lý, hoặc chính Tác giả của truyện mới có quyền ẩn/hiện
    if (!isStoryAuthor && !isAdminOrManager) {
      throw new ForbiddenException(
        'Chỉ Tác giả của truyện hoặc Quản trị viên mới có quyền ẩn hoặc hiện lại bình luận này',
      );
    }

    comment.status = newStatus;
    await comment.save();

    return (await this.commentModel
      .findById(comment._id)
      .populate('userId', 'displayName username avatarUrl role')
      .populate('replyToUserId', 'displayName username avatarUrl role')
      .populate('chapterId', 'chapterNumber title')
      .lean()) as any;
  }

  /**
   * Helper gửi thông báo khi có bình luận hoặc phản hồi mới
   */
  private async sendCommentNotification(
    actorId: string,
    story: any,
    comment: CommentDocument,
    parentComment: CommentDocument | null,
    chapterId?: string | null,
  ): Promise<void> {
    if (parentComment || comment.replyToUserId) {
      // Thông báo cho người được trả lời (nếu không tự trả lời chính mình)
      const targetUserId = comment.replyToUserId
        ? comment.replyToUserId.toString()
        : parentComment?.userId.toString();
      if (targetUserId && targetUserId !== actorId) {
        await this.notificationsService.create({
          userId: targetUserId,
          type: NotificationType.REPLY,
          title: 'Phản hồi bình luận mới',
          message: `Có người vừa trả lời bình luận của bạn trong truyện "${story.title}".`,
          storyId: story._id.toString(),
          chapterId: chapterId || undefined,
          actorId,
          referenceId: comment._id.toString(),
        });
      }
    } else {
      // Thông báo cho Tác giả truyện (nếu không tự bình luận truyện mình)
      const authorId = story.authorId.toString();
      if (authorId !== actorId) {
        await this.notificationsService.create({
          userId: authorId,
          type: NotificationType.COMMENT,
          title: 'Bình luận mới',
          message: `Tác phẩm "${story.title}" vừa nhận được một bình luận mới.`,
          storyId: story._id.toString(),
          chapterId: chapterId || undefined,
          actorId,
          referenceId: comment._id.toString(),
        });
      }
    }
  }

  /**
   * Lấy chi tiết một bình luận theo ID (phục vụ điều hướng thông báo và xem chi tiết)
   */
  async getCommentById(commentId: string): Promise<any> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('ID bình luận không hợp lệ');
    }

    const comment = await this.commentModel
      .findById(commentId)
      .populate('userId', 'displayName username avatarUrl role email')
      .populate('replyToUserId', 'displayName username avatarUrl role')
      .populate('storyId', 'title slug coverUrl authorId')
      .populate('chapterId', 'chapterNumber title')
      .lean();

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    return comment;
  }

  /**
   * [Admin/Manager] Lấy danh sách tất cả bình luận với bộ lọc và phân trang
   */
  async adminGetComments(query: AdminQueryCommentsDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, status, search, storyId, sort } = query;
    const filter: Record<string, any> = {};

    if (status && status !== AdminCommentStatusFilter.ALL) {
      filter.status = status;
    }

    if (storyId) {
      if (!Types.ObjectId.isValid(storyId)) {
        throw new BadRequestException('ID truyện không hợp lệ');
      }
      filter.storyId = new Types.ObjectId(storyId);
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const matchingUsers = await this.userModel
        .find({ $or: [{ displayName: regex }, { username: regex }, { email: regex }] })
        .select('_id')
        .lean();
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { content: regex },
        { userId: { $in: userIds } },
      ];
    }

    const sortOption: any = sort === CommentSortOrder.OLDEST ? { createdAt: 1 } : { createdAt: -1 };
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      this.commentModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'displayName username avatarUrl role email')
        .populate('replyToUserId', 'displayName username avatarUrl role')
        .populate('storyId', 'title slug coverUrl')
        .populate('chapterId', 'chapterNumber title')
        .lean(),
      this.commentModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: buildPaginationMeta(totalItems, page, limit),
    };
  }

  /**
   * [Admin/Manager] Lấy thống kê số lượng bình luận theo trạng thái
   */
  async adminGetCommentCounts(): Promise<{
    total: number;
    visible: number;
    hidden: number;
    deleted: number;
  }> {
    const [total, visible, hidden, deleted] = await Promise.all([
      this.commentModel.countDocuments(),
      this.commentModel.countDocuments({ status: CommentStatus.VISIBLE }),
      this.commentModel.countDocuments({ status: CommentStatus.HIDDEN }),
      this.commentModel.countDocuments({ status: CommentStatus.DELETED }),
    ]);

    return { total, visible, hidden, deleted };
  }

  /**
   * [Admin/Manager] Cập nhật trạng thái bình luận (VISIBLE, HIDDEN, DELETED)
   */
  async adminUpdateCommentStatus(
    commentId: string,
    status: CommentStatus,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('ID bình luận không hợp lệ');
    }

    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    const oldStatus = comment.status;
    comment.status = status;
    await comment.save();

    // Điều chỉnh stats.commentCount của Story nếu chuyển trạng thái liên quan đến DELETED
    if (oldStatus !== CommentStatus.DELETED && status === CommentStatus.DELETED) {
      await this.storyModel.findByIdAndUpdate(comment.storyId, {
        $inc: { 'stats.commentCount': -1 },
      });
    } else if (oldStatus === CommentStatus.DELETED && status !== CommentStatus.DELETED) {
      await this.storyModel.findByIdAndUpdate(comment.storyId, {
        $inc: { 'stats.commentCount': 1 },
      });
    }

    return this.commentModel
      .findById(comment._id)
      .populate('userId', 'displayName username avatarUrl role email')
      .populate('replyToUserId', 'displayName username avatarUrl role')
      .populate('storyId', 'title slug coverUrl')
      .populate('chapterId', 'chapterNumber title')
      .lean();
  }

  /**
   * [Admin/Manager] Xóa vĩnh viễn bình luận khỏi database
   */
  async adminDeleteCommentPermanent(commentId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('ID bình luận không hợp lệ');
    }

    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    if (comment.parentId) {
      await this.commentModel.findByIdAndUpdate(comment.parentId, {
        $inc: { replyCount: -1 },
      });
    }

    if (comment.status !== CommentStatus.DELETED) {
      await this.storyModel.findByIdAndUpdate(comment.storyId, {
        $inc: { 'stats.commentCount': -1 },
      });
    }

    await this.commentModel.deleteMany({ parentId: comment._id });
    await this.commentModel.findByIdAndDelete(commentId);

    return true;
  }
}

