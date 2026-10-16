import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class BulkSubmitChaptersDto {
  @ApiProperty({
    description: 'Danh sách ID các chương cần gửi duyệt',
    example: ['60d0fe4f5311236168a109ca', '60d0fe4f5311236168a109cb'],
    type: [String],
  })
  @IsArray({ message: 'chapterIds phải là một mảng' })
  @ArrayNotEmpty({ message: 'Danh sách chapterIds không được để trống' })
  @IsMongoId({ each: true, message: 'Mỗi chapterId phải là ObjectId hợp lệ' })
  chapterIds: string[];
}
