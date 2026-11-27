import { IsString, Matches } from 'class-validator';
import { UpdateSystemConfigDto } from './update-system-config.dto.js';

export class CreateSystemConfigDto extends UpdateSystemConfigDto {
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/, {
    message: 'Khóa cấu hình phải bắt đầu bằng chữ cái và có tối đa 80 ký tự hợp lệ.',
  })
  config_key: string;
}
