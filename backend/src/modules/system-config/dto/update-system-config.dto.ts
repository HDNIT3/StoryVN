import { IsString, MaxLength } from 'class-validator';

export class UpdateSystemConfigDto {
  @IsString()
  @MaxLength(4000)
  config_value: string;

  @IsString()
  @MaxLength(500)
  description: string;
}
