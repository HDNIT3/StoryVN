import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
    description: 'Đường dẫn URL ảnh đại diện mới',
  })
  @IsString({ message: 'URL ảnh đại diện phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'URL ảnh đại diện không được để trống' })
  avatarUrl: string;
}
