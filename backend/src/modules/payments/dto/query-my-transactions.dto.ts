import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { TransactionStatus } from '../enums/transaction-status.enum.js';

export class QueryMyTransactionsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: TransactionStatus,
    description: 'Lọc theo trạng thái giao dịch',
  })
  @IsOptional()
  @IsEnum(TransactionStatus, { message: 'Trạng thái giao dịch không hợp lệ' })
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Tìm theo mã đơn hàng hoặc mã giao dịch VNPay' })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;
}
