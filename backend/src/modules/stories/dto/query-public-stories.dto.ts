import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { StoryAgeRating, StoryOriginType, StoryProgressState } from '../schemas/story.schema.js';

export class QueryPublicStoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên truyện' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo thể loại (genre _id hoặc slug)' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ description: 'Lọc theo tag (_id)' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ enum: StoryAgeRating })
  @IsOptional()
  @IsEnum(StoryAgeRating)
  ageRating?: StoryAgeRating;

  @ApiPropertyOptional({ enum: StoryProgressState })
  @IsOptional()
  @IsEnum(StoryProgressState)
  progressState?: StoryProgressState;

  @ApiPropertyOptional({ enum: StoryOriginType })
  @IsOptional()
  @IsEnum(StoryOriginType)
  originType?: StoryOriginType;

  @ApiPropertyOptional({
    example: 'viewCount',
    description: 'Sắp xếp: viewCount | likeCount | followCount | ratingAverage | chapterCount | updatedAt | createdAt',
    default: 'viewCount',
  })
  @IsOptional()
  @IsIn(['viewCount', 'likeCount', 'followCount', 'ratingAverage', 'chapterCount', 'updatedAt', 'createdAt'])
  sortBy?: string = 'viewCount';

  @ApiPropertyOptional({ example: 'desc', default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
