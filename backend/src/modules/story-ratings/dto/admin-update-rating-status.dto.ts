import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StoryRatingStatus } from '../schemas/story-rating.schema.js';

export class AdminUpdateRatingStatusDto {
  @ApiProperty({
    description: 'Trạng thái hiển thị đánh giá',
    enum: StoryRatingStatus,
    example: StoryRatingStatus.VISIBLE,
  })
  @IsEnum(StoryRatingStatus, { message: 'Trạng thái đánh giá không hợp lệ' })
  status: StoryRatingStatus;
}

