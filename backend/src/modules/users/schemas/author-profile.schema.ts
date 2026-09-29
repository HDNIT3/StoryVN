import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from './user.schema.js';

export enum AuthorProfileStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export type AuthorProfileDocument = AuthorProfile & Document;

@Schema({ timestamps: true, collection: 'author_profiles' })
export class AuthorProfile {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  penName: string;

  @Prop({ type: String, default: null, trim: true })
  biography?: string | null;

  @Prop({ type: String, default: null })
  avatarUrl?: string | null;

  @Prop({ type: String, default: null, trim: true })
  website?: string | null;

  @Prop({ type: Object, default: {} })
  socialLinks?: Record<string, any>;

  @Prop({ type: String, default: null, trim: true })
  bankName?: string | null;

  @Prop({ type: String, default: null, trim: true })
  bankAccountNumber?: string | null;

  @Prop({ type: String, default: null, trim: true })
  bankAccountName?: string | null;

  @Prop({ type: Number, default: 0, min: 0 })
  followerCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  storyCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalViews: number;

  @Prop({
    type: String,
    enum: AuthorProfileStatus,
    default: AuthorProfileStatus.ACTIVE,
  })
  status: AuthorProfileStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AuthorProfileSchema = SchemaFactory.createForClass(AuthorProfile);
