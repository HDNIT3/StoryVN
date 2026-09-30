import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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

  @ApiPropertyOptional({
    example: 'Vi phạm chính sách bình luận',
    description: 'Lý do thay đổi trạng thái tài khoản',
  })
  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi' })
  @MaxLength(255, { message: 'Lý do không được vượt quá 255 ký tự' })
  reason?: string;
}
