import { Transform } from 'class-transformer';
import { IntersectionType } from '@nestjs/swagger';
import { DateRangeQueryDto } from '../../../common/dto/date-range.dto.js';
import { IsEnum, IsIn, IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { ForumContentFormat, ForumPostStatus } from '../schemas/forum-post.schema.js';

const trimText = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateForumPostDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 200)
  title: string;

  @Transform(trimText)
  @IsString()
  @Length(1, 20000)
  content: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(ForumContentFormat)
  contentFormat?: ForumContentFormat;
}

export class UpdateForumPostDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimText)
  @IsString()
  @Length(1, 200)
  title?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimText)
  @IsString()
  @Length(1, 20000)
  content?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(ForumContentFormat)
  contentFormat?: ForumContentFormat;
}

export class ReportForumPostDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 1000)
  reason: string;
}

export class QueryForumPostsDto extends IntersectionType(PaginationQueryDto, DateRangeQueryDto) {
  get skip(): number { return (this.page - 1) * this.limit; }
}

export class AdminQueryForumPostsDto extends QueryForumPostsDto {
  @IsOptional()
  @IsEnum(ForumPostStatus)
  status?: ForumPostStatus;
}

export class UpdateForumPostStatusDto {
  @IsIn([ForumPostStatus.VISIBLE, ForumPostStatus.HIDDEN, ForumPostStatus.REJECTED])
  status: ForumPostStatus.VISIBLE | ForumPostStatus.HIDDEN | ForumPostStatus.REJECTED;
}
