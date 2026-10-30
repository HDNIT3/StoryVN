import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { RevisionStatus } from '../../../common/enums/revision-status.enum.js';
import { Story } from '../../stories/schemas/story.schema.js';

export enum ChapterStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  REJECTED = 'REJECTED',
}

/**
 * Ảnh chụp các field nội dung được kiểm duyệt.
 * Không chứa chapterNumber/scheduledAt (không sửa sau khi publish), status, wordCount.
 */
@Schema({ _id: false })
export class ChapterRevisionSnapshot {
  @Prop({ type: String, required: true, trim: true, maxlength: 255 })
  title: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Boolean, default: true })
  isFree: boolean;

  @Prop({ type: Number, default: 0, min: 0 })
  coinPrice: number;

  @Prop({ type: Boolean, default: false })
  requirePreviousChapter: boolean;
}

export const ChapterRevisionSnapshotSchema = SchemaFactory.createForClass(
  ChapterRevisionSnapshot,
);

@Schema({ _id: true })
export class ChapterRevision {
  _id?: Types.ObjectId;

  @Prop({ type: ChapterRevisionSnapshotSchema, required: true })
  snapshot: ChapterRevisionSnapshot;

  @Prop({
    type: String,
    enum: RevisionStatus,
    default: RevisionStatus.DRAFT,
  })
  status: RevisionStatus;

  @Prop({ type: String, default: null, trim: true })
  rejectReason?: string | null;

  /**
   * Người duyệt bản sửa (giữ lại thông tin kiểm duyệt, kể cả dữ liệu cũ đã chuyển đổi).
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  reviewerId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ChapterRevisionSchema = SchemaFactory.createForClass(ChapterRevision);

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

  /**
   * Số từ của nội dung chương (đã loại bỏ thẻ HTML).
   * Được tính lại mỗi khi tạo/cập nhật/duyệt chương.
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  wordCount: number;

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

  /**
   * Lịch sử các bản chỉnh sửa nội dung (kiểm duyệt).
   * Bản chính thức luôn là các field top-level; chỉ APPROVE mới ghi đè.
   * `select: false` để API công khai không bao giờ trả về nội dung đang chờ duyệt.
   */
  @Prop({ type: [ChapterRevisionSchema], default: [], select: false })
  revisions: ChapterRevision[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);

// Unique compound index: mỗi truyện không được trùng số thứ tự chương
ChapterSchema.index({ storyId: 1, chapterNumber: 1 }, { unique: true });

// Index phục vụ lọc trạng thái và sắp xếp theo truyện
ChapterSchema.index({ storyId: 1, status: 1 });
ChapterSchema.index({ storyId: 1, createdAt: -1 });
ChapterSchema.index({ 'revisions.status': 1 });
