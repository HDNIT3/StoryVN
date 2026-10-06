import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Story } from './story.schema.js';
import { User } from '../../users/schemas/user.schema.js';

// ── StoryLike ──────────────────────────────────────────────────────────────
export type StoryLikeDocument = StoryLike & Document;

@Schema({ timestamps: true, collection: 'story_likes' })
export class StoryLike {
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
    index: true,
  })
  userId: Types.ObjectId;

  createdAt?: Date;
}

export const StoryLikeSchema = SchemaFactory.createForClass(StoryLike);
// unique: mỗi user chỉ like mỗi truyện 1 lần
StoryLikeSchema.index({ storyId: 1, userId: 1 }, { unique: true });

// ── StoryFollow ────────────────────────────────────────────────────────────
export type StoryFollowDocument = StoryFollow & Document;

@Schema({ timestamps: true, collection: 'story_follows' })
export class StoryFollow {
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
    index: true,
  })
  userId: Types.ObjectId;

  createdAt?: Date;
}

export const StoryFollowSchema = SchemaFactory.createForClass(StoryFollow);
StoryFollowSchema.index({ storyId: 1, userId: 1 }, { unique: true });

// ── StoryRating ────────────────────────────────────────────────────────────
export type StoryRatingDocument = StoryRating & Document;

@Schema({ timestamps: true, collection: 'story_ratings' })
export class StoryRating {
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
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  score: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StoryRatingSchema = SchemaFactory.createForClass(StoryRating);
StoryRatingSchema.index({ storyId: 1, userId: 1 }, { unique: true });
