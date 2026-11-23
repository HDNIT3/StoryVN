import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CompleteWithdrawalDto {
  @IsString() @MinLength(3) @MaxLength(120) transactionCode: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}
