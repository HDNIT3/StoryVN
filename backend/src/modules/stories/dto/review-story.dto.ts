import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum StoryReviewAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class ReviewStoryDto {
  @ApiProperty({
    enum: StoryReviewAction,
    example: StoryReviewAction.APPROVED,
    description: 'Quyết định phê duyệt: APPROVED hoặc REJECTED',
  })
  @IsEnum(StoryReviewAction, {
    message: 'Hành động duyệt phải là APPROVED hoặc REJECTED',
  })
  @IsNotEmpty({ message: 'Quyết định duyệt không được để trống' })
  action: StoryReviewAction;

  @ApiPropertyOptional({
    example: 'Ảnh bìa chứa nội dung vi phạm tiêu chuẩn cộng đồng, vui lòng thay ảnh khác.',
    description: 'Lý do từ chối (bắt buộc khi action là REJECTED) hoặc ghi chú duyệt',
  })
  @IsOptional()
  @IsString({ message: 'Lý do hoặc ghi chú phải là chuỗi ký tự' })
  rejectReason?: string;
}
