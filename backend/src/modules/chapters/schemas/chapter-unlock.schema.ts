import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';
import { Chapter } from './chapter.schema.js';

export type ChapterUnlockDocument = ChapterUnlock & Document;

@Schema({ timestamps: false, collection: 'chapter_unlocks' })
export class ChapterUnlock {
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
    ref: Chapter.name,
    required: true,
    index: true,
  })
  chapterId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  coinPrice: number;

  @Prop({
    type: Date,
    default: Date.now,
  })
  unlockedAt: Date;
}

export const ChapterUnlockSchema = SchemaFactory.createForClass(ChapterUnlock);

// Đảm bảo mỗi User chỉ mở khóa một chương một lần duy nhất (chống giao dịch đồng thời)
ChapterUnlockSchema.index({ userId: 1, chapterId: 1 }, { unique: true });
ChapterUnlockSchema.index({ userId: 1, unlockedAt: -1 });

