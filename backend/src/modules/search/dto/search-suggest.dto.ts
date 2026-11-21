import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchSuggestDto {
  @ApiPropertyOptional({
    description: 'Tên truyện, tác giả hoặc mô tả nội dung',
    maxLength: 256,
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  q = '';
}
