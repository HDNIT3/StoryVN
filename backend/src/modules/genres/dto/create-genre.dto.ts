import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateGenreDto {
  @ApiProperty({
    example: 'Tiên Hiệp',
    description: 'Tên thể loại (không được trùng)',
  })
  @IsNotEmpty({ message: 'Tên thể loại không được để trống' })
  @IsString({ message: 'Tên thể loại phải là chuỗi' })
  @Length(2, 50, { message: 'Tên thể loại phải từ 2 đến 50 ký tự' })
  name: string;

  @ApiPropertyOptional({
    example: 'tien-hiep',
    description: 'Chuỗi định danh URL (nếu không cung cấp sẽ tự sinh từ tên)',
  })
  @IsOptional()
  @IsString({ message: 'Slug phải là chuỗi' })
  slug?: string;

  @ApiPropertyOptional({
    example: 'Thể loại tu chân tiên hiệp huyền ảo',
    description: 'Mô tả thể loại',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Trạng thái hoạt động',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là boolean' })
  isActive?: boolean;
}
