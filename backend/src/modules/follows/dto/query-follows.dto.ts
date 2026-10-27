import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export enum FollowStorySortOption {
  FOLLOWED_AT = 'followedAt',
  TITLE = 'title',
  UPDATED = 'updatedAt',
}

export class QueryFollowedStoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  @ApiPropertyOptional({
    enum: FollowStorySortOption,
    default: FollowStorySortOption.FOLLOWED_AT,
  })
  @IsOptional()
  @IsEnum(FollowStorySortOption, {
    message: 'Tiêu chí sắp xếp không hợp lệ',
  })
  sortBy?: FollowStorySortOption = FollowStorySortOption.FOLLOWED_AT;
}

export class QueryFollowedAuthorsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;
}
