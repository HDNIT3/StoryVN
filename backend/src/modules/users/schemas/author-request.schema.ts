import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from './user.schema.js';

export enum AuthorRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type AuthorRequestDocument = AuthorRequest & Document;

@Schema({ timestamps: true, collection: 'author_requests' })
export class AuthorRequest {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
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

  @Prop({ type: String, default: null, trim: true })
  reason?: string | null;

  @Prop({
    type: String,
    enum: AuthorRequestStatus,
    default: AuthorRequestStatus.PENDING,
    index: true,
  })
  status: AuthorRequestStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    default: null,
  })
  processedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  processedAt?: Date | null;

  @Prop({ type: String, default: null, trim: true })
  adminNote?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AuthorRequestSchema = SchemaFactory.createForClass(AuthorRequest);

AuthorRequestSchema.index({ userId: 1, status: 1 });
AuthorRequestSchema.index({ createdAt: -1 });
