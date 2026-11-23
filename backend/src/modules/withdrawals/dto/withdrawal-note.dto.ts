import { IsString, MaxLength, MinLength } from 'class-validator';

export class WithdrawalNoteDto {
  @IsString() @MinLength(1) @MaxLength(1000) note: string;
}
