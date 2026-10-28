import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { CommentStatus } from '../schemas/comment.schema.js';
import { CommentSortOrder } from './query-comments.dto.js';

export enum AdminCommentStatusFilter {
  ALL = 'ALL',
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

export class AdminQueryCommentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc trạng thái bình luận',
    enum: AdminCommentStatusFilter,
    default: AdminCommentStatusFilter.ALL,
  })
  @IsOptional()
  @IsEnum(AdminCommentStatusFilter)
  status?: AdminCommentStatusFilter = AdminCommentStatusFilter.ALL;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm nội dung hoặc tên người dùng' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID truyện' })
  @IsOptional()
  @IsMongoId({ message: 'ID truyện không hợp lệ' })
  storyId?: string;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: CommentSortOrder,
    default: CommentSortOrder.NEWEST,
  })
  @IsOptional()
  @IsEnum(CommentSortOrder)
  sort?: CommentSortOrder = CommentSortOrder.NEWEST;
}

