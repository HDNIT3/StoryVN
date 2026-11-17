import { ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { DateRangeQueryDto } from '../../../common/dto/date-range.dto.js';
import { Transform } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { ContentReportTargetType } from '../schemas/content-report.schema.js';

export class SubmitReportDto {
  @ApiProperty({ enum: ContentReportTargetType })
  @IsEnum(ContentReportTargetType)
  targetType: ContentReportTargetType;

  @ApiProperty()
  @IsMongoId()
  targetId: string;

  @ApiProperty({ minLength: 1, maxLength: 1000 })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 1000)
  reason: string;
}

export class QueryReportsDto extends IntersectionType(PaginationQueryDto, DateRangeQueryDto) {
  get skip(): number { return (this.page - 1) * this.limit; }
}

export class AdminQueryReportsDto extends QueryReportsDto {
  @ApiPropertyOptional({ enum: ContentReportTargetType })
  @IsOptional()
  @IsEnum(ContentReportTargetType)
  targetType?: ContentReportTargetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  targetId?: string;
}
