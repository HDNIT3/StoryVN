import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RateStoryDto {
  @ApiProperty({ example: 4, description: 'Điểm đánh giá từ 1 đến 5' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;
}
