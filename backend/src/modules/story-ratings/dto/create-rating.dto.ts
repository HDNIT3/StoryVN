import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ description: 'Điểm đánh giá từ 1 đến 5 sao', minimum: 1, maximum: 5, example: 5 })
  @Type(() => Number)
  @IsInt({ message: 'Điểm đánh giá phải là số nguyên' })
  @Min(1, { message: 'Điểm đánh giá tối thiểu là 1 sao' })
  @Max(5, { message: 'Điểm đánh giá tối đa là 5 sao' })
  rating: number;

  @ApiPropertyOptional({ description: 'Nội dung nhận xét đánh giá', maxLength: 2000, example: 'Truyện rất cuốn!' })
  @IsOptional()
  @IsString({ message: 'Nội dung nhận xét phải là chuỗi' })
  @MaxLength(2000, { message: 'Nội dung nhận xét tối đa 2000 ký tự' })
  review?: string;
}

