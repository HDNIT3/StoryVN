import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';

export enum ContentReportTargetType {
  FORUM_POST = 'FORUM_POST',
  STORY = 'STORY',
  CHAPTER = 'CHAPTER',
  COMMENT = 'COMMENT',
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

  createdAt: Date;
  updatedAt: Date;
}

export const ContentReportSchema = SchemaFactory.createForClass(ContentReport);
ContentReportSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });
ContentReportSchema.index({ createdAt: -1, _id: -1 });
ContentReportSchema.index({ targetType: 1, targetId: 1, createdAt: -1, _id: -1 });
