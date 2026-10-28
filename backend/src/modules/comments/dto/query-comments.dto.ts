import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export enum CommentSortOrder {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
}

export class QueryCommentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc bình luận của chương cụ thể (nếu không truyền và onlyStoryLevel=false sẽ lấy tất cả)',
  })
  @IsOptional()
  @IsMongoId({ message: 'ID chương không hợp lệ' })
  chapterId?: string;

  @ApiPropertyOptional({
    description: 'Chỉ lấy bình luận ở trang truyện chính (chapterId = null)',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlyStoryLevel?: boolean;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp bình luận',
    enum: CommentSortOrder,
    default: CommentSortOrder.NEWEST,
  })
  @IsOptional()
  @IsEnum(CommentSortOrder, { message: 'Thứ tự sắp xếp không hợp lệ' })
  sort?: CommentSortOrder = CommentSortOrder.NEWEST;
}

