import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { DateRangeQueryDto } from '../../../common/dto/date-range.dto.js';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { StoryStatus, StoryVisibility } from '../schemas/story.schema.js';

export class QueryMyStoriesDto extends IntersectionType(PaginationQueryDto, DateRangeQueryDto) {
  get skip(): number { return (this.page - 1) * this.limit; }

  @ApiPropertyOptional({
    enum: StoryStatus,
    description: 'Lọc theo trạng thái truyện (DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED)',
  })
  @IsOptional()
  @IsEnum(StoryStatus, { message: 'Trạng thái truyện không hợp lệ' })
  status?: StoryStatus;

  @ApiPropertyOptional({ enum: StoryVisibility })
  @IsOptional()
  @IsEnum(StoryVisibility)
  visibility?: StoryVisibility;

  @ApiPropertyOptional({
    example: 'Vũ Động Càn Khôn',
    description: 'Từ khóa tìm kiếm theo tên hoặc slug truyện',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @ApiPropertyOptional({
    example: 'updatedAt',
    description:
      'Trường sắp xếp (updatedAt, createdAt, title, viewCount, viewsToday, viewsWeek, viewsMonth, viewsYear, chapterCount)',
    default: 'updatedAt',
  })
  @IsOptional()
  @IsIn(
    [
      'updatedAt',
      'createdAt',
      'title',
      'viewCount',
      'viewsToday',
      'viewsWeek',
      'viewsMonth',
      'viewsYear',
      'chapterCount',
    ],
    {
      message: 'Trường sắp xếp không hợp lệ',
    },
  )
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
