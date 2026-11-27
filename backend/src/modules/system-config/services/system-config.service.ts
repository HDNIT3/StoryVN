import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DEFAULT_FOOTER_CONFIG } from '../data/footer-config.data.js';
import { CreateSystemConfigDto } from '../dto/create-system-config.dto.js';
import { UpdateSystemConfigDto } from '../dto/update-system-config.dto.js';
import type { SystemConfig } from '../schemas/system-config.schema.js';

@Injectable()
export class SystemConfigService {
  constructor(@InjectModel('SystemConfig') private readonly configs: Model<SystemConfig>) {}

  list() {
    return this.configs.find().select('-_id').sort({ config_key: 1 }).lean().exec();
  }

  async getFooter() {
    const keys = DEFAULT_FOOTER_CONFIG.map(({ config_key }) => config_key);
    const entries = await this.configs
      .find({ _id: { $in: keys } })
      .select('config_key config_value -_id')
      .lean()
      .exec();
    return Object.fromEntries(entries.map(({ config_key, config_value }) => [config_key, config_value]));
  }

  async seedFooter(adminId: Types.ObjectId) {
    const updatedAt = new Date();
    await this.configs.bulkWrite(
      DEFAULT_FOOTER_CONFIG.map((entry) => ({
        updateOne: {
          filter: { _id: entry.config_key },
          update: { $setOnInsert: { ...entry, updated_by: adminId, updated_at: updatedAt } },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  async create(dto: CreateSystemConfigDto, adminId: Types.ObjectId) {
    try {
      await this.configs.create({
        _id: dto.config_key,
        config_key: dto.config_key,
        config_value: dto.config_value,
        description: dto.description,
        updated_by: adminId,
        updated_at: new Date(),
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Khóa cấu hình đã tồn tại.');
      }
      throw error;
    }
  }

  async update(key: string, dto: UpdateSystemConfigDto, adminId: Types.ObjectId) {
    const result = await this.configs.updateOne(
      { _id: key },
      {
        $set: {
          config_value: dto.config_value,
          description: dto.description,
          updated_by: adminId,
          updated_at: new Date(),
        },
      },
    ).exec();
    if (!result.matchedCount) {
      throw new NotFoundException('Không tìm thấy tham số cấu hình.');
    }
  }
}
