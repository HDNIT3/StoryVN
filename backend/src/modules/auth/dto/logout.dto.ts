import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    example: 'd3b07384d113edec49eaa6238ad5ff00...',
    description: 'Refresh token của thiết bị hiện tại cần thu hồi',
  })
  @IsOptional()
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  refreshToken?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Đăng xuất khỏi tất cả các thiết bị hay không',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'allDevices phải là kiểu boolean' })
  allDevices?: boolean;
}
