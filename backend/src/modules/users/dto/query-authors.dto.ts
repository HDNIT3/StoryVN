import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { StoryProgressState } from '../../stories/schemas/story.schema.js';

export enum AuthorSortOption {
  FEATURED = 'featured', // Nổi bật (views, followers, storyCount)
  NEWEST = 'newest',     // Mới tham gia
  UPDATED = 'updated',   // Mới cập nhật truyện
  STORIES = 'stories',   // Nhiều tác phẩm nhất
}

export enum AuthorBioFilter {
  ALL = 'all',
  YES = 'yes',
  NO = 'no',
}

export class QueryAuthorsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Số trang' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 50, description: 'Số mục mỗi trang' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên tác giả, bút danh hoặc slug',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: AuthorSortOption,
    default: AuthorSortOption.FEATURED,
    description:
      'Sắp xếp: featured (nổi bật), newest (mới tham gia), updated (mới cập nhật truyện), stories (nhiều tác phẩm)',
  })
  @IsOptional()
  @IsEnum(AuthorSortOption)
  sortBy?: AuthorSortOption = AuthorSortOption.FEATURED;

  @ApiPropertyOptional({
    description: 'Lọc theo ID hoặc slug của thể loại',
  })
  @IsOptional()
  @IsString()
  genreId?: string;

  @ApiPropertyOptional({
    enum: StoryProgressState,
    description: 'Lọc theo tiến độ sáng tác (ONGOING, COMPLETED, ON_HOLD)',
  })
  @IsOptional()
  @IsEnum(StoryProgressState)
  progressState?: StoryProgressState;

  @ApiPropertyOptional({
    enum: AuthorBioFilter,
    default: AuthorBioFilter.ALL,
    description: 'Lọc theo tiểu sử: all (tất cả), yes (đã có tiểu sử), no (chưa có tiểu sử)',
  })
  @IsOptional()
  @IsEnum(AuthorBioFilter)
  hasBio?: AuthorBioFilter = AuthorBioFilter.ALL;
}
