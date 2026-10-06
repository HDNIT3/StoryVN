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
import { DEFAULT_GENRES_DATA } from '../data/default-genres.data.js';
import { CreateGenreDto } from '../dto/create-genre.dto.js';
import { QueryGenreDto } from '../dto/query-genre.dto.js';
import { UpdateGenreDto } from '../dto/update-genre.dto.js';
import { Genre, GenreDocument } from '../schemas/genre.schema.js';

@Injectable()
export class GenresService {
  constructor(
    @InjectModel(Genre.name) private readonly genreModel: Model<GenreDocument>,
  ) {}

  async create(dto: CreateGenreDto): Promise<GenreDocument> {
    const trimmedName = dto.name.trim();
    const slug = dto.slug?.trim() ? toSlug(dto.slug) : toSlug(trimmedName);

    // Kiểm tra trùng tên thể loại (không phân biệt hoa thường)
    const existingName = await this.genreModel.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (existingName) {
      throw new ConflictException(ErrorCode.CATEGORY_NAME_EXISTS);
    }

    // Kiểm tra trùng slug
    const existingSlug = await this.genreModel.findOne({ slug });
    if (existingSlug) {
      throw new ConflictException(ErrorCode.CATEGORY_SLUG_EXISTS);
    }

    const genre = new this.genreModel({
      name: trimmedName,
      slug,
      description: dto.description?.trim() || null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return genre.save();
  }

  async findAll(query: QueryGenreDto): Promise<PaginatedResult<Genre> | { items: Genre[] }> {
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
      const items = await this.genreModel.find(filter).sort(sort).lean();
      return { items: items as Genre[] };
    }

    const [totalItems, items] = await Promise.all([
      this.genreModel.countDocuments(filter),
      this.genreModel
        .find(filter)
        .sort(sort)
        .skip(query.skip)
        .limit(query.limit)
        .lean(),
    ]);

    return {
      items: items as Genre[],
      pagination: buildPaginationMeta(totalItems, query.page, query.limit),
    };
  }

  async findById(id: string): Promise<GenreDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const genre = await this.genreModel.findById(id);
    if (!genre) {
      throw new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND);
    }

    return genre;
  }

  async update(id: string, dto: UpdateGenreDto): Promise<GenreDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const genre = await this.genreModel.findById(id);
    if (!genre) {
      throw new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND);
    }

    if (dto.name) {
      const trimmedName = dto.name.trim();
      const existingName = await this.genreModel.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        _id: { $ne: id },
      });
      if (existingName) {
        throw new ConflictException(ErrorCode.CATEGORY_NAME_EXISTS);
      }
      genre.name = trimmedName;

      // Nếu không chỉ định slug mới, tự sinh lại slug theo name
      if (!dto.slug) {
        const autoSlug = toSlug(trimmedName);
        const existingSlug = await this.genreModel.findOne({
          slug: autoSlug,
          _id: { $ne: id },
        });
        if (!existingSlug) {
          genre.slug = autoSlug;
        }
      }
    }

    if (dto.slug) {
      const slug = toSlug(dto.slug);
      const existingSlug = await this.genreModel.findOne({
        slug,
        _id: { $ne: id },
      });
      if (existingSlug) {
        throw new ConflictException(ErrorCode.CATEGORY_SLUG_EXISTS);
      }
      genre.slug = slug;
    }

    if (dto.description !== undefined) {
      genre.description = dto.description?.trim() || null;
    }

    if (dto.isActive !== undefined) {
      genre.isActive = dto.isActive;
    }

    return genre.save();
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const genre = await this.genreModel.findById(id);
    if (!genre) {
      throw new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND);
    }

    await this.genreModel.findByIdAndDelete(id);
    return {
      success: true,
      message: 'Xóa thể loại thành công',
    };
  }

  async seedDefault(): Promise<{
    total: number;
    createdCount: number;
    skippedCount: number;
    createdItems: Genre[];
  }> {
    let createdCount = 0;
    let skippedCount = 0;
    const createdItems: Genre[] = [];

    for (const item of DEFAULT_GENRES_DATA) {
      const existing = await this.genreModel.findOne({
        $or: [
          { slug: item.slug },
          { name: { $regex: new RegExp(`^${item.name.trim()}$`, 'i') } },
        ],
      });

      if (!existing) {
        const created = await this.genreModel.create(item);
        createdItems.push(created);
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    return {
      total: DEFAULT_GENRES_DATA.length,
      createdCount,
      skippedCount,
      createdItems,
    };
  }
}

