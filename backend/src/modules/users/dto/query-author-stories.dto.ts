import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { StoryProgressState } from '../../stories/schemas/story.schema.js';

export enum AuthorStorySortOption {
  LATEST = 'latest',
  VIEWS = 'views',
  RATING = 'rating',
  CHAPTERS = 'chapters',
}

export class QueryAuthorStoriesDto {
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

  @ApiPropertyOptional({ enum: StoryProgressState, description: 'Lọc theo tiến độ sáng tác' })
  @IsOptional()
  @IsEnum(StoryProgressState)
  progressState?: StoryProgressState;

  @ApiPropertyOptional({
    enum: AuthorStorySortOption,
    default: AuthorStorySortOption.LATEST,
    description: 'Sắp xếp tác phẩm',
  })
  @IsOptional()
  @IsEnum(AuthorStorySortOption)
  sortBy?: AuthorStorySortOption = AuthorStorySortOption.LATEST;
}
