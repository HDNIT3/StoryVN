import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class QueryRecentStoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc theo ID thể loại (ObjectId)',
  })
  @IsOptional()
  @IsMongoId({ message: 'ID thể loại không hợp lệ' })
  genreId?: string;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tên hoặc slug truyện',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;
}
