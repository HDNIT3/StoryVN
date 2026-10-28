import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Story } from '../../stories/schemas/story.schema.js';
import { User } from '../../users/schemas/user.schema.js';

export enum StoryRatingStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

export type StoryRatingDocument = StoryRating & Document;

@Schema({ timestamps: true, collection: 'story_ratings' })
export class StoryRating {
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
    type: Number,
    required: true,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop({
    type: String,
    default: '',
    trim: true,
    maxlength: 2000,
  })
  review?: string;

  @Prop({
    type: String,
    enum: StoryRatingStatus,
    default: StoryRatingStatus.VISIBLE,
    index: true,
  })
  status: StoryRatingStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StoryRatingSchema = SchemaFactory.createForClass(StoryRating);

StoryRatingSchema.index({ userId: 1, storyId: 1 }, { unique: true });
StoryRatingSchema.index({ storyId: 1, status: 1, createdAt: -1 });
StoryRatingSchema.index({ storyId: 1, rating: 1 });

