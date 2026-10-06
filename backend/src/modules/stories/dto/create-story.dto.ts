import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import {
  StoryAgeRating,
  StoryOriginType,
  StoryProgressState,
  StoryStatus,
  StoryVisibility,
} from '../schemas/story.schema.js';

export enum StoryAction {
  DRAFT = 'DRAFT',
  SUBMIT = 'SUBMIT',
}

export class CreateStoryDto {
  @ApiProperty({
    example: 'Vũ Động Càn Khôn',
    description: 'Tên truyện',
  })
  @IsNotEmpty({ message: 'Tên truyện không được để trống' })
  @IsString({ message: 'Tên truyện phải là chuỗi' })
  @Length(2, 200, { message: 'Tên truyện phải từ 2 đến 200 ký tự' })
  title: string;

  @ApiPropertyOptional({
    example: 'vu-dong-can-khon',
    description: 'Chuỗi định danh URL (nếu không cung cấp sẽ tự sinh từ tên truyện)',
  })
  @IsOptional()
  @IsString({ message: 'Slug phải là chuỗi' })
  slug?: string;

  @ApiPropertyOptional({
    example: 'Câu chuyện về cuộc hành trình tu luyện...',
    description: 'Nội dung giới thiệu truyện',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/example/image/upload/v1/cover.jpg',
    description: 'URL ảnh bìa (alias: coverImage)',
  })
  @IsOptional()
  @IsString({ message: 'coverUrl phải là chuỗi' })
  coverUrl?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/example/image/upload/v1/cover.jpg',
    description: 'URL ảnh bìa (alias: coverUrl)',
  })
  @IsOptional()
  @IsString({ message: 'coverImage phải là chuỗi' })
  coverImage?: string;

  @ApiPropertyOptional({
    example: 'Lịch ra chương 3 chương/tuần...',
    description: 'Lời ngỏ của tác giả / Lịch ra chương',
  })
  @IsOptional()
  @IsString({ message: 'Lời ngỏ phải là chuỗi' })
  authorNote?: string;

  @ApiPropertyOptional({
    example: ['660000000000000000000001'],
    description: 'Danh sách ID thể loại tham chiếu genres',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'genreIds phải là mảng' })
  @IsMongoId({ each: true, message: 'Mỗi genreId phải là Mongo ObjectId hợp lệ' })
  genreIds?: string[];

  @ApiPropertyOptional({
    example: ['660000000000000000000002'],
    description: 'Danh sách ID tag tham chiếu tags',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'tagIds phải là mảng' })
  @IsMongoId({ each: true, message: 'Mỗi tagId phải là Mongo ObjectId hợp lệ' })
  tagIds?: string[];

  @ApiPropertyOptional({
    enum: StoryAgeRating,
    default: StoryAgeRating.ALL,
    description: 'Độ tuổi độc giả phù hợp',
  })
  @IsOptional()
  @IsEnum(StoryAgeRating, { message: 'Độ tuổi độc giả không hợp lệ' })
  ageRating?: StoryAgeRating;

  @ApiPropertyOptional({
    enum: StoryProgressState,
    default: StoryProgressState.ONGOING,
    description: 'Tiến độ sáng tác / phát hành',
  })
  @IsOptional()
  @IsEnum(StoryProgressState, { message: 'Tiến độ sáng tác không hợp lệ' })
  progressState?: StoryProgressState;

  @ApiPropertyOptional({
    enum: StoryOriginType,
    default: StoryOriginType.ORIGINAL,
    description: 'Nguồn gốc tác phẩm',
  })
  @IsOptional()
  @IsEnum(StoryOriginType, { message: 'Nguồn gốc tác phẩm không hợp lệ' })
  originType?: StoryOriginType;

  @ApiPropertyOptional({
    enum: StoryStatus,
    default: StoryStatus.DRAFT,
    description: 'Trạng thái truyện',
  })
  @IsOptional()
  @IsEnum(StoryStatus, { message: 'Trạng thái truyện không hợp lệ' })
  status?: StoryStatus;

  @ApiPropertyOptional({
    enum: StoryVisibility,
    default: StoryVisibility.PUBLIC,
    description: 'Chế độ hiển thị',
  })
  @IsOptional()
  @IsEnum(StoryVisibility, { message: 'Chế độ hiển thị không hợp lệ' })
  visibility?: StoryVisibility;

  @ApiPropertyOptional({
    enum: StoryAction,
    default: StoryAction.DRAFT,
    description: 'Hành động: DRAFT (lưu nháp) hoặc SUBMIT (gửi duyệt ngay)',
  })
  @IsOptional()
  @IsEnum(StoryAction, { message: 'Hành động không hợp lệ (chỉ nhận DRAFT hoặc SUBMIT)' })
  action?: StoryAction;
}
