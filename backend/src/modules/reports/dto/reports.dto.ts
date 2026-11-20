import { ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { DateRangeQueryDto } from '../../../common/dto/date-range.dto.js';
import { Transform } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsString, Length, MaxLength, ValidateIf } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { ContentReportStatus, ContentReportTargetType } from '../schemas/content-report.schema.js';

export class SubmitReportDto {
  @ApiProperty({ enum: ContentReportTargetType })
  @IsEnum(ContentReportTargetType)
  targetType: ContentReportTargetType;

  @ApiPropertyOptional()
  @ValidateIf((o: SubmitReportDto) => !o.targetUrl || Boolean(o.targetId))
  @IsMongoId()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn URL công khai của nội dung cần tố cáo (thay thế cho targetId)' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(500)
  targetUrl?: string;

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
  @ApiPropertyOptional({ enum: ContentReportStatus })
  @IsOptional()
  @IsEnum(ContentReportStatus)
  status?: ContentReportStatus;

  @ApiPropertyOptional({ enum: ContentReportTargetType })
  @IsOptional()
  @IsEnum(ContentReportTargetType)
  targetType?: ContentReportTargetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  targetId?: string;
}


export class UpdateReportStatusDto {
  @ApiProperty({ enum: ContentReportStatus })
  @IsEnum(ContentReportStatus)
  status: ContentReportStatus;

  @ApiPropertyOptional({ maxLength: 2000, description: 'K?t qu? xem x?t v? h?nh ??ng ?? th?c hi?n' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(2000)
  resolutionNote?: string;
}
