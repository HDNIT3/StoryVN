import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class QueryTagDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'xuyên không',
    description: 'Từ khóa tìm kiếm theo tên hoặc slug tag',
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
    example: false,
    description: 'Nếu true sẽ trả về toàn bộ danh sách không phân trang',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  all?: boolean;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Trường sắp xếp (createdAt, name, slug)',
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'name', 'slug', 'updatedAt'], {
    message: 'Trường sắp xếp không hợp lệ',
  })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Thứ tự sắp xếp (asc hoặc desc)',
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Thứ tự sắp xếp phải là asc hoặc desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
