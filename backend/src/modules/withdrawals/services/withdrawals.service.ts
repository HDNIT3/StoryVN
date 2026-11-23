import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { ClientSession, Connection, Model, PipelineStage } from 'mongoose';
import { buildPaginationMeta } from '../../../common/dto/pagination.dto.js';
import {
  payoutAmount,
  royaltyPolicy,
} from '../../../common/utils/royalty-policy.js';
import { Chapter } from '../../chapters/schemas/chapter.schema.js';
import { ChapterUnlock } from '../../chapters/schemas/chapter-unlock.schema.js';
import {
  Notification,
  NotificationType,
} from '../../notifications/schemas/notification.schema.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { Story } from '../../stories/schemas/story.schema.js';
import {
  AuthorProfile,
  AuthorProfileStatus,
} from '../../users/schemas/author-profile.schema.js';
import { User, UserRole } from '../../users/schemas/user.schema.js';
import type { WithdrawalQueryDto } from '../dto/query-withdrawals.dto.js';
import {
  OPEN_STATUSES,
  WithdrawalStatus as S,
} from '../enums/withdrawal-status.enum.js';
import { WithdrawalRequest } from '../schemas/withdrawal-request.schema.js';

@Injectable()
export class WithdrawalsService implements OnModuleInit {
  constructor(
    @InjectModel(WithdrawalRequest.name)
    private readonly requests: Model<WithdrawalRequest>,
    @InjectModel(AuthorProfile.name)
    private readonly profiles: Model<AuthorProfile>,
    @InjectModel(Story.name) private readonly stories: Model<Story>,
    @InjectModel(Chapter.name) private readonly chapters: Model<Chapter>,
    @InjectModel(ChapterUnlock.name)
    private readonly unlocks: Model<ChapterUnlock>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Notification.name)
    private readonly notifications: Model<Notification>,
    @InjectConnection() private readonly connection: Connection,
    private readonly notificationService: NotificationsService,
  ) {}

  async onModuleInit() {
    // Financial safety must not depend on production autoIndex settings.
    await this.requests.createIndexes();
  }

  private id(value: string) {
    if (!Types.ObjectId.isValid(value))
      throw new BadRequestException('ID không hợp lệ');
    return new Types.ObjectId(value);
  }

  private async chapterIds(
    authorId: Types.ObjectId,
    session: ClientSession | null = null,
  ) {
    const stories = await this.stories
      .find({ authorId })
      .select('_id')
      .session(session)
      .lean();
    const chapters = await this.chapters
      .find({ storyId: { $in: stories.map((s) => s._id) } })
      .select('_id')
      .session(session)
      .lean();
    return chapters.map((c) => c._id);
  }

  async summary(author: string, session: ClientSession | null = null) {
    const authorId = this.id(author);
    const chapterIds = await this.chapterIds(authorId, session);
    const revenue = await this.unlocks
      .aggregate<{ total: number }>([
        { $match: { chapterId: { $in: chapterIds } } },
        { $group: { _id: null, total: { $sum: '$coinPrice' } } },
      ])
      .session(session);
    const totals = await this.requests
      .aggregate<{ _id: S; coins: number; amount: number }>([
        { $match: { authorId } },
        {
          $group: {
            _id: '$status',
            coins: { $sum: '$coinAmount' },
            amount: { $sum: '$amount' },
          },
        },
      ])
      .session(session);
    const totalCoins = revenue[0]?.total ?? 0;
    const completed = totals.find((t) => t._id === S.COMPLETED);
    const reservedCoins = totals
      .filter((t) => OPEN_STATUSES.includes(t._id))
      .reduce((sum, t) => sum + t.coins, 0);
    const pendingAmount = totals
      .filter((t) => OPEN_STATUSES.includes(t._id))
      .reduce((sum, t) => sum + t.amount, 0);
    const availableCoins = totalCoins - reservedCoins - (completed?.coins ?? 0);
    const policy = royaltyPolicy();
    const profile = await this.profiles
      .findOne({ userId: authorId })
      .session(session)
      .lean();
    const bank = {
      bankName: profile?.bankName?.trim() ?? '',
      bankAccountNumber: profile?.bankAccountNumber?.trim() ?? '',
      bankAccountName: profile?.bankAccountName?.trim() ?? '',
    };
    const bankReady = Object.values(bank).every(Boolean);
    const activeRequest = await this.requests
      .findOne({ authorId, status: { $in: OPEN_STATUSES } })
      .select('_id status')
      .session(session)
      .lean();
    const availableAmount = payoutAmount(
      Math.max(0, availableCoins),
      policy.exchangeRate,
    );
    return {
      totalCoins,
      availableCoins: Math.max(0, availableCoins),
      reservedCoins,
      completedCoins: completed?.coins ?? 0,
      pendingAmount,
      paidAmount: completed?.amount ?? 0,
      availableAmount,
      policy,
      bank,
      bankReady,
      activeRequest,
      reconciliationRequired: availableCoins < 0,
      canWithdraw:
        availableCoins > 0 &&
        availableAmount >= policy.minimumAmount &&
        bankReady &&
        !activeRequest &&
        profile?.status === AuthorProfileStatus.ACTIVE,
    };
  }

  private async transaction<T>(
    run: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.connection.startSession();
    try {
      return await session.withTransaction(() => run(session), {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException(
          'Yêu cầu đang mở hoặc mã giao dịch đã tồn tại. Vui lòng tải lại dữ liệu.',
        );
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async lockAuthor(authorId: Types.ObjectId, session: ClientSession) {
    // Every request mutation writes the same existing profile document. This
    // serializes creation against completion/rejection across all server instances.
    const profile = await this.profiles.findOneAndUpdate(
      { userId: authorId },
      { $inc: { __v: 1 } },
      { session, returnDocument: 'after' },
    );
    if (!profile) throw new BadRequestException('Không tìm thấy hồ sơ tác giả');
    return profile;
  }

  async create(author: string, idempotencyKey: string) {
    return this.transaction(async (session) => {
      const authorId = this.id(author);
      const profile = await this.lockAuthor(authorId, session);
      const duplicate = await this.requests
        .findOne({ authorId, idempotencyKey })
        .session(session)
        .lean();
      if (duplicate) return duplicate;
      if (profile.status !== AuthorProfileStatus.ACTIVE)
        throw new ForbiddenException('Hồ sơ tác giả không hoạt động');
      const summary = await this.summary(author, session);
      if (summary.activeRequest)
        throw new ConflictException(
          'Bạn đã có yêu cầu rút tiền đang chờ hoặc đang xử lý',
        );
      if (summary.reconciliationRequired)
        throw new ConflictException(
          'Doanh thu cần được đối soát. Vui lòng liên hệ quản lý.',
        );
      if (!summary.bankReady)
        throw new BadRequestException(
          'Vui lòng điền đầy đủ ngân hàng, số tài khoản và tên chủ tài khoản trong hồ sơ',
        );
      if (
        summary.availableCoins <= 0 ||
        summary.availableAmount < summary.policy.minimumAmount
      ) {
        throw new BadRequestException(
          `Số tiền thực nhận tối thiểu là ${summary.policy.minimumAmount.toLocaleString('vi-VN')}đ`,
        );
      }
      const [request] = await this.requests.create(
        [
          {
            authorId,
            coinAmount: summary.availableCoins,
            exchangeRate: summary.policy.exchangeRate,
            payoutPercent: 70,
            amount: summary.availableAmount,
            ...summary.bank,
            idempotencyKey,
            status: S.PENDING,
            history: [
              {
                status: S.PENDING,
                actorId: authorId,
                at: new Date(),
                note: 'Gửi yêu cầu rút toàn bộ Xu khả dụng',
              },
            ],
          },
        ],
        { session },
      );
      return request.toObject();
    });
  }

  private dateFilter(query: WithdrawalQueryDto) {
    const result: Record<string, Date> = {};
    if (query.startDate)
      result.$gte = new Date(query.startDate.slice(0, 10) + 'T00:00:00+07:00');
    if (query.endDate)
      result.$lt = new Date(
        new Date(query.endDate.slice(0, 10) + 'T00:00:00+07:00').getTime() +
          86400000,
      );
    if (result.$gte && result.$lt && result.$gte >= result.$lt)
      throw new BadRequestException('Khoảng ngày không hợp lệ');
    return Object.keys(result).length ? result : undefined;
  }

  async list(query: WithdrawalQueryDto, author?: string) {
    const filter: Record<string, unknown> = {};
    if (author) filter.authorId = this.id(author);
    if (query.status) filter.status = query.status;
    const dates = this.dateFilter(query);
    if (dates) filter.createdAt = dates;
    if (!author && query.search?.trim()) {
      const escaped = query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const users = await this.users
        .find({
          $or: [
            { displayName: new RegExp(escaped, 'i') },
            { username: new RegExp(escaped, 'i') },
            { email: new RegExp(escaped, 'i') },
          ],
        })
        .select('_id')
        .lean();
      filter.$or = [
        { authorId: { $in: users.map((u) => u._id) } },
        ...(Types.ObjectId.isValid(query.search.trim())
          ? [{ _id: this.id(query.search.trim()) }]
          : []),
      ];
    }
    const [items, total] = await Promise.all([
      this.requests
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(query.skip)
        .limit(query.limit)
        .populate('authorId', 'username displayName email')
        .lean(),
      this.requests.countDocuments(filter),
    ]);
    return {
      items,
      pagination: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async detail(id: string, author?: string) {
    const request = await this.requests
      .findOne({
        _id: this.id(id),
        ...(author ? { authorId: this.id(author) } : {}),
      })
      .populate('authorId', 'username displayName email')
      .populate('history.actorId', 'displayName username')
      .lean();
    if (!request)
      throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
    return request;
  }

  async transition(
    id: string,
    actor: string,
    action: 'process' | 'reject' | 'complete' | 'cancel' | 'notes',
    note = '',
    transactionCode = '',
    role?: UserRole,
  ) {
    const notificationIds: string[] = [];
    const result = await this.transaction(async (session) => {
      // withTransaction may retry the callback; do not emit stale attempt events.
      notificationIds.length = 0;
      const requestId = this.id(id);
      const initial = await this.requests
        .findById(requestId)
        .session(session)
        .lean();
      if (
        !initial ||
        (action === 'cancel' && String(initial.authorId) !== actor)
      )
        throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
      await this.lockAuthor(initial.authorId, session);
      const current = await this.requests.findById(requestId).session(session);
      if (!current)
        throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
      const code = transactionCode.trim().toUpperCase();
      if (
        action === 'complete' &&
        current.status === S.COMPLETED &&
        current.transactionCode === code
      )
        return current.toObject();
      if (action === 'cancel' && current.status === S.CANCELLED)
        return current.toObject();
      if (action === 'process' && current.status === S.PROCESSING)
        return current.toObject();
      if (action !== 'cancel' && String(current.authorId) === actor)
        throw new ForbiddenException(
          'Không được tự xử lý yêu cầu rút tiền của mình',
        );
      const allowed =
        action === 'process' || action === 'cancel'
          ? [S.PENDING]
          : action === 'complete' || action === 'notes'
            ? [S.PROCESSING]
            : OPEN_STATUSES;
      if (!allowed.includes(current.status))
        throw new ConflictException(
          'Trạng thái đã thay đổi hoặc không cho phép thao tác này',
        );
      const handler = current.history.find(
        (event) => event.status === S.PROCESSING,
      );
      if (
        current.status === S.PROCESSING &&
        handler &&
        String(handler.actorId) !== actor &&
        role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Yêu cầu do quản lý khác phụ trách');
      }
      if ((action === 'reject' || action === 'notes') && !note.trim())
        throw new BadRequestException('Vui lòng nhập lý do hoặc ghi chú');
      if (action === 'complete' && code.length < 3)
        throw new BadRequestException('Vui lòng nhập mã giao dịch chuyển tiền');
      const next =
        action === 'process'
          ? S.PROCESSING
          : action === 'reject'
            ? S.REJECTED
            : action === 'complete'
              ? S.COMPLETED
              : action === 'cancel'
                ? S.CANCELLED
                : current.status;
      const at = new Date();
      const updated = await this.requests.findOneAndUpdate(
        { _id: requestId, status: current.status },
        {
          $set: {
            status: next,
            note: note.trim(),
            ...(action === 'complete' ? { transactionCode: code } : {}),
          },
          $push: {
            history: {
              status: next,
              actorId: this.id(actor),
              at,
              note: note.trim(),
            },
          },
        },
        { returnDocument: 'after', session },
      );
      if (!updated)
        throw new ConflictException(
          'Yêu cầu vừa được cập nhật. Vui lòng tải lại',
        );
      const labels = {
        PENDING: 'chờ xử lý',
        PROCESSING: 'đang xử lý',
        COMPLETED: 'đã thanh toán',
        REJECTED: 'bị từ chối',
        CANCELLED: 'đã hủy',
      };
      const [notification] = await this.notifications.create(
        [
          {
            userId: current.authorId,
            type: NotificationType.SYSTEM,
            title: 'Cập nhật yêu cầu rút nhuận bút',
            message: `Yêu cầu ${requestId} ${labels[next]}. Số tiền thực nhận: ${current.amount.toLocaleString('vi-VN')}đ.${note.trim() ? ' ' + note.trim() : ''} Xem tại trang Doanh thu tác giả.`,
            actorId: this.id(actor),
            referenceId: `withdrawal:${requestId}`,
          },
        ],
        { session },
      );
      notificationIds.push(String(notification._id));
      return updated.toObject();
    });
    // The notification is already durable in the same transaction. SSE is best effort.
    for (const notificationId of notificationIds)
      await this.notificationService.publishPersisted(notificationId);
    return result;
  }

  async history(author: string, query: WithdrawalQueryDto) {
    const authorId = this.id(author);
    const ids = await this.chapterIds(authorId);
    const dates = this.dateFilter(query);
    const pipeline: PipelineStage[] = [
      { $match: { chapterId: { $in: ids } } },
      {
        $project: {
          _id: 1,
          at: '$unlockedAt',
          type: { $literal: 'REVENUE' },
          coinDelta: '$coinPrice',
          reservedDelta: { $literal: 0 },
          note: { $literal: 'Độc giả mua chương' },
        },
      },
      {
        $unionWith: {
          coll: 'withdrawal_requests',
          pipeline: [
            { $match: { authorId } },
            { $unwind: { path: '$history', includeArrayIndex: 'eventIndex' } },
            {
              $project: {
                _id: {
                  $concat: [
                    { $toString: '$_id' },
                    '-',
                    { $toString: '$eventIndex' },
                  ],
                },
                requestId: '$_id',
                at: '$history.at',
                type: '$history.status',
                note: '$history.note',
                coinDelta: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ['$history.status', S.PENDING] },
                        then: { $multiply: ['$coinAmount', -1] },
                      },
                      {
                        case: {
                          $in: ['$history.status', [S.REJECTED, S.CANCELLED]],
                        },
                        then: '$coinAmount',
                      },
                    ],
                    default: 0,
                  },
                },
                reservedDelta: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ['$history.status', S.PENDING] },
                        then: '$coinAmount',
                      },
                      {
                        case: {
                          $in: [
                            '$history.status',
                            [S.REJECTED, S.CANCELLED, S.COMPLETED],
                          ],
                        },
                        then: { $multiply: ['$coinAmount', -1] },
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          ],
        },
      },
      ...(dates ? [{ $match: { at: dates } }] : []),
      { $sort: { at: -1, _id: -1 } },
      {
        $facet: {
          items: [{ $skip: query.skip }, { $limit: query.limit }],
          count: [{ $count: 'total' }],
        },
      },
    ];
    const [result] = await this.unlocks.aggregate(pipeline);
    return {
      items: result?.items ?? [],
      pagination: buildPaginationMeta(
        result?.count[0]?.total ?? 0,
        query.page,
        query.limit,
      ),
    };
  }
}
