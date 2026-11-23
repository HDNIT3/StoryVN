import { randomUUID } from 'node:crypto';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createConnection, Types } from 'mongoose';
import type { Connection, Model } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import {
  Chapter,
  ChapterSchema,
} from '../../chapters/schemas/chapter.schema.js';
import {
  ChapterUnlock,
  ChapterUnlockSchema,
} from '../../chapters/schemas/chapter-unlock.schema.js';
import { Story, StorySchema } from '../../stories/schemas/story.schema.js';
import { User, UserRole, UserSchema } from '../../users/schemas/user.schema.js';
import {
  AuthorProfile,
  AuthorProfileSchema,
} from '../../users/schemas/author-profile.schema.js';
import {
  Notification,
  NotificationSchema,
} from '../../notifications/schemas/notification.schema.js';
import type { NotificationsService } from '../../notifications/notifications.service.js';
import {
  WithdrawalRequest,
  WithdrawalSchema,
} from '../schemas/withdrawal-request.schema.js';
import { WithdrawalStatus as S } from '../enums/withdrawal-status.enum.js';
import { WithdrawalQueryDto } from '../dto/query-withdrawals.dto.js';
import { WithdrawalsService } from './withdrawals.service.js';
import { Wallet, WalletSchema } from '../../wallet/schemas/wallet.schema.js';
import { WalletService } from '../../wallet/services/wallet.service.js';

