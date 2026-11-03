import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TransactionStatus } from '../enums/transaction-status.enum.js';

export class QueryTransactionsDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: TransactionStatus, description: 'Lọc theo trạng thái giao dịch' })
  @IsOptional()
  @IsEnum(TransactionStatus, { message: 'Trạng thái giao dịch không hợp lệ' })
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Tìm theo mã đơn, mã GD VNPay, hoặc tên/email người dùng' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'createdAt', default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'amount', 'totalCoin', 'status', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

