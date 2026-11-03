import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, PaginatedResult } from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { CreateCoinPackageDto } from '../dto/create-coin-package.dto.js';
import { QueryCoinPackageDto } from '../dto/query-coin-package.dto.js';
import { UpdateCoinPackageDto } from '../dto/update-coin-package.dto.js';
import { CoinPackage, CoinPackageDocument } from '../schemas/coin-package.schema.js';

@Injectable()
export class CoinPackagesService {
  constructor(
    @InjectModel(CoinPackage.name)
    private readonly coinPackageModel: Model<CoinPackageDocument>,
  ) { }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }
  }

  async create(dto: CreateCoinPackageDto): Promise<CoinPackageDocument> {
    const trimmedName = dto.name.trim();

    // Kiểm tra tên trùng lặp (không phân biệt hoa thường)
    const existingName = await this.coinPackageModel.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (existingName) {
      throw new ConflictException(ErrorCode.COIN_PACKAGE_NAME_EXISTS);
    }

    const coinAmount = dto.coinAmount;
    const bonusCoin = dto.bonusCoin ?? 0;
    const totalCoin = coinAmount + bonusCoin;

    // Xử lý thứ tự hiển thị: bắt đầu từ 1, không trùng lặp
    let targetOrder = dto.sortOrder && dto.sortOrder >= 1 ? dto.sortOrder : 0;
    if (!targetOrder) {
      const maxPkg = await this.coinPackageModel.findOne().sort({ sortOrder: -1 }).exec();
      targetOrder = maxPkg && maxPkg.sortOrder ? maxPkg.sortOrder + 1 : 1;
    } else {
      // Đẩy các gói có sortOrder >= targetOrder lên 1 vị trí để tránh trùng
      await this.coinPackageModel.updateMany(
        { sortOrder: { $gte: targetOrder } },
        { $inc: { sortOrder: 1 } },
      );
    }

    const coinPackage = new this.coinPackageModel({
      name: trimmedName,
      description: dto.description?.trim() || null,
      price: dto.price,
      coinAmount,
      bonusCoin,
      totalCoin,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isFeatured: dto.isFeatured !== undefined ? dto.isFeatured : false,
      sortOrder: targetOrder,
    });

    return coinPackage.save();
  }

  async findAll(
    query: QueryCoinPackageDto,
  ): Promise<PaginatedResult<CoinPackage> | { items: CoinPackage[] }> {
    const filter: Record<string, any> = {};

    if (query.search?.trim()) {
      filter.name = { $regex: query.search.trim(), $options: 'i' };
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured;
    }

    const sortBy = query.sortBy || 'sortOrder';
    const sortDir = query.sortOrder === 'desc' ? -1 : 1;
    const sortOption: Record<string, 1 | -1> = { [sortBy]: sortDir };

    if (query.all) {
      const items = await this.coinPackageModel.find(filter).sort(sortOption).exec();
      return { items };
    }

    const total = await this.coinPackageModel.countDocuments(filter);
    const items = await this.coinPackageModel
      .find(filter)
      .sort(sortOption)
      .skip(query.skip)
      .limit(query.limit)
      .exec();

    return {
      items,
      pagination: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async findActivePackages(): Promise<CoinPackage[]> {
    return this.coinPackageModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, price: 1 })
      .exec();
  }

  async findById(id: string): Promise<CoinPackageDocument> {
    this.validateObjectId(id);
    const pkg = await this.coinPackageModel.findById(id).exec();
    if (!pkg) {
      throw new NotFoundException(ErrorCode.COIN_PACKAGE_NOT_FOUND);
    }
    return pkg;
  }

  async update(id: string, dto: UpdateCoinPackageDto): Promise<CoinPackageDocument> {
    this.validateObjectId(id);
    const pkg = await this.findById(id);

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      const existingName = await this.coinPackageModel.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      });
      if (existingName) {
        throw new ConflictException(ErrorCode.COIN_PACKAGE_NAME_EXISTS);
      }
      pkg.name = trimmedName;
    }

    if (dto.description !== undefined) {
      pkg.description = dto.description?.trim() || null;
    }

    if (dto.price !== undefined) {
      pkg.price = dto.price;
    }

    const coinAmount = dto.coinAmount !== undefined ? dto.coinAmount : pkg.coinAmount;
    const bonusCoin = dto.bonusCoin !== undefined ? dto.bonusCoin : pkg.bonusCoin;

    pkg.coinAmount = coinAmount;
    pkg.bonusCoin = bonusCoin;
    pkg.totalCoin = coinAmount + bonusCoin;

    if (dto.isActive !== undefined) {
      pkg.isActive = dto.isActive;
    }

    if (dto.isFeatured !== undefined) {
      pkg.isFeatured = dto.isFeatured;
    }

    if (dto.sortOrder !== undefined && dto.sortOrder >= 1) {
      const targetOrder = dto.sortOrder;
      const currentOrder = pkg.sortOrder;

      if (targetOrder !== currentOrder) {
        // Hoán đổi vị trí với gói nạp đang giữ targetOrder (nếu có)
        const existingAtTarget = await this.coinPackageModel.findOne({
          _id: { $ne: id },
          sortOrder: targetOrder,
        });

        if (existingAtTarget) {
          existingAtTarget.sortOrder = currentOrder;
          await existingAtTarget.save();
        }
        pkg.sortOrder = targetOrder;
      }
    }

    return pkg.save();
  }

  async toggleStatus(id: string): Promise<CoinPackageDocument> {
    this.validateObjectId(id);
    const pkg = await this.findById(id);
    pkg.isActive = !pkg.isActive;
    return pkg.save();
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.validateObjectId(id);
    const pkg = await this.findById(id);
    const deletedOrder = pkg.sortOrder;
    const result = await this.coinPackageModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(ErrorCode.COIN_PACKAGE_NOT_FOUND);
    }

    // Dồn các gói phía sau lên 1 vị trí để thứ tự luôn liền mạch bắt đầu từ 1
    if (deletedOrder) {
      await this.coinPackageModel.updateMany(
        { sortOrder: { $gt: deletedOrder } },
        { $inc: { sortOrder: -1 } },
      );
    }

    return {
      success: true,
      message: 'Xóa gói nạp thành công',
    };
  }

  async seedDefault(): Promise<{ createdCount: number; skippedCount: number }> {
    const DEFAULT_PACKAGES = [
      {
        name: 'Gói Tân Thủ',
        description: null,
        price: 10000,
        coinAmount: 100,
        bonusCoin: 0,
        totalCoin: 100,
        isActive: true,
        isFeatured: false,
        sortOrder: 1,
      },
      {
        name: 'Gói Tiết Kiệm',
        description: null,
        price: 20000,
        coinAmount: 200,
        bonusCoin: 20,
        totalCoin: 220,
        isActive: true,
        isFeatured: false,
        sortOrder: 2,
      },
      {
        name: 'Gói Phổ Thông',
        description: null,
        price: 50000,
        coinAmount: 500,
        bonusCoin: 100,
        totalCoin: 600,
        isActive: true,
        isFeatured: true,
        sortOrder: 3,
      },
      {
        name: 'Gói VIP',
        description: null,
        price: 100000,
        coinAmount: 1000,
        bonusCoin: 250,
        totalCoin: 1250,
        isActive: true,
        isFeatured: true,
        sortOrder: 4,
      },
      {
        name: 'Gói Chí Tôn',
        description: null,
        price: 200000,
        coinAmount: 2000,
        bonusCoin: 600,
        totalCoin: 2600,
        isActive: true,
        isFeatured: false,
        sortOrder: 5,
      },
      {
        name: 'Gói Thần Vương',
        description: null,
        price: 500000,
        coinAmount: 5000,
        bonusCoin: 1800,
        totalCoin: 6800,
        isActive: true,
        isFeatured: false,
        sortOrder: 6,
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const pkg of DEFAULT_PACKAGES) {
      const exists = await this.coinPackageModel.findOne({ name: pkg.name });
      if (!exists) {
        await this.coinPackageModel.create(pkg);
        createdCount++;
      } else {
        exists.coinAmount = pkg.coinAmount;
        exists.bonusCoin = pkg.bonusCoin;
        exists.totalCoin = pkg.totalCoin;
        exists.price = pkg.price;
        exists.description = null;
        await exists.save();
        skippedCount++;
      }
    }

    return { createdCount, skippedCount };
  }
}
