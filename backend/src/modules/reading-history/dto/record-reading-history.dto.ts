import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class RecordReadingHistoryDto {
  @ApiProperty({
    description: 'ID chương người dùng đang đọc',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsNotEmpty({ message: 'chapterId không được để trống' })
  @IsMongoId({ message: 'chapterId phải là ObjectId hợp lệ' })
  chapterId: string;
}