describe('withdrawals: real MongoDB transactions and unique indexes', () => {
  let replset: MongoMemoryReplSet | undefined;
  let db: Connection;
  let requests: Model<WithdrawalRequest>;
  let profiles: Model<AuthorProfile>;
  let unlocks: Model<ChapterUnlock>;
  let notifications: Model<Notification>;
  let service: WithdrawalsService;
  let wallets: Model<Wallet>;
  let walletService: WalletService;
  const authorId = new Types.ObjectId();
  const managerId = new Types.ObjectId();
  const otherManagerId = new Types.ObjectId();
  const chapterId = new Types.ObjectId();
  const storyId = new Types.ObjectId();
  const actor = String(managerId);
  const publish = vi.fn().mockResolvedValue(undefined);
  const newRequest = () => service.create(String(authorId), randomUUID());
  const act = (
    id: Types.ObjectId,
    action: 'process' | 'reject' | 'complete' | 'cancel' | 'notes',
    note = '',
    code = '',
    user = actor,
    role = UserRole.MANAGER,
  ) => service.transition(String(id), user, action, note, code, role);

  beforeAll(async () => {
    const external = process.env.WITHDRAWAL_TEST_MONGODB_URI;
    if (!external)
      replset = await MongoMemoryReplSet.create({
        replSet: { count: 1 },
        binary: { version: process.env.MONGOMS_VERSION || '8.2.6' },
      });
    db = await createConnection(external || replset!.getUri(), {
      dbName: `withdrawal_test_${randomUUID().replaceAll('-', '')}`,
    }).asPromise();
    requests = db.model(WithdrawalRequest.name, WithdrawalSchema);
    profiles = db.model(AuthorProfile.name, AuthorProfileSchema);
    unlocks = db.model(ChapterUnlock.name, ChapterUnlockSchema);
    notifications = db.model(Notification.name, NotificationSchema);
    const stories = db.model(Story.name, StorySchema);
    const chapters = db.model(Chapter.name, ChapterSchema);
    const users = db.model(User.name, UserSchema);
    wallets = db.model(Wallet.name, WalletSchema);
    walletService = new WalletService(wallets, users);
    service = new WithdrawalsService(
      requests,
      profiles,
      stories,
      chapters,
      unlocks,
      users,
      notifications,
      db,
      { publishPersisted: publish } as unknown as NotificationsService,
    );
    await Promise.all([
      profiles.init(),
      unlocks.init(),
      notifications.init(),
      wallets.init(),
    ]);
    await service.onModuleInit();
    await stories.collection.insertOne({
      _id: storyId,
      authorId,
      title: 'Paid story',
    });
    await chapters.collection.insertOne({
      _id: chapterId,
      storyId,
      title: 'Paid chapter',
    });
  }, 180000);

  beforeEach(async () => {
    await Promise.all([
      requests.deleteMany({}),
      profiles.deleteMany({}),
      unlocks.deleteMany({}),
      notifications.deleteMany({}),
      wallets.deleteMany({}),
    ]);
    publish.mockClear();
    await profiles.create({
      userId: authorId,
      penName: 'Tác giả',
      bankName: 'VCB',
      bankAccountNumber: '123456',
      bankAccountName: 'NGUYEN VAN A',
    });
    await unlocks.create({
      userId: new Types.ObjectId(),
      chapterId,
      coinPrice: 20000,
    });
  });

  afterAll(async () => {
    if (db) {
      await db.dropDatabase();
      await db.close();
    }
    await replset?.stop();
  });

  it('withdraws all coins, keeps the bank snapshot, and leaves later income for next time', async () => {
    const request = await newRequest();
    expect(request.coinAmount).toBe(20000);
    expect(request.amount).toBe(1400000);
    await profiles.updateOne(
      { userId: authorId },
      { $set: { bankAccountNumber: '99999' } },
    );
    await unlocks.create({
      userId: new Types.ObjectId(),
      chapterId,
      coinPrice: 500,
    });
    const summary = await service.summary(String(authorId));
    expect(summary.availableCoins).toBe(500);
    expect(summary.reservedCoins).toBe(20000);
    expect((await requests.findById(request._id))!.bankAccountNumber).toBe(
      '123456',
    );
  });

  it('serializes concurrent submissions, including retries using the same key', async () => {
    const key = randomUUID();
    const repeated = await Promise.all([
      service.create(String(authorId), key),
      service.create(String(authorId), key),
    ]);
    expect(String(repeated[0]._id)).toBe(String(repeated[1]._id));
    expect(await requests.countDocuments()).toBe(1);
    const result = await Promise.allSettled([newRequest(), newRequest()]);
    expect(result.every((r) => r.status === 'rejected')).toBe(true);
  });

  it('allows only one of two distinct simultaneous submissions', async () => {
    const results = await Promise.allSettled([newRequest(), newRequest()]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await requests.countDocuments()).toBe(1);
  });

  it('enforces the open-request invariant in the database even outside the service', async () => {
    const request = await newRequest();
    await expect(
      requests.create({
        ...request,
        _id: new Types.ObjectId(),
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('never exposes a failed chapter debit as withdrawable revenue', async () => {
    const readerId = new Types.ObjectId();
    await wallets.create({ userId: readerId, balance: 10 });
    await expect(
      db.transaction(async (session) => {
        await unlocks.create([{ userId: readerId, chapterId, coinPrice: 20 }], {
          session,
        });
        await walletService.debitInSession(String(readerId), 20, session);
      }),
    ).rejects.toThrow();
    expect(await unlocks.countDocuments({ userId: readerId })).toBe(0);
    expect((await service.summary(String(authorId))).totalCoins).toBe(20000);
    expect((await wallets.findOne({ userId: readerId }))!.balance).toBe(10);
  });

  it('releases rejected coins and records notes and durable result notifications', async () => {
    const request = await newRequest();
    await act(request._id, 'process');
    await act(request._id, 'notes', 'Ngân hàng đang kiểm tra');
    await act(request._id, 'reject', 'Sai tài khoản, vui lòng sửa hồ sơ');
    const summary = await service.summary(String(authorId));
    expect(summary.availableCoins).toBe(20000);
    expect(summary.reservedCoins).toBe(0);
    expect((await requests.findById(request._id))!.history).toHaveLength(4);
    expect(await notifications.countDocuments()).toBe(3);
    expect(publish).toHaveBeenCalledTimes(3);
    const history = await service.history(
      String(authorId),
      new WithdrawalQueryDto(),
    );
    expect(
      history.items.reduce(
        (n: number, e: { coinDelta: number }) => n + e.coinDelta,
        0,
      ),
    ).toBe(20000);
    expect(
      history.items.reduce(
        (n: number, e: { reservedDelta: number }) => n + e.reservedDelta,
        0,
      ),
    ).toBe(0);
  });

  it('completes once even with concurrent confirmation and prevents reuse of transaction codes', async () => {
    const request = await newRequest();
    await act(request._id, 'process');
    await Promise.all([
      act(request._id, 'complete', '', 'VCB-001'),
      act(request._id, 'complete', '', 'vcb-001'),
    ]);
    const summary = await service.summary(String(authorId));
    expect(summary.availableCoins).toBe(0);
    expect(summary.completedCoins).toBe(20000);
    expect(summary.paidAmount).toBe(1400000);
    expect((await requests.findById(request._id))!.history).toHaveLength(3);
    expect(await notifications.countDocuments()).toBe(2);
    await unlocks.create({
      userId: new Types.ObjectId(),
      chapterId,
      coinPrice: 3000,
    });
    const second = await newRequest();
    await act(second._id, 'process');
    await expect(act(second._id, 'complete', '', 'VCB-001')).rejects.toThrow();
    expect((await requests.findById(second._id))!.status).toBe(S.PROCESSING);
    expect((await service.summary(String(authorId))).reservedCoins).toBe(3000);
  });

  it('does not double-release when cancellation races rejection', async () => {
    const request = await newRequest();
    const result = await Promise.allSettled([
      act(request._id, 'cancel', '', '', String(authorId)),
      act(request._id, 'reject', 'Không hợp lệ'),
    ]);
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await requests.findById(request._id))!.history).toHaveLength(2);
    expect((await service.summary(String(authorId))).availableCoins).toBe(
      20000,
    );
  });

  it('rejects missing bank details and below-threshold withdrawals', async () => {
    await profiles.updateOne(
      { userId: authorId },
      { $set: { bankAccountName: ' ' } },
    );
    await expect(newRequest()).rejects.toThrow('hồ sơ');
    await profiles.updateOne(
      { userId: authorId },
      { $set: { bankAccountName: 'NGUYEN VAN A' } },
    );
    await unlocks.updateMany({}, { $set: { coinPrice: 2857 } });
    await expect(newRequest()).rejects.toThrow('tối thiểu');
    expect(await requests.countDocuments()).toBe(0);
  });

  it('restricts ownership, handler permissions, and invalid transitions', async () => {
    const request = await newRequest();
    await expect(
      service.detail(String(request._id), String(otherManagerId)),
    ).rejects.toThrow();
    await expect(
      act(request._id, 'process', '', '', String(authorId)),
    ).rejects.toThrow();
    await expect(act(request._id, 'complete', '', 'VCB-001')).rejects.toThrow();
    await act(request._id, 'process');
    await expect(
      act(request._id, 'cancel', '', '', String(authorId)),
    ).rejects.toThrow();
    await expect(
      act(request._id, 'complete', '', 'VCB-001', String(otherManagerId)),
    ).rejects.toThrow();
    await act(
      request._id,
      'complete',
      '',
      'VCB-001',
      String(otherManagerId),
      UserRole.ADMIN,
    );
  });

  it('rolls back financial status and history if durable notification insert fails', async () => {
    const request = await newRequest();
    const failure = vi
      .spyOn(notifications, 'create')
      .mockRejectedValueOnce(new Error('notification storage unavailable'));
    await expect(act(request._id, 'process')).rejects.toThrow(
      'notification storage',
    );
    failure.mockRestore();
    const current = await requests.findById(request._id);
    expect(current!.status).toBe(S.PENDING);
    expect(current!.history).toHaveLength(1);
    expect(publish).not.toHaveBeenCalled();
  });

  it('serializes completion against a new request without reserving paid coins again', async () => {
    const request = await newRequest();
    await act(request._id, 'process');
    await Promise.allSettled([
      act(request._id, 'complete', '', 'VCB-RACE'),
      newRequest(),
    ]);
    expect(await requests.countDocuments()).toBe(1);
    expect((await service.summary(String(authorId))).availableCoins).toBe(0);
  });
});
