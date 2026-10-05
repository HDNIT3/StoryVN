import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateAuthorProfileDto {
  @ApiPropertyOptional({
    example: 'Nguyên Tác',
    description: 'Bút danh của tác giả',
  })
  @IsOptional()
  @IsString({ message: 'Bút danh phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Bút danh không được để trống' })
  @MinLength(2, { message: 'Bút danh phải có ít nhất 2 ký tự' })
  penName?: string;

  @ApiPropertyOptional({
    example: 'Tiểu sử hoặc giới thiệu tác giả...',
    description: 'Tiểu sử tác giả',
  })
  @IsOptional()
  @IsString({ message: 'Tiểu sử phải là chuỗi ký tự' })
  biography?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL ảnh đại diện tác giả',
  })
  @IsOptional()
  @IsString({ message: 'Avatar URL phải là chuỗi ký tự' })
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://authorblog.vn',
    description: 'Website cá nhân',
  })
  @IsOptional()
  @IsString({ message: 'Website phải là chuỗi ký tự' })
  website?: string;

  @ApiPropertyOptional({
    example: { facebook: 'https://facebook.com/author' },
    description: 'Liên kết mạng xã hội',
  })
  @IsOptional()
  @IsObject({ message: 'Mạng xã hội phải là một object chứa các liên kết' })
  socialLinks?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'Vietcombank',
    description: 'Tên ngân hàng nhận tiền',
  })
  @IsOptional()
  @IsString({ message: 'Tên ngân hàng phải là chuỗi ký tự' })
  bankName?: string;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'Số tài khoản ngân hàng',
  })
  @IsOptional()
  @IsString({ message: 'Số tài khoản ngân hàng phải là chuỗi ký tự' })
  bankAccountNumber?: string;

  @ApiPropertyOptional({
    example: 'NGUYEN VAN A',
    description: 'Tên chủ tài khoản',
  })
  @IsOptional()
  @IsString({ message: 'Tên chủ tài khoản phải là chuỗi ký tự' })
  bankAccountName?: string;
}
