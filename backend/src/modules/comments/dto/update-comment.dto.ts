import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ description: 'Nội dung bình luận đã cập nhật', maxLength: 1000, example: 'Nội dung chỉnh sửa...' })
  @IsString({ message: 'Nội dung bình luận phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @MaxLength(1000, { message: 'Nội dung bình luận tối đa 1000 ký tự' })
  content: string;
}

