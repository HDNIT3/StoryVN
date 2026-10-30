import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ChapterAction } from './create-chapter.dto.js';

export class UpdateChapterDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Số thứ tự chương',
  })
  @IsOptional()
  @IsInt({ message: 'chapterNumber phải là số nguyên' })
  @Min(1, { message: 'chapterNumber phải lớn hơn hoặc bằng 1' })
  chapterNumber?: number;

  @ApiPropertyOptional({
    example: 'Chương 1: Tiêu đề cập nhật',
    description: 'Tiêu đề chương',
  })
  @IsOptional()
  @IsString({ message: 'Tiêu đề chương phải là chuỗi' })
  @Length(1, 255, { message: 'Tiêu đề chương phải từ 1 đến 255 ký tự' })
  title?: string;

  @ApiPropertyOptional({
    example: 'Nội dung cập nhật mới...',
    description: 'Nội dung chương',
  })
  @IsOptional()
  @IsString({ message: 'Nội dung chương phải là chuỗi' })
  content?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Chương có miễn phí không',
  })
  @IsOptional()
  @IsBoolean({ message: 'isFree phải là kiểu boolean' })
  isFree?: boolean;

  @ApiPropertyOptional({
    example: 10,
    description: 'Giá xu mở khóa',
  })
  @IsOptional()
  @IsInt({ message: 'coinPrice phải là số nguyên' })
  @Min(0, { message: 'coinPrice không được là số âm' })
  coinPrice?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Ràng buộc mua chương trước',
  })
  @IsOptional()
  @IsBoolean({ message: 'requirePreviousChapter phải là kiểu boolean' })
  requirePreviousChapter?: boolean;

  @ApiPropertyOptional({
    enum: ChapterAction,
    description:
      'Hành động: DRAFT (lưu nháp), SUBMIT (gửi duyệt), WITHDRAW (rút bản chờ duyệt), DISCARD_UPDATE (bỏ bản nháp)',
  })
  @IsOptional()
  @IsEnum(ChapterAction, {
    message: 'action phải là DRAFT, SUBMIT, WITHDRAW hoặc DISCARD_UPDATE',
  })
  action?: ChapterAction;

  @ApiPropertyOptional({
    example: '2026-10-20T08:00:00.000Z',
    description: 'Ngày giờ lên lịch hiển thị chương cho độc giả (ISO string)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'scheduledAt phải là định dạng ISO date string' })
  scheduledAt?: string | null;
}
