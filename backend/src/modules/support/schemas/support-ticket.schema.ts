import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';

export enum SupportTopic {
  ACCOUNT = 'ACCOUNT',
  COINS = 'COINS',
  AUTHOR = 'AUTHOR',
  BUG = 'BUG',
  OTHER = 'OTHER',
}

export enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SupportTicketPriority {
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum SupportSenderRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Schema({ _id: true })
export class SupportMessageItem {
  _id?: Types.ObjectId;

  @Prop({ type: String, enum: SupportSenderRole, required: true })
  senderRole: SupportSenderRole;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  senderId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true, maxlength: 120 })
  senderName: string;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 3000 })
  content: string;

  @Prop({ type: Boolean, default: false })
  emailSent: boolean;

  @Prop({ type: String, default: null })
  emailError?: string | null;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;
}

export const SupportMessageItemSchema = SchemaFactory.createForClass(SupportMessageItem);

export type SupportTicketDocument = HydratedDocument<SupportTicket>;

@Schema({ timestamps: true, collection: 'support_tickets' })
export class SupportTicket {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  ticketCode: string;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null, index: true })
  userId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true, maxlength: 120 })
  senderName: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 160, index: true })
  email: string;

  @Prop({ type: String, enum: SupportTopic, default: SupportTopic.ACCOUNT, index: true })
  topic: SupportTopic;

  @Prop({ type: String, enum: SupportTicketPriority, default: SupportTicketPriority.NORMAL, index: true })
  priority: SupportTicketPriority;

  @Prop({ required: true, trim: true, minlength: 3, maxlength: 180 })
  subject: string;

  @Prop({ required: true, trim: true, minlength: 5, maxlength: 3000 })
  message: string;

  @Prop({ type: String, enum: SupportTicketStatus, default: SupportTicketStatus.OPEN, index: true })
  status: SupportTicketStatus;

  @Prop({ type: [SupportMessageItemSchema], default: [] })
  messages: SupportMessageItem[];

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  lastRepliedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  lastRepliedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
SupportTicketSchema.index({ status: 1, createdAt: -1 });
SupportTicketSchema.index({ userId: 1, createdAt: -1 });
SupportTicketSchema.index({ ticketCode: 1, email: 1 });
