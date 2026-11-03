import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: '6ae96e0219c9958d1e5fd3ba',
    description: 'ID của gói nạp Xu được chọn',
  })
  @IsNotEmpty({ message: 'Vui lòng chọn gói nạp Xu' })
  @IsMongoId({ message: 'ID gói nạp không hợp lệ' })
  packageId: string;
}

