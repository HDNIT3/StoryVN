import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { filter, interval, map, merge, Observable, Subject } from 'rxjs';
import { buildPaginationMeta, PaginatedResult } from '../../common/dto/pagination.dto.js';
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from '../users/schemas/user.schema.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { QueryNotificationsDto } from './dto/query-notifications.dto.js';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema.js';

export interface NotificationStreamEvent {
  targetUserIds: string[];
  notification: any;
}

export interface NotificationPopulatedRefs {
  story?: {
    _id: any;
    title: string;
    slug: string;
    coverUrl?: string | null;
  };
  chapter?: {
    _id: any;
    chapterNumber: number;
    title: string;
  };
  actor?: {
    _id: any;
    displayName?: string;
    username?: string;
    avatarUrl?: string | null;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly notificationSubject = new Subject<NotificationStreamEvent>();

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  /**
   * Tạo stream SSE cho 1 user
   */
  getNotificationStream(userId: string): Observable<{ data: any }> {
    const userStream = this.notificationSubject.asObservable().pipe(
      filter((event) => event.targetUserIds.includes(userId)),
      map((event) => ({
        data: {
          type: 'NOTIFICATION',
          payload: event.notification,
        },
      })),
    );

    const heartbeat = interval(25000).pipe(
      map(() => ({
        data: {
          type: 'HEARTBEAT',
        },
      })),
    );

    return merge(userStream, heartbeat);
  }

  /**
   * Tạo một thông báo mới (dùng nội bộ bởi các service khác)
   */
  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(dto.userId),
      type: dto.type,
      title: dto.title,
      message: dto.message,
      storyId: dto.storyId ? new Types.ObjectId(dto.storyId) : null,
      chapterId: dto.chapterId ? new Types.ObjectId(dto.chapterId) : null,
      actorId: dto.actorId ? new Types.ObjectId(dto.actorId) : null,
      referenceId: dto.referenceId ?? null,
      isRead: false,
    });
    const saved = await notification.save();
    let notificationForEvent: any = saved;
    try {
      const populated = await this.notificationModel
        .findById(saved._id)
        .populate('storyId', 'title slug coverUrl')
        .populate('chapterId', 'chapterNumber title')
        .populate('actorId', 'displayName username avatarUrl')
        .exec();
      if (populated) notificationForEvent = populated;
    } catch {
      // fallback to saved
    }

    // Phát sự kiện realtime
    this.notificationSubject.next({
      targetUserIds: [saved.userId.toString()],
      notification: notificationForEvent,
    });

    return saved;
  }

  /**
   * Tạo nhiều thông báo cùng lúc (batch insert)
   */
  async createMany(
    dtos: CreateNotificationDto[],
    populatedRefs?: NotificationPopulatedRefs,
  ): Promise<void> {
    if (!dtos || dtos.length === 0) return;

    const docs = dtos.map((dto) => ({
      userId: new Types.ObjectId(dto.userId),
      type: dto.type,
      title: dto.title,
      message: dto.message,
      storyId: dto.storyId ? new Types.ObjectId(dto.storyId) : null,
      chapterId: dto.chapterId ? new Types.ObjectId(dto.chapterId) : null,
      actorId: dto.actorId ? new Types.ObjectId(dto.actorId) : null,
      referenceId: dto.referenceId ?? null,
      isRead: false,
    }));

    const BATCH_SIZE = 500;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      const inserted = await this.notificationModel.insertMany(batch);

      // Phát sự kiện realtime cho từng recipient
      for (const doc of inserted as any[]) {
        let notificationForEvent: any =
          typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };

        if (populatedRefs) {
          if (
            populatedRefs.story &&
            doc.storyId &&
            String(doc.storyId) === String(populatedRefs.story._id)
          ) {
            notificationForEvent = {
              ...notificationForEvent,
              storyId: populatedRefs.story,
            };
          }
          if (
            populatedRefs.chapter &&
            doc.chapterId &&
            String(doc.chapterId) === String(populatedRefs.chapter._id)
          ) {
            notificationForEvent = {
              ...notificationForEvent,
              chapterId: populatedRefs.chapter,
            };
          }
          if (
            populatedRefs.actor &&
            doc.actorId &&
            String(doc.actorId) === String(populatedRefs.actor._id)
          ) {
            notificationForEvent = {
              ...notificationForEvent,
              actorId: populatedRefs.actor,
            };
          }
        }

        this.notificationSubject.next({
          targetUserIds: [doc.userId.toString()],
          notification: notificationForEvent,
        });
      }
    }
  }

  /**
   * Tạo thông báo NEW_CHAPTER gửi tới tất cả độc giả đang theo dõi truyện khi chương mới phát hành
   */
  async notifyFollowersNewChapter(params: {
    followerIds: (string | Types.ObjectId)[];
    story: {
      _id: Types.ObjectId | string;
      title: string;
      slug: string;
      coverUrl?: string | null;
      authorId?: Types.ObjectId | string | null;
    };
    chapter: {
      _id: Types.ObjectId | string;
      chapterNumber: number;
      title: string;
    };
  }): Promise<number> {
    const authorIdStr = params.story.authorId
      ? String(params.story.authorId)
      : null;

    const uniqueFollowerIds = Array.from(
      new Set(
        (params.followerIds || [])
          .map((id) => String(id))
          .filter((id) => Types.ObjectId.isValid(id) && id !== authorIdStr),
      ),
    );

    if (uniqueFollowerIds.length === 0) return 0;

    const title = `Chương mới: ${params.story.title}`;
    const message = `Chương ${params.chapter.chapterNumber}: "${params.chapter.title}" vừa được phát hành. Bấm để đọc ngay!`;

    const dtos: CreateNotificationDto[] = uniqueFollowerIds.map((userId) => ({
      userId,
      type: NotificationType.NEW_CHAPTER,
      title,
      message,
      storyId: String(params.story._id),
      chapterId: String(params.chapter._id),
      actorId: authorIdStr ?? undefined,
      referenceId: String(params.chapter._id),
    }));

    try {
      await this.createMany(dtos, {
        story: {
          _id: params.story._id,
          title: params.story.title,
          slug: params.story.slug,
          coverUrl: params.story.coverUrl ?? null,
        },
        chapter: {
          _id: params.chapter._id,
          chapterNumber: params.chapter.chapterNumber,
          title: params.chapter.title,
        },
      });
      return uniqueFollowerIds.length;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Không thể gửi thông báo chương mới (story=${String(params.story._id)}, chapter=${String(params.chapter._id)}): ${msg}`,
      );
      return 0;
    }
  }

  /**
   * Đánh dấu đã đọc các thông báo NEW_CHAPTER (khi đọc chương hoặc đánh dấu đã xem trong Tủ truyện)
   */
  async markNewChapterNotificationsAsRead(
    userId: string,
    filter: {
      chapterId?: string | Types.ObjectId;
      storyId?: string | Types.ObjectId;
      storyIds?: (string | Types.ObjectId)[];
    } = {},
  ): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) return 0;

    const query: Record<string, any> = {
      userId: new Types.ObjectId(userId),
      type: NotificationType.NEW_CHAPTER,
      isRead: false,
    };

    if (filter.chapterId && Types.ObjectId.isValid(String(filter.chapterId))) {
      query.chapterId = new Types.ObjectId(String(filter.chapterId));
    } else if (filter.storyId && Types.ObjectId.isValid(String(filter.storyId))) {
      query.storyId = new Types.ObjectId(String(filter.storyId));
    } else if (filter.storyIds && filter.storyIds.length > 0) {
      const validStoryIds = filter.storyIds
        .map((id) => String(id))
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
      if (validStoryIds.length === 0) return 0;
      query.storyId = { $in: validStoryIds };
    }

    const result = await this.notificationModel.updateMany(query, {
      $set: { isRead: true, readAt: new Date() },
    });
    return result.modifiedCount ?? 0;
  }

  /**
   * Tạo thông báo MODERATION gửi tới Admin/Manager khi có người dùng gửi đơn đăng ký tác giả
   */
  async notifyNewAuthorRequestToAdmins(
    adminAndManagerIds: string[],
    applicantName: string,
    penName: string,
    applicantUserId: string,
    requestId: string,
  ): Promise<void> {
    if (!adminAndManagerIds || adminAndManagerIds.length === 0) return;

    const title = '📝 Đơn đăng ký tác giả mới!';
    const message = `Người dùng "${applicantName}" vừa gửi đơn đăng ký tác giả với bút danh "${penName}". Vui lòng kiểm tra và xét duyệt.`;

    try {
      const items: CreateNotificationDto[] = adminAndManagerIds.map((adminId) => ({
        userId: adminId,
        type: NotificationType.MODERATION,
        title,
        message,
        actorId: applicantUserId,
        referenceId: requestId,
      }));
      await this.createMany(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Không thể tạo thông báo đơn tác giả mới cho admin: ${msg}`,
      );
    }
  }

  /**
   * Tạo thông báo MODERATION: kết quả xét duyệt đơn tác giả
   */
  async notifyAuthorRequestResult(
    targetUserId: string,
    approved: boolean,
    penName: string,
    adminNote?: string | null,
  ): Promise<void> {
    const title = approved
      ? '🎉 Đơn đăng ký tác giả được duyệt!'
      : '❌ Đơn đăng ký tác giả bị từ chối';

    const message = approved
      ? `Chúc mừng! Đơn đăng ký tác giả với bút danh "${penName}" của bạn đã được duyệt. Bạn có thể bắt đầu đăng truyện ngay bây giờ.`
      : `Đơn đăng ký tác giả với bút danh "${penName}" của bạn đã bị từ chối.${adminNote ? ` Lý do: ${adminNote}` : ' Vui lòng kiểm tra lại thông tin và thử lại.'}`;

    try {
      await this.create({
        userId: targetUserId,
        type: NotificationType.MODERATION,
        title,
        message,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Không thể tạo thông báo MODERATION cho user ${targetUserId}: ${msg}`,
      );
    }
  }

  /**
   * Tạo thông báo MODERATION gửi tới toàn bộ Admin/Manager đang hoạt động
   * khi Tác giả gửi duyệt truyện hoặc chương.
   */
  async notifyModerationToModerators(
    title: string,
    message: string,
    meta: { storyId?: string; chapterId?: string; actorId?: string } = {},
  ): Promise<void> {
    try {
      const moderators = await this.userModel
        .find(
          {
            role: { $in: [UserRole.ADMIN, UserRole.MANAGER] },
            status: UserStatus.ACTIVE,
          },
          '_id',
        )
        .lean();

      if (moderators.length === 0) return;

      await this.createMany(
        moderators.map((moderator) => ({
          userId: moderator._id.toString(),
          type: NotificationType.MODERATION,
          title,
          message,
          storyId: meta.storyId,
          chapterId: meta.chapterId,
          actorId: meta.actorId,
        })),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Không thể tạo thông báo kiểm duyệt cho Admin/Manager: ${msg}`,
      );
    }
  }

  /**
   * Lấy danh sách thông báo của user với phân trang
   */
  async findAllForUser(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<PaginatedResult<NotificationDocument>> {
    const { type, isRead, page = 1, limit = 20 } = query;
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead;

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('storyId', 'title slug coverUrl')
        .populate('chapterId', 'chapterNumber title')
        .populate('actorId', 'displayName username avatarUrl')
        .exec(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: buildPaginationMeta(totalItems, page, limit),
    };
  }

  /**
   * Đếm số thông báo chưa đọc của user
   */
  async countUnread(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
    return { unreadCount };
  }

  /**
   * Đánh dấu một thông báo là đã đọc
   */
  async markOneAsRead(notificationId: string, userId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      },
      { isRead: true, readAt: new Date() },
      { returnDocument: 'after' },
    );

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    return notification;
  }

  /**
   * Đánh dấu tất cả thông báo chưa đọc của user là đã đọc
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Xóa một thông báo của user
   */
  async deleteOne(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
  }

  /**
   * Xóa tất cả thông báo đã đọc của user
   */
  async deleteAllRead(userId: string): Promise<{ deletedCount: number }> {
    const result = await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
      isRead: true,
    });
    return { deletedCount: result.deletedCount };
  }
}
