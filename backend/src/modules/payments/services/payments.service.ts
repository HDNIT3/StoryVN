import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import qs from 'qs';
import { CoinPackage, CoinPackageDocument } from '../../coin-packages/schemas/coin-package.schema.js';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { CreatePaymentDto } from '../dto/create-payment.dto.js';
import { QueryTransactionsDto } from '../dto/query-transactions.dto.js';
import { TransactionStatus } from '../enums/transaction-status.enum.js';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema.js';
import {
  createVnpaySignature,
  formatVnpayDate,
  sortObject,
  verifyVnpaySignature,
} from '../utils/vnpay.util.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(CoinPackage.name)
    private readonly coinPackageModel: Model<CoinPackageDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Tạo đơn hàng và sinh URL thanh toán VNPay Sandbox
   */
  async createVnpayPayment(userId: string, dto: CreatePaymentDto, clientIp: string) {
    // 1. Kiểm tra gói Xu tồn tại và đang hoạt động
    if (!Types.ObjectId.isValid(dto.packageId)) {
      throw new BadRequestException('ID gói nạp Xu không hợp lệ');
    }

    const pkg = await this.coinPackageModel.findById(dto.packageId).exec();
    if (!pkg) {
      throw new NotFoundException('Gói nạp Xu không tồn tại');
    }

    if (!pkg.isActive) {
      throw new BadRequestException('Gói nạp này hiện đang tạm dừng hoặc không còn hoạt động');
    }

    // 2. Đọc cấu hình VNPay từ ConfigService
    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');
    const vnpPaymentUrl =
      this.configService.get<string>('VNPAY_PAYMENT_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL') ||
      'http://localhost:3001/api/payments/vnpay-return';

    if (!tmnCode || !hashSecret) {
      throw new BadRequestException(
        'Hệ thống chưa được cấu hình thông tin VNPay (VNPAY_TMN_CODE hoặc VNPAY_HASH_SECRET)',
      );
    }

    // 3. Tạo mã đơn hàng duy nhất: SVN + timestamp + 4 số ngẫu nhiên
    const orderCode = `SVN${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Tạo Transaction trạng thái PENDING với snapshot giá tiền và số Xu từ Database
    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(userId),
      packageId: pkg._id,
      orderCode,
      amount: pkg.price,
      coinAmount: pkg.coinAmount,
      bonusCoin: pkg.bonusCoin || 0,
      totalCoin: pkg.totalCoin,
      status: TransactionStatus.PENDING,
    });
    await transaction.save();

    // 5. Chuẩn bị tham số cho VNPay (Hết hạn sau 15 phút)
    const now = new Date();
    const createDate = formatVnpayDate(now);
    const expireDate = formatVnpayDate(new Date(now.getTime() + 15 * 60 * 1000));
    const orderInfo = `Thanh toan goi ${pkg.name} ma don ${orderCode}`;

    const vnp_Params: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderCode,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: pkg.price * 100, // VNPay quy định số tiền nhân 100
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // 6. Ký dữ liệu với HMAC-SHA512
    const sortedParams = sortObject(vnp_Params);
    const secureHash = createVnpaySignature(vnp_Params, hashSecret);
    sortedParams['vnp_SecureHash'] = secureHash;

    const paymentUrl = `${vnpPaymentUrl}?${qs.stringify(sortedParams, { encode: false })}`;

    return {
      paymentUrl,
      orderCode,
      transactionId: transaction._id,
      amount: pkg.price,
      totalCoin: pkg.totalCoin,
      packageName: pkg.name,
    };
  }

  /**
   * Xử lý khi VNPay redirect trình duyệt người dùng về Return URL
   * Kiểm tra chữ ký và cập nhật trạng thái nếu hợp lệ để người dùng không phải chờ
   */
  async handleVnpayReturn(query: Record<string, any>) {
    const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || '';
    const isValidSignature = verifyVnpaySignature(query, hashSecret);

    const orderCode = query['vnp_TxnRef'];
    const transaction = orderCode
      ? await this.transactionModel.findOne({ orderCode }).populate('packageId').exec()
      : null;

    if (transaction && isValidSignature) {
      const responseCode = query['vnp_ResponseCode'];
      if (transaction.status === TransactionStatus.PENDING) {
        if (responseCode === '00') {
          transaction.status = TransactionStatus.SUCCESS;
          transaction.transactionNo = query['vnp_TransactionNo'] || null;
          transaction.bankCode = query['vnp_BankCode'] || null;
          transaction.cardType = query['vnp_CardType'] || null;
          transaction.payDate = query['vnp_PayDate'] || null;
          transaction.vnpResponseCode = responseCode;
          await transaction.save();
        } else {
          transaction.status = TransactionStatus.FAILED;
          transaction.transactionNo = query['vnp_TransactionNo'] || null;
          transaction.vnpResponseCode = responseCode;
          await transaction.save();
        }
      }
    }

    return {
      isValidSignature,
      orderCode,
      transaction,
      vnpResponseCode: query['vnp_ResponseCode'],
      vnpTransactionNo: query['vnp_TransactionNo'],
    };
  }

  /**
   * Xử lý IPN Callback gọi ngầm trực tiếp từ máy chủ VNPay
   * Nguồn xác nhận chính thức trạng thái giao dịch
   */
  async handleVnpayIpn(query: Record<string, any>): Promise<{ RspCode: string; Message: string }> {
    const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || '';

    // 1. Kiểm tra chữ ký
    const isValidSignature = verifyVnpaySignature(query, hashSecret);
    if (!isValidSignature) {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    // 2. Kiểm tra mã đơn hàng
    const orderCode = query['vnp_TxnRef'];
    const transaction = await this.transactionModel.findOne({ orderCode }).exec();
    if (!transaction) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // 3. Đối chiếu số tiền thanh toán (VNPay gửi amount * 100)
    const vnpAmount = Number(query['vnp_Amount']) / 100;
    if (vnpAmount !== transaction.amount) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    // 4. Kiểm tra trạng thái giao dịch (chống xử lý callback trùng lặp)
    if (transaction.status !== TransactionStatus.PENDING) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // 5. Cập nhật kết quả thanh toán
    const responseCode = query['vnp_ResponseCode'];
    if (responseCode === '00') {
      transaction.status = TransactionStatus.SUCCESS;
      transaction.transactionNo = query['vnp_TransactionNo'] || null;
      transaction.bankCode = query['vnp_BankCode'] || null;
      transaction.cardType = query['vnp_CardType'] || null;
      transaction.payDate = query['vnp_PayDate'] || null;
      transaction.vnpResponseCode = responseCode;
      await transaction.save();

      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      transaction.status = TransactionStatus.FAILED;
      transaction.transactionNo = query['vnp_TransactionNo'] || null;
      transaction.vnpResponseCode = responseCode;
      await transaction.save();

      return { RspCode: '00', Message: 'Confirm Success' };
    }
  }

  /**
   * Lấy chi tiết thông tin giao dịch theo mã orderCode (dành cho Frontend hiển thị)
   */
  async getTransactionByOrderCode(orderCode: string, queryParams?: Record<string, any>) {
    const transaction = await this.transactionModel
      .findOne({ orderCode })
      .populate('packageId', 'name')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch với mã này');
    }

    // Nếu giao dịch đang PENDING và người dùng chuyển đến có kèm tham số VNPay hợp lệ
    if (transaction.status === TransactionStatus.PENDING && queryParams && queryParams.vnp_SecureHash) {
      const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || '';
      const isValid = verifyVnpaySignature(queryParams, hashSecret);
      if (isValid) {
        const responseCode = queryParams.vnp_ResponseCode;
        if (responseCode === '00') {
          transaction.status = TransactionStatus.SUCCESS;
          transaction.transactionNo = queryParams.vnp_TransactionNo || null;
          transaction.bankCode = queryParams.vnp_BankCode || null;
          transaction.cardType = queryParams.vnp_CardType || null;
          transaction.payDate = queryParams.vnp_PayDate || null;
          transaction.vnpResponseCode = responseCode;
          await transaction.save();
        } else {
          transaction.status = TransactionStatus.FAILED;
          transaction.transactionNo = queryParams.vnp_TransactionNo || null;
          transaction.vnpResponseCode = responseCode;
          await transaction.save();
        }
      }
    }

    // Nếu giao dịch đang PENDING và đã quá 15 phút mà không có xác nhận từ VNPay -> tự động đánh dấu hết hạn (FAILED)
    if (transaction.status === TransactionStatus.PENDING && transaction.createdAt) {
      const isExpired = Date.now() - new Date(transaction.createdAt).getTime() > 15 * 60 * 1000;
      if (isExpired) {
        transaction.status = TransactionStatus.FAILED;
        transaction.vnpResponseCode = 'EXPIRED';
        await transaction.save();
      }
    }

    const pkg = transaction.packageId as unknown as CoinPackageDocument;

    return {
      orderCode: transaction.orderCode,
      packageName: pkg ? pkg.name : 'Gói Nạp Xu',
      amount: transaction.amount,
      coinAmount: transaction.coinAmount,
      bonusCoin: transaction.bonusCoin,
      totalCoin: transaction.totalCoin,
      status: transaction.status,
      transactionNo: transaction.transactionNo,
      bankCode: transaction.bankCode,
      payDate: transaction.payDate,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  /**
   * Lấy danh sách giao dịch cho Admin (phân trang, lọc theo trạng thái, tìm kiếm, thống kê)
   */
  async adminGetTransactions(dto: QueryTransactionsDto) {
    // Tự động chuyển các đơn PENDING quá 15 phút thành FAILED (Hết hạn phiên thanh toán)
    await this.transactionModel.updateMany(
      {
        status: TransactionStatus.PENDING,
        createdAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) },
      },
      {
        $set: {
          status: TransactionStatus.FAILED,
          vnpResponseCode: 'EXPIRED',
        },
      },
    );

    const page = Math.max(1, dto.page || 1);
    const limit = Math.max(1, Math.min(100, dto.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (dto.status) {
      filter.status = dto.status;
    }

    if (dto.search && dto.search.trim()) {
      const searchKeyword = dto.search.trim();
      const regex = new RegExp(searchKeyword, 'i');

      const matchingUsers = await this.userModel
        .find({
          $or: [{ displayName: regex }, { email: regex }, { username: regex }],
        })
        .select('_id')
        .lean()
        .exec();

      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { orderCode: regex },
        { transactionNo: regex },
        ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : []),
      ];
    }

    const sortField = dto.sortBy || 'createdAt';
    const sortDirection = dto.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'displayName email avatarUrl username')
        .populate('packageId', 'name')
        .lean()
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
    ]);

    // Thống kê nhanh toàn bộ hệ thống
    const statsAgg = await this.transactionModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalCoin: { $sum: '$totalCoin' },
        },
      },
    ]);

    let totalRevenue = 0;
    let totalTransactions = 0;
    let successCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let totalCoinSold = 0;

    for (const group of statsAgg) {
      totalTransactions += group.count;
      if (group._id === TransactionStatus.SUCCESS) {
        successCount = group.count;
        totalRevenue = group.totalAmount;
        totalCoinSold = group.totalCoin;
      } else if (group._id === TransactionStatus.PENDING) {
        pendingCount = group.count;
      } else if (group._id === TransactionStatus.FAILED) {
        failedCount = group.count;
      }
    }

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalRevenue,
        totalTransactions,
        successCount,
        pendingCount,
        failedCount,
        totalCoinSold,
      },
    };
  }
}
