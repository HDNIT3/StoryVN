import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateCoinPackageDto {
  @ApiProperty({
    example: 'Gói Cơ Bản',
    description: 'Tên gói nạp (không được trùng)',
  })
  @IsNotEmpty({ message: 'Tên gói nạp không được để trống' })
  @IsString({ message: 'Tên gói nạp phải là chuỗi' })
  @Length(2, 100, { message: 'Tên gói nạp phải từ 2 đến 100 ký tự' })
  name: string;

  @ApiPropertyOptional({
    example: 'Gói nạp ưu đãi cho người dùng mới',
    description: 'Mô tả gói nạp',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiProperty({
    example: 20000,
    description: 'Giá tiền gói nạp (VND)',
  })
  @IsNotEmpty({ message: 'Giá tiền không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá tiền phải là số' })
  @Min(0, { message: 'Giá tiền phải lớn hơn hoặc bằng 0' })
  price: number;

  @ApiProperty({
    example: 200,
    description: 'Số Xu cơ bản',
  })
  @IsNotEmpty({ message: 'Số Xu cơ bản không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số Xu cơ bản phải là số nguyên' })
  @Min(1, { message: 'Số Xu cơ bản phải tối thiểu là 1' })
  coinAmount: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Số Xu thưởng thêm',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số Xu thưởng phải là số nguyên' })
  @Min(0, { message: 'Số Xu thưởng không được âm' })
  bonusCoin?: number = 0;

  @ApiPropertyOptional({
    example: true,
    description: 'Trạng thái hoạt động',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là boolean' })
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Đánh dấu gói nổi bật / hot',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isFeatured phải là boolean' })
  isFeatured?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị (tối thiểu là 1)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Thứ tự hiển thị phải là số nguyên' })
  @Min(1, { message: 'Thứ tự hiển thị phải tối thiểu là 1' })
  sortOrder?: number;
}
