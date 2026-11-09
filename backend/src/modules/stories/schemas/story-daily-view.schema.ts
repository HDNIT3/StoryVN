import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Story } from './story.schema.js';

export type StoryDailyViewDocument = StoryDailyView & Document;


@Schema({ timestamps: true, collection: 'story_daily_views' })
export class StoryDailyView {
  _id: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Story.name,
    required: true,
  })
  storyId: Types.ObjectId;

  /** Ngày theo giờ Việt Nam, định dạng YYYY-MM-DD */
  @Prop({ type: String, required: true })
  date: string;

  @Prop({ type: Number, default: 0, min: 0 })
  views: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StoryDailyViewSchema =
  SchemaFactory.createForClass(StoryDailyView);

// Đảm bảo 1 truyện / 1 ngày chỉ có 1 record + tra cứu lịch sử theo truyện
StoryDailyViewSchema.index({ storyId: 1, date: 1 }, { unique: true });
// Phục vụ xếp hạng / lọc theo khoảng ngày (ngày, tuần, tháng, năm)
StoryDailyViewSchema.index({ date: 1, views: -1 });

