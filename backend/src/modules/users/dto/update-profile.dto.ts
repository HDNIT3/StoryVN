import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Nguyễn Văn A',
    description: 'Tên hiển thị của người dùng (2 - 50 ký tự)',
  })
  @IsOptional()
  @IsString({ message: 'Tên hiển thị phải là chuỗi' })
  @Length(2, 50, { message: 'Tên hiển thị phải từ 2 đến 50 ký tự' })
  displayName?: string;
}
