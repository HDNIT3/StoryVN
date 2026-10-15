import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminChapterModerationReasonDto {
  @ApiPropertyOptional({
    example: 'Chương cần tác giả rà soát lại chính tả và bản quyền trước khi xuất bản lại',
    description: 'Lý do gỡ duyệt chương truyện',
  })
  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Lý do không được vượt quá 1000 ký tự' })
  reason?: string;
}
