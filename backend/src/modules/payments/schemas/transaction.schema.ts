import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransactionStatus } from '../enums/transaction-status.enum.js';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true, collection: 'transactions' })
export class Transaction {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'CoinPackage' })
  packageId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true, trim: true })
  orderCode: string;

  @Prop({ required: true, type: Number, min: 0 })
  amount: number;

  @Prop({ required: true, type: Number, min: 1 })
  coinAmount: number;

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  bonusCoin: number;

  @Prop({ required: true, type: Number, min: 1 })
  totalCoin: number;

  @Prop({
    required: true,
    type: String,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
    index: true,
  })
  status: TransactionStatus;

  @Prop({ type: String, default: null })
  transactionNo?: string | null;

  @Prop({ type: String, default: null })
  bankCode?: string | null;

  @Prop({ type: String, default: null })
  cardType?: string | null;

  @Prop({ type: String, default: null })
  payDate?: string | null;

  @Prop({ type: String, default: null })
  vnpResponseCode?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ userId: 1, createdAt: -1 });

