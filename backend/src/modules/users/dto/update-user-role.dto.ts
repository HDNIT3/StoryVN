import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, NotEquals } from 'class-validator';
import { UserRole } from '../schemas/user.schema.js';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN],
    example: UserRole.MANAGER,
    description: 'Vai trò mới (chỉ nhận USER, MANAGER hoặc ADMIN; AUTHOR được duyệt riêng)',
  })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  @NotEquals(UserRole.AUTHOR, {
    message: 'Vai trò Tác giả (AUTHOR) được xét duyệt riêng qua chức năng duyệt yêu cầu tác giả',
  })
  role: UserRole;
}
