import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export enum NotificationType {
  NEW_CHAPTER = 'NEW_CHAPTER',
  FOLLOW = 'FOLLOW',
  COMMENT = 'COMMENT',
  REPLY = 'REPLY',
  FORUM = 'FORUM',
  SYSTEM = 'SYSTEM',
  MODERATION = 'MODERATION',
}

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'notifications' })
export class Notification {
  _id: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: NotificationType,
    required: true,
    index: true,
  })
  type: NotificationType;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true, trim: true })
  message: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Story', default: null })
  storyId?: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chapter', default: null })
  chapterId?: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  actorId?: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  referenceId?: Types.ObjectId | string | null;

  @Prop({ type: Boolean, default: false, index: true })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt?: Date | null;

  createdAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound index: lấy notifications cho 1 user, sort theo thời gian
NotificationSchema.index({ userId: 1, createdAt: -1 });
// Index cho unread count
NotificationSchema.index({ userId: 1, isRead: 1 });
