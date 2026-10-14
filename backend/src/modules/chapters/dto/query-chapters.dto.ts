import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { ChapterStatus } from '../schemas/chapter.schema.js';

export class QueryChaptersDto {
  @ApiPropertyOptional({
    description: 'ID tác phẩm cần lấy danh sách chương',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsNotEmpty({ message: 'storyId không được để trống' })
  @IsMongoId({ message: 'storyId phải là ObjectId hợp lệ' })
  storyId: string;

  @ApiPropertyOptional({
    enum: ChapterStatus,
    description: 'Lọc theo trạng thái chương (DRAFT, PENDING_REVIEW, PUBLISHED, ...)',
  })
  @IsOptional()
  @IsEnum(ChapterStatus, { message: 'status không hợp lệ' })
  status?: ChapterStatus;

  @ApiPropertyOptional({
    example: 'chapterNumber',
    description: 'Trường sắp xếp: chapterNumber, createdAt, updatedAt, viewCount',
  })
  @IsOptional()
  @IsIn(['chapterNumber', 'createdAt', 'updatedAt', 'viewCount'], {
    message: 'sortBy phải là chapterNumber, createdAt, updatedAt hoặc viewCount',
  })
  sortBy?: string = 'chapterNumber';

  @ApiPropertyOptional({
    example: 'asc',
    description: 'Thứ tự sắp xếp: asc hoặc desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'order phải là asc hoặc desc' })
  order?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({
    example: 1,
    description: 'Trang hiện tại (tùy chọn)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page phải lớn hơn hoặc bằng 1' })
  page?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Số lượng chương mỗi trang (tùy chọn)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit phải lớn hơn hoặc bằng 1' })
  limit?: number;
}
