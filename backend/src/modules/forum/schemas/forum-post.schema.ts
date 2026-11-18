 import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';

export enum ForumPostStatus {
  PENDING = 'PENDING',
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

export enum ForumContentFormat {
  PLAIN = 'plain',
  HTML = 'html',
}

export type ForumPostDocument = HydratedDocument<ForumPost>;

@Schema({ timestamps: true, collection: 'forum_posts' })
export class ForumPost {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 200 })
  title: string;

  @Prop({ trim: true, lowercase: true })
  slug?: string;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 20000 })
  content: string;

  @Prop({ type: String, enum: ForumContentFormat, default: ForumContentFormat.PLAIN })
  contentFormat: ForumContentFormat;

  @Prop({ type: String, enum: ForumPostStatus, default: ForumPostStatus.PENDING })
  status: ForumPostStatus;

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  likedBy: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  sharedBy: Types.ObjectId[];

  @Prop({ default: 0, min: 0 })
  viewCount: number;

  @Prop({ default: 0, min: 0 })
  shareCount: number;

  @Prop({ default: 0, min: 0 })
  commentCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ForumPostSchema = SchemaFactory.createForClass(ForumPost);
ForumPostSchema.index({ slug: 1 }, { unique: true, sparse: true });
ForumPostSchema.index({ status: 1, createdAt: -1, _id: -1 });
ForumPostSchema.index({ userId: 1, status: 1, createdAt: -1, _id: -1 });
