import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta } from '../../../common/dto/pagination.dto.js';
import { MailService } from '../../mail/mail.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { NotificationType } from '../../notifications/schemas/notification.schema.js';
import { User, UserDocument, UserRole, UserStatus } from '../../users/schemas/user.schema.js';
import {
  AdminQuerySupportTicketsDto,
  AdminReplySupportTicketDto,
  AdminUpdateSupportTicketDto,
  CreateSupportTicketDto,
  LookupSupportTicketDto,
  QueryMySupportTicketsDto,
  UserReplySupportTicketDto,
} from '../dto/support-ticket.dto.js';
import {
  SupportSenderRole,
  SupportTicket,
  SupportTicketDocument,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTopic,
} from '../schemas/support-ticket.schema.js';

const TOPIC_LABELS: Record<SupportTopic, string> = {
  [SupportTopic.ACCOUNT]: 'Sự cố Tài khoản / Đăng nhập / OTP',
  [SupportTopic.COINS]: 'Giao dịch Nạp Xu / Mở khóa chương',
  [SupportTopic.AUTHOR]: 'Hỗ trợ Tác giả / Duyệt tác phẩm',
  [SupportTopic.BUG]: 'Báo lỗi kỹ thuật / Giao diện web',
  [SupportTopic.OTHER]: 'Góp ý & Câu hỏi khác',
};

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  [SupportTicketStatus.OPEN]: 'Chờ phản hồi',
  [SupportTicketStatus.IN_PROGRESS]: 'Đang xử lý',
  [SupportTicketStatus.RESOLVED]: 'Đã giải quyết',
  [SupportTicketStatus.CLOSED]: 'Đã đóng',
};

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectModel(SupportTicket.name)
    private readonly tickets: Model<SupportTicketDocument>,
    @InjectModel(User.name)
    private readonly users: Model<UserDocument>,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  private getFrontendBaseUrl(): string {
    const raw =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('CLIENT_URL') ||
      'http://localhost:3000';
    return raw.replace(/\/+$/, '');
  }

  private buildTrackingUrl(ticketCode: string, email: string): string {
    return `${this.getFrontendBaseUrl()}/ho-tro?tab=inbox&code=${encodeURIComponent(ticketCode)}&email=${encodeURIComponent(email)}`;
  }

  private async generateTicketCode(): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 20; attempt++) {
      let rand = '';
      for (let i = 0; i < 6; i++) {
        rand += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      const candidate = `SP-${rand}`;
      const exists = await this.tickets.exists({ ticketCode: candidate });
      if (!exists) return candidate;
    }
    return `SP-${Date.now().toString(36).toUpperCase()}`;
  }

  private resolveTicketFilter(idOrCode: string): Record<string, unknown> {
    const trimmed = (idOrCode || '').trim();
    if (/^[a-f\d]{24}$/i.test(trimmed) && Types.ObjectId.isValid(trimmed)) {
      return { _id: new Types.ObjectId(trimmed) };
    }
    return { ticketCode: trimmed.toUpperCase().replace(/^#/, '') };
  }

  async createTicket(
    dto: CreateSupportTicketDto,
    currentUser?: { _id: Types.ObjectId; displayName?: string; username?: string; email?: string },
  ) {
    const ticketCode = await this.generateTicketCode();
    const senderName =
      dto.senderName?.trim() ||
      currentUser?.displayName ||
      currentUser?.username ||
      dto.email.split('@')[0] ||
      'Độc giả StoryVN';

    const priority =
      dto.topic === SupportTopic.COINS || dto.topic === SupportTopic.ACCOUNT
        ? SupportTicketPriority.HIGH
        : SupportTicketPriority.NORMAL;

    let confirmationEmailSent = false;
    const trackingUrl = this.buildTrackingUrl(ticketCode, dto.email);

    try {
      await this.mailService.sendSupportTicketCreated({
        to: dto.email,
        senderName,
        ticketCode,
        topicLabel: TOPIC_LABELS[dto.topic] || dto.topic,
        subjectTitle: dto.subject,
        message: dto.message,
        trackingUrl,
      });
      confirmationEmailSent = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Không thể gửi email xác nhận tạo phiếu ${ticketCode}: ${msg}`);
    }

    const created = await this.tickets.create({
      ticketCode,
      userId: currentUser?._id ? new Types.ObjectId(currentUser._id) : null,
      senderName,
      email: dto.email,
      topic: dto.topic,
      priority,
      subject: dto.subject,
      message: dto.message,
      status: SupportTicketStatus.OPEN,
      messages: [
        {
          senderRole: SupportSenderRole.USER,
          senderId: currentUser?._id ? new Types.ObjectId(currentUser._id) : null,
          senderName,
          content: dto.message,
          emailSent: confirmationEmailSent,
          emailError: null,
          createdAt: new Date(),
        },
      ],
    });

    // Gửi thông báo realtime tới toàn bộ Admin / Manager đang hoạt động
    this.notifyModeratorsNewTicket(
      ticketCode,
      senderName,
      dto.subject,
      currentUser?._id?.toString(),
    ).catch(() => undefined);

    return this.sanitizeForUser(created.toObject());
  }

  private async notifyModeratorsNewTicket(
    ticketCode: string,
    senderName: string,
    subject: string,
    actorId?: string,
  ) {
    const moderators = await this.users
      .find(
        {
          role: { $in: [UserRole.ADMIN, UserRole.MANAGER] },
          status: UserStatus.ACTIVE,
        },
        '_id',
      )
      .lean();

    if (!moderators.length) return;

    await this.notificationsService.createMany(
      moderators.map((mod) => ({
        userId: mod._id.toString(),
        type: NotificationType.SYSTEM,
        title: `📩 Phiếu hỗ trợ mới #${ticketCode}`,
        message: `${senderName} vừa gửi yêu cầu hỗ trợ: "${subject}".`,
        actorId,
        referenceId: `support-admin:${ticketCode}`,
      })),
    );
  }

  private sanitizeForUser(ticket: any) {
    if (!ticket) return ticket;
    const { _id, userId, lastRepliedBy, ...rest } = ticket;
    return {
      ...rest,
      messages: (ticket.messages || []).map((m: any) => ({
        senderRole: m.senderRole,
        senderName: m.senderName,
        content: m.content,
        emailSent: Boolean(m.emailSent),
        createdAt: m.createdAt,
      })),
    };
  }

  async getMyTickets(
    user: { _id: Types.ObjectId; email?: string },
    query: QueryMySupportTicketsDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const ownershipOr: Record<string, unknown>[] = [{ userId: new Types.ObjectId(user._id) }];
    if (user.email) {
      ownershipOr.push({ email: user.email.toLowerCase().trim() });
    }

    const filter: Record<string, unknown> = { $or: ownershipOr };
    if (query.status) {
      filter.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.tickets.find(filter).sort({ updatedAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.tickets.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);
    return {
      items: items.map((item) => this.sanitizeForUser(item)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: pagination.totalPages,
      },
    };
  }

  async lookupTicket(dto: LookupSupportTicketDto) {
    const code = dto.ticketCode.toUpperCase().replace(/^#/, '');
    const email = dto.email.toLowerCase().trim();
    const ticket = await this.tickets.findOne({ ticketCode: code, email }).lean();
    if (!ticket) {
      throw new NotFoundException('Không tìm thấy phiếu hỗ trợ khớp với mã phiếu và email đã nhập');
    }
    return this.sanitizeForUser(ticket);
  }

  async userReply(
    ticketCodeRaw: string,
    dto: UserReplySupportTicketDto,
    currentUser?: { _id: Types.ObjectId; displayName?: string; username?: string; email?: string },
  ) {
    const code = ticketCodeRaw.trim().toUpperCase().replace(/^#/, '');
    const ticket = await this.tickets.findOne({ ticketCode: code });
    if (!ticket) {
      throw new NotFoundException('Không tìm thấy phiếu hỗ trợ');
    }

    const isOwnerById = Boolean(
      currentUser?._id && ticket.userId && ticket.userId.toString() === currentUser._id.toString(),
    );
    const isOwnerByAuthEmail = Boolean(
      currentUser?.email && currentUser.email.toLowerCase() === ticket.email.toLowerCase(),
    );
    const isOwnerByDtoEmail = Boolean(
      dto.email && dto.email.toLowerCase() === ticket.email.toLowerCase(),
    );

    if (!isOwnerById && !isOwnerByAuthEmail && !isOwnerByDtoEmail) {
      throw new ForbiddenException('Email xác thực không khớp với phiếu hỗ trợ này');
    }

    if (ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException(
        'Phiếu hỗ trợ này đã đóng. Vui lòng gửi phiếu yêu cầu mới nếu bạn cần hỗ trợ thêm.',
      );
    }

    const senderName =
      currentUser?.displayName || currentUser?.username || ticket.senderName || 'Người dùng';

    ticket.messages.push({
      senderRole: SupportSenderRole.USER,
      senderId: currentUser?._id ? new Types.ObjectId(currentUser._id) : null,
      senderName,
      content: dto.content.trim(),
      emailSent: false,
      emailError: null,
      createdAt: new Date(),
    });

    if (ticket.status === SupportTicketStatus.RESOLVED) {
      ticket.status = SupportTicketStatus.OPEN;
    }

    await ticket.save();

    this.notifyModeratorsNewTicket(
      ticket.ticketCode,
      senderName,
      `Phản hồi thêm tại #${ticket.ticketCode}: ${ticket.subject}`,
      currentUser?._id?.toString(),
    ).catch(() => undefined);

    return this.sanitizeForUser(ticket.toObject());
  }

  async adminGetStats() {
    const rows = await this.tickets.aggregate<{ _id: SupportTicketStatus; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const stats = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    };
    for (const row of rows) {
      stats.total += row.count;
      if (row._id === SupportTicketStatus.OPEN) stats.open = row.count;
      else if (row._id === SupportTicketStatus.IN_PROGRESS) stats.inProgress = row.count;
      else if (row._id === SupportTicketStatus.RESOLVED) stats.resolved = row.count;
      else if (row._id === SupportTicketStatus.CLOSED) stats.closed = row.count;
    }
    return stats;
  }

  async adminList(query: AdminQuerySupportTicketsDto) {
    const page = query.page || 1;
    const limit = query.limit || 15;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.topic) filter.topic = query.topic;
    if (query.priority) filter.priority = query.priority;

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { ticketCode: regex },
        { email: regex },
        { senderName: regex },
        { subject: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.tickets
        .find(filter)
        .sort({ status: 1, updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', '_id username displayName avatarUrl role email')
        .populate('lastRepliedBy', '_id username displayName')
        .lean(),
      this.tickets.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);
    return {
      items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: pagination.totalPages,
      },
    };
  }

  async adminGetDetail(idOrCode: string) {
    const ticket = await this.tickets
      .findOne(this.resolveTicketFilter(idOrCode))
      .populate('userId', '_id username displayName avatarUrl role email')
      .populate('lastRepliedBy', '_id username displayName')
      .lean();
    if (!ticket) {
      throw new NotFoundException('Không tìm thấy phiếu hỗ trợ');
    }
    return ticket;
  }

  async adminReply(
    idOrCode: string,
    dto: AdminReplySupportTicketDto,
    adminUser: { _id: Types.ObjectId; displayName?: string; username?: string },
  ) {
    const ticket = await this.tickets.findOne(this.resolveTicketFilter(idOrCode));
    if (!ticket) {
      throw new NotFoundException('Không tìm thấy phiếu hỗ trợ');
    }

    const adminName = adminUser.displayName || adminUser.username || 'Ban quản trị StoryVN';
    const nextStatus = dto.status ?? SupportTicketStatus.RESOLVED;
    const shouldSendEmail = dto.sendEmail !== false;

    let emailSent = false;
    let emailError: string | null = null;

    if (shouldSendEmail) {
      const trackingUrl = this.buildTrackingUrl(ticket.ticketCode, ticket.email);
      try {
        await this.mailService.sendSupportTicketReply({
          to: ticket.email,
          senderName: ticket.senderName,
          ticketCode: ticket.ticketCode,
          subjectTitle: ticket.subject,
          originalMessage: ticket.message,
          replyContent: dto.content,
          adminName,
          statusLabel: STATUS_LABELS[nextStatus] || nextStatus,
          trackingUrl,
        });
        emailSent = true;
      } catch (err: unknown) {
        emailError = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Không thể gửi email phản hồi tới ${ticket.email} (ticket ${ticket.ticketCode}): ${emailError}`,
        );
      }
    }

    ticket.messages.push({
      senderRole: SupportSenderRole.ADMIN,
      senderId: new Types.ObjectId(adminUser._id),
      senderName: adminName,
      content: dto.content,
      emailSent,
      emailError,
      createdAt: new Date(),
    });

    ticket.status = nextStatus;
    ticket.lastRepliedBy = new Types.ObjectId(adminUser._id);
    ticket.lastRepliedAt = new Date();
    await ticket.save();

    // Đồng thời gửi thông báo realtime trong hệ thống nếu phiếu gắn với tài khoản người dùng
    let targetUserId = ticket.userId ? ticket.userId.toString() : null;
    if (!targetUserId) {
      const matchedUser = await this.users
        .findOne({ email: ticket.email.toLowerCase() })
        .select('_id')
        .lean();
      if (matchedUser) {
        targetUserId = matchedUser._id.toString();
      }
    }

    if (targetUserId) {
      this.notificationsService
        .create({
          userId: targetUserId,
          type: NotificationType.SYSTEM,
          title: `💬 Phản hồi phiếu hỗ trợ #${ticket.ticketCode}`,
          message: `Ban quản trị đã phản hồi yêu cầu "${ticket.subject}"${emailSent ? ' và gửi chi tiết qua email của bạn' : ''}.`,
          actorId: adminUser._id.toString(),
          referenceId: `support-user:${ticket.ticketCode}`,
        })
        .catch(() => undefined);
    }

    const updated = await this.adminGetDetail(ticket._id.toString());
    return {
      ticket: updated,
      emailSent,
      emailWarning:
        shouldSendEmail && !emailSent
          ? 'Đã lưu phản hồi trên hệ thống nhưng gửi email thất bại (kiểm tra cấu hình MAIL_USER / MAIL_PASS).'
          : null,
    };
  }

  async adminUpdateStatus(idOrCode: string, dto: AdminUpdateSupportTicketDto) {
    const updates: Record<string, unknown> = {};
    if (dto.status) updates.status = dto.status;
    if (dto.priority) updates.priority = dto.priority;
    if (!Object.keys(updates).length) {
      throw new BadRequestException('Vui lòng cung cấp trạng thái hoặc mức độ ưu tiên cần cập nhật');
    }

    const updated = await this.tickets
      .findOneAndUpdate(
        this.resolveTicketFilter(idOrCode),
        { $set: updates },
        { new: true, runValidators: true },
      )
      .populate('userId', '_id username displayName avatarUrl role email')
      .populate('lastRepliedBy', '_id username displayName')
      .lean();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy phiếu hỗ trợ');
    }
    return updated;
  }
}
