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

  @ApiPropertyOptional({
    description: 'Giới thiệu bản thân',
  })
  @IsOptional()
  @IsString()
  @Length(0, 300, { message: 'Giới thiệu bản thân tối đa 300 ký tự' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'URL ảnh bìa trang cá nhân',
  })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({
    description: 'URL ảnh đại diện',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
