import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsMongoId, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StoryAgeRating, StoryProgressState } from '../stories/schemas/story.schema.js';

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Tên truyện hoặc câu mô tả tiếng Việt', maxLength: 256 })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string'
    ? value.normalize('NFC').replace(/\s+/g, ' ').trim() : value)
  @IsOptional()
  @IsString()
  @MaxLength(256)
  q = '';

  @ApiPropertyOptional({ default: 8, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit = 8;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  genreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  tagId?: string;

  @ApiPropertyOptional({ enum: StoryProgressState })
  @IsOptional()
  @IsEnum(StoryProgressState)
  progressState?: StoryProgressState;

  @ApiPropertyOptional({ enum: StoryAgeRating })
  @IsOptional()
  @IsEnum(StoryAgeRating)
  ageRating?: StoryAgeRating;
}
