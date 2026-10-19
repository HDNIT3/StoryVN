import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export enum ReadingStatusFilter {
  READING = 'reading',
  COMPLETED = 'completed',
}

export enum ReadingHistorySortOption {
  LAST_READ = 'lastReadAt',
  PROGRESS = 'progress',
  TITLE = 'title',
}

export class QueryReadingHistoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tên hoặc slug truyện',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  @ApiPropertyOptional({
    description:
      'Lọc theo thể loại: truyền slug (vd: "do-thi") hoặc ObjectId của thể loại',
  })
  @IsOptional()
  @IsString({ message: 'Thể loại phải là chuỗi' })
  genre?: string;

  @ApiPropertyOptional({
    enum: ReadingStatusFilter,
    description:
      'Trạng thái đọc: reading (đang đọc), completed (đã đọc hết số chương hiện có)',
  })
  @IsOptional()
  @IsEnum(ReadingStatusFilter, { message: 'Trạng thái đọc không hợp lệ' })
  status?: ReadingStatusFilter;

  @ApiPropertyOptional({
    example: 10,
    description: 'Chỉ lấy truyện đã đọc số chương >= giá trị này',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'minChapterNumber phải là số nguyên' })
  @Min(1, { message: 'minChapterNumber tối thiểu là 1' })
  minChapterNumber?: number;

  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Lọc theo thời điểm đọc (createdAt), từ ngày (ISO 8601)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'from phải là chuỗi ngày giờ hợp lệ (ISO 8601)' })
  from?: string;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.999Z',
    description: 'Lọc theo thời điểm đọc (createdAt), đến ngày (ISO 8601)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'to phải là chuỗi ngày giờ hợp lệ (ISO 8601)' })
  to?: string;

  @ApiPropertyOptional({
    enum: ReadingHistorySortOption,
    default: ReadingHistorySortOption.LAST_READ,
    description:
      'Sắp xếp: lastReadAt (mới đọc nhất), progress (% tiến độ), title (tên truyện)',
  })
  @IsOptional()
  @IsEnum(ReadingHistorySortOption, {
    message: 'Tiêu chí sắp xếp không hợp lệ',
  })
  sortBy?: ReadingHistorySortOption = ReadingHistorySortOption.LAST_READ;
}
