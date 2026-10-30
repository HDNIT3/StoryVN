import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Chapter } from '../../chapters/schemas/chapter.schema.js';
import { Story } from '../../stories/schemas/story.schema.js';
import { User } from '../../users/schemas/user.schema.js';

export enum CommentStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true, collection: 'comments' })
export class Comment {
  _id: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Story.name,
    required: true,
    index: true,
  })
  storyId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Chapter.name,
    default: null,
    index: true,
  })
  chapterId?: Types.ObjectId | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true,
  })
  parentId?: Types.ObjectId | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    default: null,
    index: true,
  })
  replyToUserId?: Types.ObjectId | null;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  })
  content: string;

  @Prop({
    type: String,
    enum: CommentStatus,
    default: CommentStatus.VISIBLE,
    index: true,
  })
  status: CommentStatus;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  replyCount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ storyId: 1, chapterId: 1, parentId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1, createdAt: 1 });
CommentSchema.index({ userId: 1, createdAt: -1 });

