import { IsMongoId, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DateRangeQueryDto } from '../../common/dto/date-range.dto.js';

export class ContentStatisticsQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({
    description:
      'Filter stories, chapters, views and requests by author account.',
  })
  authorId?: string;
}
