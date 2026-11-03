import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class QueryCoinPackageDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'Cơ bản',
    description: 'Từ khóa tìm kiếm theo tên gói nạp',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Lọc theo trạng thái hoạt động (true/false)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'isActive phải là boolean' })
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Lọc theo gói nổi bật (true/false)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'isFeatured phải là boolean' })
  isFeatured?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Nếu true sẽ trả về toàn bộ danh sách không phân trang',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  all?: boolean;

  @ApiPropertyOptional({
    example: 'sortOrder',
    description: 'Trường sắp xếp (sortOrder, price, coinAmount, totalCoin, createdAt, name)',
    default: 'sortOrder',
  })
  @IsOptional()
  @IsIn(['sortOrder', 'price', 'coinAmount', 'totalCoin', 'createdAt', 'name', 'updatedAt'], {
    message: 'Trường sắp xếp không hợp lệ',
  })
  sortBy?: string = 'sortOrder';

  @ApiPropertyOptional({
    example: 'asc',
    description: 'Thứ tự sắp xếp (asc hoặc desc)',
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Thứ tự sắp xếp phải là asc hoặc desc' })
  sortOrder?: 'asc' | 'desc' = 'asc';
}
