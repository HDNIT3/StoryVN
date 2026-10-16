import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Story } from '../../stories/schemas/story.schema.js';

export enum ChapterStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  REJECTED = 'REJECTED',
}

export type ChapterDocument = Chapter & Document;

@Schema({ timestamps: true, collection: 'chapters' })
export class Chapter {
  _id: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Story.name,
    required: true,
    index: true,
  })
  storyId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  chapterNumber: number;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  })
  title: string;

  @Prop({
    type: String,
    required: true,
  })
  content: string;

  @Prop({
    type: String,
    enum: ChapterStatus,
    default: ChapterStatus.DRAFT,
    index: true,
  })
  status: ChapterStatus;

  @Prop({
    type: Boolean,
    default: true,
  })
  isFree: boolean;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  coinPrice: number;

  /**
   * UC-15: Ràng buộc phải mua chương trước mới được mua chương này (nếu là chương trả phí).
   * Mặc định là false (hoạt động độc lập).
   */
  @Prop({
    type: Boolean,
    default: false,
  })
  requirePreviousChapter: boolean;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  viewCount: number;

  /**
   * Thời điểm chương hiển thị cho độc giả.
   * - Khi admin duyệt mà tác giả không đặt lịch: scheduledAt = now (hiện ngay).
   * - Khi admin duyệt mà tác giả có đặt lịch: scheduledAt = ngày tác giả chọn.
   * - Reader filter: status = PUBLISHED AND scheduledAt <= now.
   */
  @Prop({
    type: Date,
    default: null,
    index: true,
  })
  scheduledAt?: Date | null;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  rejectReason?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);

// Unique compound index: mỗi truyện không được trùng số thứ tự chương
ChapterSchema.index({ storyId: 1, chapterNumber: 1 }, { unique: true });

// Index phục vụ lọc trạng thái và sắp xếp theo truyện
ChapterSchema.index({ storyId: 1, status: 1 });
ChapterSchema.index({ storyId: 1, createdAt: -1 });
