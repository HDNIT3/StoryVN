import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from './user.schema.js';

export enum ManagerProfileStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export type ManagerProfileDocument = ManagerProfile & Document;

@Schema({ timestamps: true, collection: 'manager_profiles' })
export class ManagerProfile {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ type: String, default: null, trim: true })
  department?: string | null;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Genre' }],
    default: [],
  })
  genreIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({
    type: String,
    enum: ManagerProfileStatus,
    default: ManagerProfileStatus.ACTIVE,
  })
  status: ManagerProfileStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ManagerProfileSchema = SchemaFactory.createForClass(ManagerProfile);
