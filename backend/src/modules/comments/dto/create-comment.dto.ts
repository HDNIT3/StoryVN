import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'ID tác phẩm cần bình luận', example: '651a2b3c4d5e6f7a8b9c0d1e' })
  @IsMongoId({ message: 'ID tác phẩm không hợp lệ' })
  @IsNotEmpty({ message: 'ID tác phẩm là bắt buộc' })
  storyId: string;

  @ApiPropertyOptional({
    description: 'ID chương (để trống hoặc null nếu bình luận ở trang truyện)',
    example: '651a2b3c4d5e6f7a8b9c0d1f',
  })
  @IsOptional()
  @IsMongoId({ message: 'ID chương không hợp lệ' })
  chapterId?: string | null;

  @ApiPropertyOptional({
    description: 'ID bình luận cha (để trống hoặc null nếu là bình luận gốc cấp 1)',
    example: null,
  })
  @IsOptional()
  @IsMongoId({ message: 'ID bình luận cha không hợp lệ' })
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'ID người dùng được trả lời (dùng khi reply bình luận tầng 2)',
    example: '651a2b3c4d5e6f7a8b9c0d1e',
  })
  @IsOptional()
  @IsMongoId({ message: 'ID người dùng được trả lời không hợp lệ' })
  replyToUserId?: string | null;

  @ApiProperty({ description: 'Nội dung bình luận', maxLength: 1000, example: 'Chương này hấp dẫn quá!' })
  @IsString({ message: 'Nội dung bình luận phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @MaxLength(1000, { message: 'Nội dung bình luận tối đa 1000 ký tự' })
  content: string;
}

