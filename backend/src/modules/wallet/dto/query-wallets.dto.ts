import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class QueryWalletsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'nguyen',
    description: 'Tìm kiếm theo email, username hoặc displayName của người dùng',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @ApiPropertyOptional({
    example: 'updatedAt',
    description: 'Trường cần sắp xếp (balance, totalSpent, createdAt, updatedAt)',
    default: 'updatedAt',
  })
  @IsOptional()
  @IsIn(['balance', 'totalSpent', 'createdAt', 'updatedAt'], {
    message: 'Trường sắp xếp không hợp lệ',
  })
  sortBy?: string = 'updatedAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Thứ tự sắp xếp (asc hoặc desc)',
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Thứ tự sắp xếp phải là asc hoặc desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
