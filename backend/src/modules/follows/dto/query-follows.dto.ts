import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
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

export class QueryFollowedUpdatesDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Chỉ hiển thị truyện đang có chương mới chưa đọc / chưa xem',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return value;
  })
  @IsBoolean({ message: 'Giá trị lọc chưa đọc phải là boolean' })
  onlyUnread?: boolean;
}

export class MarkFollowUpdatesReadDto {
  @ApiPropertyOptional({
    description: 'ID truyện cần đánh dấu đã xem (bỏ trống để đánh dấu tất cả)',
  })
  @IsOptional()
  @IsMongoId({ message: 'storyId không hợp lệ' })
  storyId?: string;
}
