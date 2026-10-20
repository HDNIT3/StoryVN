import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Chapter } from './chapter.schema.js';
import { Story } from '../../stories/schemas/story.schema.js';
import { User } from '../../users/schemas/user.schema.js';

export enum ChapterUpdateStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type ChapterUpdateDocument = ChapterUpdate & Document;

@Schema({ timestamps: true, collection: 'chapter_updates' })
export class ChapterUpdate {
  _id: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Chapter.name,
    required: true,
    index: true,
  })
  chapterId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Story.name,
    required: true,
    index: true,
  })
  storyId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  authorId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  })
  title: string;

  @Prop({
    type: String,
    required: true,
  })
  content: string;

  /**
   * Số từ của bản sửa (đã loại bỏ thẻ HTML) — phục vụ hiển thị/thống kê.
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  wordCount: number;

  @Prop({
    type: Boolean,
    default: true,
  })
  isFree: boolean;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  coinPrice: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  requirePreviousChapter: boolean;

  @Prop({
    type: String,
    enum: ChapterUpdateStatus,
    default: ChapterUpdateStatus.DRAFT,
    index: true,
  })
  status: ChapterUpdateStatus;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  rejectReason?: string | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    default: null,
  })
  reviewerId?: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: null,
  })
  reviewedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChapterUpdateSchema = SchemaFactory.createForClass(ChapterUpdate);

ChapterUpdateSchema.index({ chapterId: 1, status: 1 });
ChapterUpdateSchema.index({ chapterId: 1, createdAt: -1 });
ChapterUpdateSchema.index({ storyId: 1, status: 1 });
