import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import {
  OPEN_STATUSES,
  WithdrawalStatus,
} from '../enums/withdrawal-status.enum.js';

@Schema({ _id: false })
export class WithdrawalEvent {
  @Prop({ type: String, required: true, enum: WithdrawalStatus })
  status: WithdrawalStatus;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  actorId: Types.ObjectId;
  @Prop({ type: Date, required: true }) at: Date;
  @Prop({ type: String, default: '' }) note: string;
}
const EventSchema = SchemaFactory.createForClass(WithdrawalEvent);

@Schema({ timestamps: true, collection: 'withdrawal_requests' })
export class WithdrawalRequest {
  _id: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  authorId: Types.ObjectId;
  @Prop({ type: Number, required: true, min: 1 }) coinAmount: number;
  @Prop({ type: Number, required: true, min: 1 }) exchangeRate: number;
  @Prop({ type: Number, required: true, enum: [70] }) payoutPercent: number;
  @Prop({ type: Number, required: true, min: 1 }) amount: number;
  @Prop({ type: String, required: true }) bankName: string;
  @Prop({ type: String, required: true }) bankAccountNumber: string;
  @Prop({ type: String, required: true }) bankAccountName: string;
  @Prop({
    type: String,
    required: true,
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status: WithdrawalStatus;
  @Prop({ type: String, required: true }) idempotencyKey: string;
  @Prop({ type: String, trim: true }) transactionCode?: string;
  @Prop({ type: String, default: '' }) note: string;
  @Prop({ type: [EventSchema], default: [] }) history: WithdrawalEvent[];
  createdAt: Date;
  updatedAt: Date;
}
export type WithdrawalDocument = HydratedDocument<WithdrawalRequest>;
export const WithdrawalSchema = SchemaFactory.createForClass(WithdrawalRequest);
WithdrawalSchema.index({ authorId: 1, createdAt: -1 });
WithdrawalSchema.index({ status: 1, createdAt: -1 });
WithdrawalSchema.index({ authorId: 1, idempotencyKey: 1 }, { unique: true });
WithdrawalSchema.index(
  { authorId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: OPEN_STATUSES } },
    name: 'one_open_withdrawal_per_author',
  },
);
WithdrawalSchema.index(
  { transactionCode: 1 },
  {
    unique: true,
    partialFilterExpression: { transactionCode: { $type: 'string' } },
  },
);
