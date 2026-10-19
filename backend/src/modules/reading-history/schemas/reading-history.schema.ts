import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Chapter } from '../../chapters/schemas/chapter.schema.js';
import { Story } from '../../stories/schemas/story.schema.js';
import { User } from '../../users/schemas/user.schema.js';

export type ReadingHistoryDocument = ReadingHistory & Document;

@Schema({ timestamps: true, collection: 'reading_history' })
export class ReadingHistory {
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
    required: true,
  })
  chapterId: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReadingHistorySchema =
  SchemaFactory.createForClass(ReadingHistory);

ReadingHistorySchema.index({ userId: 1, createdAt: -1 });
ReadingHistorySchema.index({ userId: 1, storyId: 1, createdAt: -1 });
