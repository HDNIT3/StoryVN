import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { RevisionStatus } from '../../../common/enums/revision-status.enum.js';
import { Genre } from '../../genres/schemas/genre.schema.js';
import { Tag } from '../../tags/schemas/tag.schema.js';
import { User } from '../../users/schemas/user.schema.js';

export enum StoryStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export enum StoryVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum StoryAgeRating {
  ALL = 'ALL',           // Mọi lứa tuổi
  TEEN_13 = '13+',       // Phù hợp từ 13 tuổi trở lên
  MATURE_16 = '16+',     // 16+ (nội dung có đánh nhau/yêu đương)
  ADULT_18 = '18+',      // 18+ (bạo lực mạnh, cảnh nhạy cảm)
}

// Tiến độ sáng tác (khác với StoryStatus là trạng thái kiểm duyệt)
export enum StoryProgressState {
  ONGOING = 'ONGOING',     // Đang ra
  COMPLETED = 'COMPLETED', // Đã hoàn thành
  ON_HOLD = 'ON_HOLD',     // Tạm ngưng
}

@Schema({ _id: false })
export class StoryStats {
  @Prop({ type: Number, default: 0, min: 0 })
  viewCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  followCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  ratingCount: number;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  ratingAverage: number;

  @Prop({ type: Number, default: 0, min: 0 })
  chapterCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  wordCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  commentCount: number;
}

export const StoryStatsSchema = SchemaFactory.createForClass(StoryStats);

/**
 * Ảnh chụp các field nội dung được kiểm duyệt.
 * Không chứa slug, visibility, progressState — các field vận hành áp dụng ngay.
 */
@Schema({ _id: false })
export class StoryRevisionSnapshot {
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, default: '', trim: true })
  description: string;

  @Prop({ type: String, default: null })
  coverUrl?: string | null;

  @Prop({ type: String, default: '', trim: true })
  authorNote?: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: Genre.name }],
    default: [],
  })
  genreIds: Types.ObjectId[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: Tag.name }],
    default: [],
  })
  tagIds: Types.ObjectId[];

  @Prop({ type: String, enum: StoryAgeRating, default: StoryAgeRating.ALL })
  ageRating: StoryAgeRating;
}

export const StoryRevisionSnapshotSchema = SchemaFactory.createForClass(
  StoryRevisionSnapshot,
);

@Schema({ _id: true })
export class StoryRevision {
  _id?: Types.ObjectId;

  @Prop({ type: StoryRevisionSnapshotSchema, required: true })
  snapshot: StoryRevisionSnapshot;

  @Prop({
    type: String,
    enum: RevisionStatus,
    default: RevisionStatus.DRAFT,
  })
  status: RevisionStatus;

  @Prop({ type: String, default: null, trim: true })
  rejectReason?: string | null;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const StoryRevisionSchema = SchemaFactory.createForClass(StoryRevision);

export type StoryDocument = Story & Document;

@Schema({ timestamps: true, collection: 'stories' })
export class Story {
  _id: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  slug: string;

  @Prop({ type: String, default: '', trim: true })
  description: string;

  @Prop({ type: String, default: null })
  coverUrl?: string | null;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: Genre.name }],
    default: [],
  })
  genreIds: Types.ObjectId[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: Tag.name }],
    default: [],
  })
  tagIds: Types.ObjectId[];

  @Prop({
    type: String,
    enum: StoryAgeRating,
    default: StoryAgeRating.ALL,
    index: true,
  })
  ageRating: StoryAgeRating;

  @Prop({
    type: String,
    enum: StoryProgressState,
    default: StoryProgressState.ONGOING,
    index: true,
  })
  progressState: StoryProgressState;

  @Prop({
    type: String,
    enum: StoryStatus,
    default: StoryStatus.DRAFT,
    index: true,
  })
  status: StoryStatus;

  @Prop({ type: String, default: '', trim: true })
  authorNote?: string;

  @Prop({ type: String, default: null, trim: true })
  rejectReason?: string | null;

  @Prop({
    type: String,
    enum: StoryVisibility,
    default: StoryVisibility.PUBLIC,
    index: true,
  })
  visibility: StoryVisibility;

  @Prop({ type: StoryStatsSchema, default: () => ({}) })
  stats: StoryStats;

  @Prop({ type: Date, default: null })
  publishedAt?: Date | null;

  /**
   * Lịch sử các bản chỉnh sửa nội dung (kiểm duyệt).
   * Bản chính thức luôn là các field top-level; chỉ APPROVE mới ghi đè.
   * `select: false` để API công khai không bao giờ trả về nội dung đang chờ duyệt.
   */
  @Prop({ type: [StoryRevisionSchema], default: [], select: false })
  revisions: StoryRevision[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);

StorySchema.index({ 'revisions.status': 1 });
