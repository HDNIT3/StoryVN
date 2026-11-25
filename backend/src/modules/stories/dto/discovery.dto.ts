import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Matches, Max, Min, ValidateIf } from 'class-validator';

export class RankingsQueryDto {
  @IsIn(['views', 'follows', 'rating', 'purchases', 'revenue'])
  metric: 'views' | 'follows' | 'rating' | 'purchases' | 'revenue' = 'views';

  @IsIn(['all', 'today', 'week', 'month', 'year'])
  timeFrame: 'all' | 'today' | 'week' | 'month' | 'year' = 'all';

  @IsOptional()
  @IsIn(['day', 'month', 'year'])
  dateMode?: 'day' | 'month' | 'year';

  @ValidateIf((query: RankingsQueryDto) => query.dateMode === 'day')
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ValidateIf((query: RankingsQueryDto) => query.dateMode === 'month')
  @Matches(/^\d{4}-\d{2}$/)
  month?: string;

  @ValidateIf((query: RankingsQueryDto) => query.dateMode === 'year')
  @Matches(/^\d{4}$/)
  year?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  page = 1;
}

export class RecommendationsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit = 6;

  @IsOptional()
  @IsMongoId()
  storyId?: string;
}
