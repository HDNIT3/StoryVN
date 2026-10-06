import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AppealStoryDto {
  @ApiProperty({
    example: 'Dạ em xin đính chính là văn án và ảnh bìa đã tuân thủ quy chuẩn nội dung, nhờ Ban quản trị xem xét lại giúp em ạ.',
    description: 'Nội dung phản hồi / giải trình khiếu nại của tác giả khi bị từ chối duyệt',
  })
  @IsNotEmpty({ message: 'Nội dung phản hồi không được để trống' })
  @IsString({ message: 'Nội dung phản hồi phải là chuỗi ký tự' })
  @MinLength(10, { message: 'Nội dung phản hồi tối thiểu 10 ký tự' })
  @MaxLength(1000, { message: 'Nội dung phản hồi tối đa 1000 ký tự' })
  feedback: string;
}
