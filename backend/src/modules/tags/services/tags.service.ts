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
import { toSlug } from '../../../common/utils/slug.util.js';
import { DEFAULT_TAGS_DATA } from '../data/default-tags.data.js';
import { CreateTagDto } from '../dto/create-tag.dto.js';
import { QueryTagDto } from '../dto/query-tag.dto.js';
import { UpdateTagDto } from '../dto/update-tag.dto.js';
import { Tag, TagDocument } from '../schemas/tag.schema.js';

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(Tag.name) private readonly tagModel: Model<TagDocument>,
  ) {}

  async create(dto: CreateTagDto): Promise<TagDocument> {
    const trimmedName = dto.name.trim();
    const slug = dto.slug?.trim() ? toSlug(dto.slug) : toSlug(trimmedName);

    // Kiểm tra trùng tên tag (không phân biệt hoa thường)
    const existingName = await this.tagModel.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (existingName) {
      throw new ConflictException(ErrorCode.TAG_NAME_EXISTS);
    }

    // Kiểm tra trùng slug
    const existingSlug = await this.tagModel.findOne({ slug });
    if (existingSlug) {
      throw new ConflictException(ErrorCode.TAG_SLUG_EXISTS);
    }

    const tag = new this.tagModel({
      name: trimmedName,
      slug,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return tag.save();
  }

  async findAll(query: QueryTagDto): Promise<PaginatedResult<Tag> | { items: Tag[] }> {
    const filter: Record<string, any> = {};

    if (query.search) {
      const searchRegex = { $regex: query.search.trim(), $options: 'i' };
      filter.$or = [{ name: searchRegex }, { slug: searchRegex }];
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortField = query.sortBy || 'createdAt';
    const sort: Record<string, any> = { [sortField]: sortOrder };

    if (query.all) {
      const items = await this.tagModel.find(filter).sort(sort).lean();
      return { items: items as Tag[] };
    }

    const [totalItems, items] = await Promise.all([
      this.tagModel.countDocuments(filter),
      this.tagModel
        .find(filter)
        .sort(sort)
        .skip(query.skip)
        .limit(query.limit)
        .lean(),
    ]);

    return {
      items: items as Tag[],
      pagination: buildPaginationMeta(totalItems, query.page, query.limit),
    };
  }

  async findById(id: string): Promise<TagDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const tag = await this.tagModel.findById(id);
    if (!tag) {
      throw new NotFoundException(ErrorCode.TAG_NOT_FOUND);
    }

    return tag;
  }

  async update(id: string, dto: UpdateTagDto): Promise<TagDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const tag = await this.tagModel.findById(id);
    if (!tag) {
      throw new NotFoundException(ErrorCode.TAG_NOT_FOUND);
    }

    if (dto.name) {
      const trimmedName = dto.name.trim();
      const existingName = await this.tagModel.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        _id: { $ne: id },
      });
      if (existingName) {
        throw new ConflictException(ErrorCode.TAG_NAME_EXISTS);
      }
      tag.name = trimmedName;

      if (!dto.slug) {
        const autoSlug = toSlug(trimmedName);
        const existingSlug = await this.tagModel.findOne({
          slug: autoSlug,
          _id: { $ne: id },
        });
        if (!existingSlug) {
          tag.slug = autoSlug;
        }
      }
    }

    if (dto.slug) {
      const slug = toSlug(dto.slug);
      const existingSlug = await this.tagModel.findOne({
        slug,
        _id: { $ne: id },
      });
      if (existingSlug) {
        throw new ConflictException(ErrorCode.TAG_SLUG_EXISTS);
      }
      tag.slug = slug;
    }

    if (dto.isActive !== undefined) {
      tag.isActive = dto.isActive;
    }

    return tag.save();
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const tag = await this.tagModel.findById(id);
    if (!tag) {
      throw new NotFoundException(ErrorCode.TAG_NOT_FOUND);
    }

    await this.tagModel.findByIdAndDelete(id);
    return {
      success: true,
      message: 'Xóa tag thành công',
    };
  }

  async seedDefault(): Promise<{
    total: number;
    createdCount: number;
    skippedCount: number;
    createdItems: Tag[];
  }> {
    let createdCount = 0;
    let skippedCount = 0;
    const createdItems: Tag[] = [];

    for (const item of DEFAULT_TAGS_DATA) {
      const existing = await this.tagModel.findOne({
        $or: [
          { slug: item.slug },
          { name: { $regex: new RegExp(`^${item.name.trim()}$`, 'i') } },
        ],
      });

      if (!existing) {
        const created = await this.tagModel.create(item);
        createdItems.push(created);
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    return {
      total: DEFAULT_TAGS_DATA.length,
      createdCount,
      skippedCount,
      createdItems,
    };
  }
}

