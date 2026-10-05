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
import { StoryStatus, StoryVisibility } from '../schemas/story.schema.js';

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
    description: 'URL ảnh bìa',
  })
  @IsOptional()
  @IsString({ message: 'coverUrl phải là chuỗi' })
  coverUrl?: string;

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
}
