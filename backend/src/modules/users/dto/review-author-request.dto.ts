import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReviewAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class ReviewAuthorRequestDto {
  @ApiProperty({
    enum: ReviewAction,
    example: ReviewAction.APPROVED,
    description: 'Quyết định phê duyệt: APPROVED hoặc REJECTED',
  })
  @IsEnum(ReviewAction, { message: 'Hành động duyệt phải là APPROVED hoặc REJECTED' })
  @IsNotEmpty({ message: 'Quyết định duyệt không được để trống' })
  status: ReviewAction;

  @ApiPropertyOptional({
    example: 'Hồ sơ hợp lệ, chào mừng bạn trở thành tác giả của StoryVN!',
    description: 'Ghi chú của người duyệt hoặc lý do từ chối nếu không duyệt',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  adminNote?: string;
}
