import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { UserRole, UserStatus } from '../schemas/user.schema.js';

export class QueryUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'nguyen',
    description: 'Tìm kiếm theo email, username hoặc displayName',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Lọc theo vai trò (USER, AUTHOR, MANAGER, ADMIN)',
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  role?: UserRole;

  @ApiPropertyOptional({
    enum: UserStatus,
    description: 'Lọc theo trạng thái tài khoản (ACTIVE, BANNED)',
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái không hợp lệ' })
  status?: UserStatus;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Trường cần sắp xếp (createdAt, username, displayName, email)',
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'username', 'displayName', 'email', 'status', 'role'], {
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
