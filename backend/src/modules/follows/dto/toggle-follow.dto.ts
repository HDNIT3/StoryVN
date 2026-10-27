import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { FollowTargetType } from '../schemas/follow.schema.js';

export class ToggleFollowDto {
  @ApiProperty({
    enum: FollowTargetType,
    example: FollowTargetType.STORY,
  })
  @IsNotEmpty({ message: 'targetType không được để trống' })
  @IsEnum(FollowTargetType, {
    message: 'targetType phải là STORY hoặc AUTHOR',
  })
  targetType: FollowTargetType;

  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
  })
  @IsNotEmpty({ message: 'targetId không được để trống' })
  @IsMongoId({ message: 'targetId phải là ObjectId hợp lệ' })
  targetId: string;
}
