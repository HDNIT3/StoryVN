import { IsUUID } from 'class-validator';

export class CreateWithdrawalDto {
  @IsUUID() idempotencyKey: string;
}
