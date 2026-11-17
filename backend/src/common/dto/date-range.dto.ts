import { Allow } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeQueryDto {
  @Allow()
  @ApiPropertyOptional({ description: 'Inclusive Vietnam date (YYYY-MM-DD). Supply both endpoints. Omit dates and days for all time.', example: '2026-01-01' })
  startDate?: string;
  @Allow()
  @ApiPropertyOptional({ description: 'Inclusive Vietnam date. Explicit ranges are limited to 366 days.', example: '2026-01-31' })
  endDate?: string;
  @Allow()
  @ApiPropertyOptional({ description: 'Explicit trailing days for dashboard/daily-view APIs; omitted means all time.', minimum: 1, maximum: 366 })
  days?: number;
}
