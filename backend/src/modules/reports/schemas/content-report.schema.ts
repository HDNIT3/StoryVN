import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';

export enum ContentReportTargetType {
  FORUM_POST = 'FORUM_POST',
  STORY = 'STORY',
  CHAPTER = 'CHAPTER',
  COMMENT = 'COMMENT',
}

export enum ContentReportStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  ACTION_TAKEN = 'ACTION_TAKEN',
  REJECTED = 'REJECTED',
}

export type ContentReportDocument = HydratedDocument<ContentReport>;

@Schema({ timestamps: true, collection: 'content_reports' })
export class ContentReport {
  @Prop({ type: String, enum: ContentReportTargetType, required: true })
  targetType: ContentReportTargetType;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 1, maxlength: 1000 })
  reason: string;

  @Prop({ type: String, enum: ContentReportStatus, default: ContentReportStatus.PENDING, index: true })
  status: ContentReportStatus;

  @Prop({ type: String, trim: true, maxlength: 2000, default: null })
  resolutionNote?: string | null;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  reviewedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

  @Prop({
    type: [{
      status: { type: String, enum: ContentReportStatus, required: true },
      note: { type: String, default: null },
      actorId: { type: Types.ObjectId, ref: User.name, required: true },
      createdAt: { type: Date, required: true },
    }],
    default: [],
  })
  history?: Array<{ status: ContentReportStatus; note?: string | null; actorId: Types.ObjectId; createdAt: Date }>;

  createdAt: Date;
  updatedAt: Date;
}

export const ContentReportSchema = SchemaFactory.createForClass(ContentReport);
ContentReportSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });
ContentReportSchema.index({ createdAt: -1, _id: -1 });
ContentReportSchema.index({ status: 1, createdAt: -1 });
ContentReportSchema.index({ targetType: 1, targetId: 1, createdAt: -1, _id: -1 });
