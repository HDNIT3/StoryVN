import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../schemas/user.schema.js';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.BANNED,
    description: 'Trạng thái mới của người dùng (ACTIVE, BANNED)',
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(UserStatus, { message: 'Trạng thái người dùng không hợp lệ' })
  status: UserStatus;
}
