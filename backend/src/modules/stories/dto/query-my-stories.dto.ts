import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { StoryStatus } from '../schemas/story.schema.js';

export class QueryMyStoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: StoryStatus,
    description: 'Lọc theo trạng thái truyện (DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED)',
  })
  @IsOptional()
  @IsEnum(StoryStatus, { message: 'Trạng thái truyện không hợp lệ' })
  status?: StoryStatus;

  @ApiPropertyOptional({
    example: 'Vũ Động Càn Khôn',
    description: 'Từ khóa tìm kiếm theo tên hoặc slug truyện',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @ApiPropertyOptional({
    example: 'updatedAt',
    description: 'Trường sắp xếp (updatedAt, createdAt, title, viewCount, chapterCount)',
    default: 'updatedAt',
  })
  @IsOptional()
  @IsIn(['updatedAt', 'createdAt', 'title', 'viewCount', 'chapterCount'], {
    message: 'Trường sắp xếp không hợp lệ',
  })
  sortBy?: string = 'updatedAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Thứ tự sắp xếp (asc hoặc desc)',
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Thứ tự sắp xếp phải là asc hoặc desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
