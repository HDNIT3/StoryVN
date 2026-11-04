import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true, collection: 'wallets' })
export class Wallet {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    type: Types.ObjectId,
    ref: 'User',
  })
  userId: Types.ObjectId;

  /** Tổng số Xu hiện có trong ví */
  @Prop({ required: true, type: Number, default: 0, min: 0 })
  balance: number;

  /** Tổng số Xu đã sử dụng (mua chương, mở khóa nội dung...) */
  @Prop({ required: true, type: Number, default: 0, min: 0 })
  totalSpent: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.index({ balance: -1 });
