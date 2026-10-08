import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { StoryStatus, StoryVisibility } from '../schemas/story.schema.js';

export class AdminQueryStoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: StoryStatus,
    description: 'Lọc theo trạng thái truyện (DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED). Bỏ trống để lấy tất cả',
  })
  @IsOptional()
  @IsEnum(StoryStatus, { message: 'Trạng thái truyện không hợp lệ' })
  status?: StoryStatus;

  @ApiPropertyOptional({
    enum: StoryVisibility,
    description: 'Lọc theo chế độ hiển thị (PUBLIC hoặc PRIVATE). Bỏ trống để lấy tất cả',
  })
  @IsOptional()
  @IsEnum(StoryVisibility, { message: 'Chế độ hiển thị không hợp lệ' })
  visibility?: StoryVisibility;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên truyện, slug hoặc thông tin tác giả',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo ID thể loại truyện',
  })
  @IsOptional()
  @IsString()
  genreId?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Trường sắp xếp (createdAt, updatedAt, title, viewCount, chapterCount)',
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'title', 'viewCount', 'chapterCount'], {
    message: 'Trường sắp xếp không hợp lệ',
  })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Thứ tự sắp xếp (asc hoặc desc)',
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Thứ tự sắp xếp phải là asc hoặc desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
