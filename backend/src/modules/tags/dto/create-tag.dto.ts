import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    example: 'Xuyên Không',
    description: 'Tên tag (không được trùng)',
  })
  @IsNotEmpty({ message: 'Tên tag không được để trống' })
  @IsString({ message: 'Tên tag phải là chuỗi' })
  @Length(2, 50, { message: 'Tên tag phải từ 2 đến 50 ký tự' })
  name: string;

  @ApiPropertyOptional({
    example: 'xuyen-khong',
    description: 'Chuỗi định danh URL của tag',
  })
  @IsOptional()
  @IsString({ message: 'Slug phải là chuỗi' })
  slug?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Trạng thái hoạt động',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là boolean' })
  isActive?: boolean;
}
