import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export enum RatingSortOrder {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  RATING_DESC = 'RATING_DESC',
  RATING_ASC = 'RATING_ASC',
}

export class QueryRatingsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Lọc theo số sao (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số sao phải là số nguyên' })
  @Min(1, { message: 'Số sao tối thiểu là 1' })
  @Max(5, { message: 'Số sao tối đa là 5' })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: RatingSortOrder,
    default: RatingSortOrder.NEWEST,
  })
  @IsOptional()
  @IsEnum(RatingSortOrder, { message: 'Thứ tự sắp xếp không hợp lệ' })
  sort?: RatingSortOrder = RatingSortOrder.NEWEST;
}

