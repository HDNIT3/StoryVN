import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { ChapterStatus } from '../schemas/chapter.schema.js';

export class AdminQueryChaptersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc danh sách chương theo ID tác phẩm',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  @IsOptional()
  @IsMongoId({ message: 'Mã truyện không hợp lệ' })
  storyId?: string;

  @ApiPropertyOptional({
    enum: ChapterStatus,
    description: 'Lọc theo trạng thái chương (PENDING_REVIEW, PUBLISHED, DRAFT, REJECTED, HIDDEN). Bỏ trống để lấy tất cả',
  })
  @IsOptional()
  @IsEnum(ChapterStatus, { message: 'Trạng thái chương không hợp lệ' })
  status?: ChapterStatus;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tiêu đề chương hoặc tên tác phẩm',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Trường sắp xếp (createdAt, updatedAt, chapterNumber, title, viewCount)',
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'chapterNumber', 'title', 'viewCount'], {
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
