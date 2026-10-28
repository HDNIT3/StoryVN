import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { StoryRatingStatus } from '../schemas/story-rating.schema.js';

export enum AdminRatingStatusFilter {
  ALL = 'ALL',
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

export enum AdminRatingSortOrder {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  HIGHEST = 'HIGHEST',
  LOWEST = 'LOWEST',
}

export class AdminQueryRatingsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc trạng thái đánh giá',
    enum: AdminRatingStatusFilter,
    default: AdminRatingStatusFilter.ALL,
  })
  @IsOptional()
  @IsEnum(AdminRatingStatusFilter)
  status?: AdminRatingStatusFilter = AdminRatingStatusFilter.ALL;

  @ApiPropertyOptional({ description: 'Lọc số sao (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm nhận xét hoặc tên người dùng' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID truyện' })
  @IsOptional()
  @IsMongoId({ message: 'ID truyện không hợp lệ' })
  storyId?: string;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: AdminRatingSortOrder,
    default: AdminRatingSortOrder.NEWEST,
  })
  @IsOptional()
  @IsEnum(AdminRatingSortOrder)
  sort?: AdminRatingSortOrder = AdminRatingSortOrder.NEWEST;
}

