import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { filter, interval, map, merge, Observable, Subject } from 'rxjs';
import { buildPaginationMeta, PaginatedResult } from '../../common/dto/pagination.dto.js';
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

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly notificationSubject = new Subject<NotificationStreamEvent>();

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

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

    // Phát sự kiện realtime
    this.notificationSubject.next({
      targetUserIds: [saved.userId.toString()],
      notification: saved,
    });

    return saved;
  }

  /**
   * Tạo nhiều thông báo cùng lúc (batch insert)
   */
  async createMany(dtos: CreateNotificationDto[]): Promise<void> {
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
    const inserted = await this.notificationModel.insertMany(docs);

    // Phát sự kiện realtime cho từng recipient
    for (const doc of inserted) {
      this.notificationSubject.next({
        targetUserIds: [doc.userId.toString()],
        notification: doc,
      });
    }
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
