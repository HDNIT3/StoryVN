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
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { AdjustWalletDto } from '../dto/adjust-wallet.dto.js';
import { QueryWalletsDto } from '../dto/query-wallets.dto.js';
import { WalletAdjustDirection } from '../enums/wallet.enum.js';
import { Wallet, WalletDocument } from '../schemas/wallet.schema.js';

export interface WalletSummary {
  userId: string;
  balance: number;
  totalSpent: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreditFromPaymentInput {
  userId: string;
  totalCoin: number;
  orderCode: string;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Lấy ví của người dùng, tự động khởi tạo ví mới (0 Xu) nếu chưa có
   */
  async getOrCreateWallet(userId: string): Promise<WalletDocument> {
    this.assertValidUserId(userId);
    const userObjectId = new Types.ObjectId(userId);

    const existing = await this.walletModel.findOne({ userId: userObjectId }).exec();
    if (existing) {
      return existing;
    }

    try {
      return await this.walletModel.create({ userId: userObjectId });
    } catch (error) {
      // Hai request đồng thời có thể cùng tạo ví -> bắt lỗi trùng unique và lấy ví đã tạo
      if ((error as { code?: number }).code === 11000) {
        const wallet = await this.walletModel.findOne({ userId: userObjectId }).exec();
        if (wallet) {
          return wallet;
        }
      }
      throw error;
    }
  }

  /**
   * Thông tin ví của chính người dùng đang đăng nhập
   */
  async getMyWallet(userId: string): Promise<WalletSummary> {
    const wallet = await this.getOrCreateWallet(userId);
    return this.toSummary(wallet);
  }

  /**
   * Cộng Xu vào ví (nạp Xu, thưởng...)
   */
  async credit(userId: string, amount: number): Promise<WalletSummary> {
    const coinAmount = this.normalizeAmount(amount);
    const wallet = await this.getOrCreateWallet(userId);

    const updated = await this.walletModel
      .findByIdAndUpdate(
        wallet._id,
        { $inc: { balance: coinAmount } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(ErrorCode.WALLET_NOT_FOUND);
    }

    return this.toSummary(updated);
  }

  /**
   * Trừ Xu khỏi ví và cộng dồn vào tổng Xu đã dùng.
   * Dùng filter balance >= amount để tránh trừ âm khi có nhiều giao dịch đồng thời.
   */
  async debit(userId: string, amount: number): Promise<WalletSummary> {
    const coinAmount = this.normalizeAmount(amount);
    const wallet = await this.getOrCreateWallet(userId);

    const updated = await this.walletModel
      .findOneAndUpdate(
        { _id: wallet._id, balance: { $gte: coinAmount } },
        { $inc: { balance: -coinAmount, totalSpent: coinAmount } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new BadRequestException(ErrorCode.WALLET_INSUFFICIENT_BALANCE);
    }

    return this.toSummary(updated);
  }

  /**
   * Cộng Xu từ một giao dịch thanh toán VNPay đã thành công
   */
  async creditFromPayment(input: CreditFromPaymentInput): Promise<WalletSummary> {
    const coinAmount = Math.round(input.totalCoin);

    if (!Number.isFinite(coinAmount) || coinAmount <= 0) {
      throw new BadRequestException(ErrorCode.WALLET_INVALID_AMOUNT);
    }

    return this.credit(input.userId, coinAmount);
  }

  /**
   * Admin: danh sách ví người dùng (tìm kiếm, phân trang, sắp xếp)
   */
  async adminGetWallets(
    query: QueryWalletsDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const filter: Record<string, unknown> = {};

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      const users = await this.userModel
        .find({
          $or: [{ displayName: regex }, { email: regex }, { username: regex }],
        })
        .select('_id')
        .lean()
        .exec();

      filter.userId = { $in: users.map((user) => user._id) };
    }

    const sortField = query.sortBy || 'updatedAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const [items, totalItems] = await Promise.all([
      this.walletModel
        .find(filter)
        .sort({ [sortField]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'displayName email username avatarUrl role status')
        .lean()
        .exec(),
      this.walletModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items as unknown as Record<string, unknown>[],
      pagination: buildPaginationMeta(totalItems, page, limit),
    };
  }

  /**
   * Admin: cộng/trừ Xu thủ công cho một người dùng
   */
  async adminAdjustWallet(
    userId: string,
    dto: AdjustWalletDto,
  ): Promise<WalletSummary> {
    const coinAmount = this.normalizeAmount(dto.amount);
    const wallet = await this.getOrCreateWallet(userId);
    const isCredit = dto.direction === WalletAdjustDirection.CREDIT;

    const updated = await this.walletModel
      .findOneAndUpdate(
        isCredit
          ? { _id: wallet._id }
          : { _id: wallet._id, balance: { $gte: coinAmount } },
        { $inc: { balance: isCredit ? coinAmount : -coinAmount } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new BadRequestException(ErrorCode.WALLET_INSUFFICIENT_BALANCE);
    }

    return this.toSummary(updated);
  }

  private toSummary(wallet: WalletDocument): WalletSummary {
    return {
      userId: String(wallet.userId),
      balance: wallet.balance,
      totalSpent: wallet.totalSpent,
      createdAt: wallet.createdAt ?? null,
      updatedAt: wallet.updatedAt ?? null,
    };
  }

  private normalizeAmount(amount: number): number {
    const coinAmount = Math.round(Number(amount));

    if (!Number.isFinite(coinAmount) || coinAmount <= 0) {
      throw new BadRequestException(ErrorCode.WALLET_INVALID_AMOUNT);
    }

    return coinAmount;
  }

  private assertValidUserId(userId: string): void {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }
  }
}
