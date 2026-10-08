import { IsBoolean, IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema.js';

export class CreateNotificationDto {
  @IsMongoId()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsMongoId()
  storyId?: string;

  @IsOptional()
  @IsMongoId()
  chapterId?: string;

  @IsOptional()
  @IsMongoId()
  actorId?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}
