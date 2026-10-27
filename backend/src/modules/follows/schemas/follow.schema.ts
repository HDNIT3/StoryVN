import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';

export enum FollowTargetType {
  STORY = 'STORY',
  AUTHOR = 'AUTHOR',
}

export type FollowDocument = Follow & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'follows' })
export class Follow {
  _id: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: FollowTargetType,
    required: true,
    index: true,
  })
  targetType: FollowTargetType;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
  })
  targetId: Types.ObjectId;

  createdAt: Date;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

FollowSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
FollowSchema.index({ userId: 1, targetType: 1, createdAt: -1 });
FollowSchema.index({ targetId: 1, targetType: 1 });
