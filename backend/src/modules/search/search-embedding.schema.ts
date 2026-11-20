import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

// Derived data only. No migrations or writes to the existing stories collection.
@Schema({ collection: 'story_search_embeddings', timestamps: true })
export class SearchEmbedding {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  storyId: Types.ObjectId;

  @Prop({ required: true })
  profile: string;

  @Prop({ required: true })
  contentHash: string;

  @Prop({ type: [Number], required: true, select: false })
  vector: number[];
}

export const SearchEmbeddingSchema = SchemaFactory.createForClass(SearchEmbedding);
SearchEmbeddingSchema.index({ storyId: 1, profile: 1 }, { unique: true });
