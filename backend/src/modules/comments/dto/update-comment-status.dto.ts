import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CommentStatus } from '../schemas/comment.schema.js';

export class UpdateCommentStatusDto {
  @ApiProperty({
    description: 'Trạng thái bình luận (VISIBLE để hiển thị, HIDDEN để ẩn)',
    enum: [CommentStatus.VISIBLE, CommentStatus.HIDDEN],
    example: CommentStatus.HIDDEN,
  })
  @IsEnum(CommentStatus, { message: 'Trạng thái bình luận không hợp lệ' })
  status: CommentStatus;
}

