import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminRejectChapterDto {
  @ApiProperty({
    example: 'Nội dung chứa từ ngữ vi phạm quy định cộng đồng hoặc trùng lặp với chương trước',
    description: 'Lý do từ chối/hủy duyệt chương truyện',
  })
  @IsNotEmpty({ message: 'Vui lòng cung cấp lý do từ chối' })
  @IsString({ message: 'Lý do từ chối phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Lý do từ chối tối đa 1000 ký tự' })
  reason: string;
}
