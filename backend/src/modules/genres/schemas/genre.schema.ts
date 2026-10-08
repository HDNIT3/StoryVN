import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GenreDocument = Genre & Document;

@Schema({ timestamps: true, collection: 'genres' })
export class Genre {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  slug: string;

  @Prop({ type: String, default: null, trim: true })
  description?: string | null;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const GenreSchema = SchemaFactory.createForClass(Genre);
