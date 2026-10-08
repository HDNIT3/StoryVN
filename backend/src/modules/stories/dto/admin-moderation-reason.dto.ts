import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminModerationReasonDto {
  @ApiPropertyOptional({
    example: 'Tác phẩm cần kiểm tra lại bản quyền hình ảnh và nội dung mô tả',
    description: 'Lý do gỡ duyệt hoặc lý do ẩn/cấm tác phẩm',
  })
  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Lý do không được vượt quá 1000 ký tự' })
  reason?: string;
}
