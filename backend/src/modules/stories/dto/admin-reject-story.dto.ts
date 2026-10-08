import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminRejectStoryDto {
  @ApiProperty({
    example: 'Nội dung giới thiệu không phù hợp với quy định cộng đồng hoặc ảnh bìa không hợp lệ',
    description: 'Lý do từ chối phê duyệt tác phẩm',
  })
  @IsNotEmpty({ message: 'Vui lòng cung cấp lý do từ chối' })
  @IsString({ message: 'Lý do từ chối phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Lý do từ chối tối đa 1000 ký tự' })
  reason: string;
}
