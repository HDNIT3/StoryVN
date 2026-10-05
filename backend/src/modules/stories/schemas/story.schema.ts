import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Genre } from '../../genres/schemas/genre.schema.js';
import { Tag } from '../../tags/schemas/tag.schema.js';
import { User } from '../../users/schemas/user.schema.js';

export enum StoryStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export enum StoryVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

@Schema({ _id: false })
export class StoryStats {
  @Prop({ type: Number, default: 0, min: 0 })
  viewCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  followCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  ratingCount: number;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  ratingAverage: number;

  @Prop({ type: Number, default: 0, min: 0 })
  chapterCount: number;
}

export const StoryStatsSchema = SchemaFactory.createForClass(StoryStats);

export type StoryDocument = Story & Document;

@Schema({ timestamps: true, collection: 'stories' })
export class Story {
  _id: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  slug: string;

  @Prop({ type: String, default: '', trim: true })
  description: string;

  @Prop({ type: String, default: null })
  coverUrl?: string | null;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: Genre.name }],
    default: [],
  })
  genreIds: Types.ObjectId[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: Tag.name }],
    default: [],
  })
  tagIds: Types.ObjectId[];

  @Prop({
    type: String,
    enum: StoryStatus,
    default: StoryStatus.DRAFT,
    index: true,
  })
  status: StoryStatus;

  @Prop({
    type: String,
    enum: StoryVisibility,
    default: StoryVisibility.PUBLIC,
    index: true,
  })
  visibility: StoryVisibility;

  @Prop({ type: StoryStatsSchema, default: () => ({}) })
  stats: StoryStats;

  @Prop({ type: Date, default: null })
  publishedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);
