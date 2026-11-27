import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email đăng ký tài khoản',
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    example: 'MatKhau123@#',
    description: 'Mật khẩu tài khoản (tối thiểu 6 ký tự)',
  })
  @IsString({ message: 'Password phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Password không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Tên hiển thị người dùng',
  })
  @IsString({ message: 'Tên hiển thị phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên hiển thị không được để trống' })
  displayName: string;
}
