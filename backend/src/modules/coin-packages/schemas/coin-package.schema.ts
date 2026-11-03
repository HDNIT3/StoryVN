import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CoinPackageDocument = CoinPackage & Document;

@Schema({ timestamps: true, collection: 'coin_packages' })
export class CoinPackage {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ type: String, default: null, trim: true })
  description?: string | null;

  @Prop({ required: true, type: Number, min: 0 })
  price: number;

  @Prop({ required: true, type: Number, min: 0 })
  coinAmount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  bonusCoin: number;

  @Prop({ required: true, type: Number, min: 0 })
  totalCoin: number;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isFeatured: boolean;

  @Prop({ required: true, type: Number, min: 1, default: 1, index: true })
  sortOrder: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CoinPackageSchema = SchemaFactory.createForClass(CoinPackage);

CoinPackageSchema.index({ isActive: 1, sortOrder: 1 });
