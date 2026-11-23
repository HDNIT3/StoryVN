import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { WithdrawalStatus } from '../enums/withdrawal-status.enum.js';

export class WithdrawalQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(WithdrawalStatus) status?: WithdrawalStatus;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsDateString({ strict: true }) startDate?: string;
  @IsOptional() @IsDateString({ strict: true }) endDate?: string;
}
