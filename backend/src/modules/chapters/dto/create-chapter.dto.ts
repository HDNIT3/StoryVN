import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export enum ChapterAction {
  DRAFT = 'DRAFT',
  SUBMIT = 'SUBMIT',
  WITHDRAW = 'WITHDRAW',
  DISCARD_UPDATE = 'DISCARD_UPDATE',
}

export class CreateChapterDto {
  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'ID tác phẩm mà chương này trực thuộc',
  })
  @IsNotEmpty({ message: 'storyId không được để trống' })
  @IsMongoId({ message: 'storyId phải là ObjectId hợp lệ' })
  storyId: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Số thứ tự chương (nếu không truyền sẽ tự động gán chương tiếp theo)',
  })
  @IsOptional()
  @IsInt({ message: 'chapterNumber phải là số nguyên' })
  @Min(1, { message: 'chapterNumber phải lớn hơn hoặc bằng 1' })
  chapterNumber?: number;

  @ApiProperty({
    example: 'Chương 1: Khởi đầu mới',
    description: 'Tiêu đề chương',
  })
  @IsNotEmpty({ message: 'Tiêu đề chương không được để trống' })
  @IsString({ message: 'Tiêu đề chương phải là chuỗi' })
  @Length(1, 255, { message: 'Tiêu đề chương phải từ 1 đến 255 ký tự' })
  title: string;

  @ApiProperty({
    example: 'Nội dung chi tiết của chương truyện...',
    description: 'Nội dung chương',
  })
  @IsNotEmpty({ message: 'Nội dung chương không được để trống' })
  @IsString({ message: 'Nội dung chương phải là chuỗi' })
  content: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Chương có miễn phí không (mặc định: true)',
  })
  @IsOptional()
  @IsBoolean({ message: 'isFree phải là kiểu boolean' })
  isFree?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Giá xu mở khóa chương (bằng 0 nếu miễn phí, > 0 nếu trả phí)',
  })
  @IsOptional()
  @IsInt({ message: 'coinPrice phải là số nguyên' })
  @Min(0, { message: 'coinPrice không được là số âm' })
  coinPrice?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Ràng buộc mua chương trước (nếu là chương trả phí)',
  })
  @IsOptional()
  @IsBoolean({ message: 'requirePreviousChapter phải là kiểu boolean' })
  requirePreviousChapter?: boolean;

  @ApiPropertyOptional({
    enum: ChapterAction,
    default: ChapterAction.DRAFT,
    description: 'Hành động: DRAFT (lưu nháp) hoặc SUBMIT (gửi duyệt ngay)',
  })
  @IsOptional()
  @IsEnum(ChapterAction, { message: 'action phải là DRAFT hoặc SUBMIT' })
  action?: ChapterAction;

  @ApiPropertyOptional({
    example: '2026-10-20T08:00:00.000Z',
    description: 'Ngày giờ lên lịch hiển thị chương cho độc giả (ISO 8601). Nếu null, hiển thị ngay khi được duyệt.',
  })
  @IsOptional()
  @IsDateString({}, { message: 'scheduledAt phải là chuỗi ngày giờ hợp lệ (ISO 8601)' })
  scheduledAt?: string;
}
