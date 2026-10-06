import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { StoryStatus } from '../schemas/story.schema.js';

export class QueryAdminStoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái kiểm duyệt (PENDING_REVIEW, PUBLISHED, REJECTED, DRAFT hoặc ALL)',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tiêu đề hoặc slug truyện',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Chỉ lọc các truyện có phản hồi / khiếu nại từ tác giả (true/false)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasAppeal?: boolean;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'appealedAt', 'title'],
    default: 'updatedAt',
    description: 'Trường sắp xếp',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'appealedAt', 'title'])
  sortBy?: string = 'updatedAt';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Thứ tự sắp xếp',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
