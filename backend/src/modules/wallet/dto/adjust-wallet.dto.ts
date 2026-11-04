import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { WalletAdjustDirection } from '../enums/wallet.enum.js';

export class AdjustWalletDto {
  @ApiProperty({
    enum: WalletAdjustDirection,
    description: 'CREDIT: cộng Xu, DEBIT: trừ Xu',
  })
  @IsEnum(WalletAdjustDirection, { message: 'Hướng điều chỉnh không hợp lệ' })
  direction: WalletAdjustDirection;

  @ApiProperty({ example: 100, description: 'Số Xu cần cộng hoặc trừ (số nguyên dương)' })
  @Type(() => Number)
  @IsInt({ message: 'Số Xu phải là số nguyên' })
  @Min(1, { message: 'Số Xu phải lớn hơn 0' })
  amount: number;

  @ApiPropertyOptional({ example: 'Bù Xu do sự cố thanh toán' })
  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi' })
  @MaxLength(255, { message: 'Lý do tối đa 255 ký tự' })
  reason?: string;
}
