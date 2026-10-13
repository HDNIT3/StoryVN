import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  Min,
  ValidateNested,
} from 'class-validator';

export class ChapterOrderItem {
  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'ID chương',
  })
  @IsNotEmpty({ message: 'chapterId không được để trống' })
  @IsMongoId({ message: 'chapterId phải là ObjectId hợp lệ' })
  chapterId: string;

  @ApiProperty({
    example: 1,
    description: 'Thứ tự mới của chương',
  })
  @IsInt({ message: 'chapterNumber phải là số nguyên' })
  @Min(1, { message: 'chapterNumber phải lớn hơn hoặc bằng 1' })
  chapterNumber: number;
}

export class ReorderChaptersDto {
  @ApiProperty({
    type: [ChapterOrderItem],
    description: 'Danh sách các chương và thứ tự mới',
  })
  @IsArray({ message: 'orders phải là một mảng' })
  @ArrayMinSize(1, { message: 'orders phải chứa ít nhất 1 phần tử' })
  @ValidateNested({ each: true })
  @Type(() => ChapterOrderItem)
  orders: ChapterOrderItem[];
}
