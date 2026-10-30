import { Types } from 'mongoose';
import {
  ACTIVE_REVISION_STATUSES,
  MAX_REVISIONS_PER_DOCUMENT,
  RevisionStatus,
} from '../enums/revision-status.enum.js';

export interface RevisionLike {
  _id?: Types.ObjectId | string;
  status: RevisionStatus | string;
  snapshot?: Record<string, any>;
  rejectReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Bản chỉnh sửa đang mở (DRAFT / PENDING_REVIEW / REJECTED) mới nhất.
 * Mỗi document tối đa một bản đang mở.
 */
export function getActiveRevision<T extends RevisionLike>(
  revisions?: T[] | null,
): T | null {
  if (!Array.isArray(revisions) || revisions.length === 0) return null;
  for (let i = revisions.length - 1; i >= 0; i--) {
    if (
      ACTIVE_REVISION_STATUSES.includes(
        revisions[i].status as RevisionStatus,
      )
    ) {
      return revisions[i];
    }
  }
  return null;
}

export function getLatestRevisionWithStatus<T extends RevisionLike>(
  revisions: T[] | null | undefined,
  statuses: RevisionStatus[],
): T | null {
  if (!Array.isArray(revisions) || revisions.length === 0) return null;
  for (let i = revisions.length - 1; i >= 0; i--) {
    if (statuses.includes(revisions[i].status as RevisionStatus)) {
      return revisions[i];
    }
  }
  return null;
}

export function hasRevisionWithStatus<T extends RevisionLike>(
  revisions: T[] | null | undefined,
  status: RevisionStatus,
): boolean {
  return (revisions || []).some((r) => r.status === status);
}

/**
 * Giới hạn số bản lịch sử. Khi vượt hạn mức, xóa các bản cũ nhất
 * nhưng luôn giữ bản APPROVED mới nhất (mốc của bản chính thức hiện tại).
 */
export function trimRevisions<T extends RevisionLike>(
  revisions: T[],
  max = MAX_REVISIONS_PER_DOCUMENT,
): void {
  if (!Array.isArray(revisions) || revisions.length <= max) return;

  let protectedIndex = -1;
  for (let i = revisions.length - 1; i >= 0; i--) {
    if (revisions[i].status === RevisionStatus.APPROVED) {
      protectedIndex = i;
      break;
    }
  }

  let excess = revisions.length - max;
  for (let i = 0; i < revisions.length && excess > 0; ) {
    if (i === protectedIndex) {
      i++;
      continue;
    }
    revisions.splice(i, 1);
    if (i < protectedIndex) protectedIndex--;
    excess--;
  }
}

/**
 * Chuyển revision (snapshot lồng nhau) thành object phẳng để trả về API.
 * Snapshot có thể là plain object (lean) hoặc Mongoose subdocument,
 * nên phải chuẩn hóa trước khi spread để tránh lộ field nội bộ của Mongoose.
 */
export function toRevisionView<T extends RevisionLike>(
  revision: T | null | undefined,
  extra: Record<string, any> = {},
): Record<string, any> | null {
  if (!revision) return null;
  const rawSnapshot: any = revision.snapshot;
  const snapshot =
    rawSnapshot && typeof rawSnapshot.toObject === 'function'
      ? rawSnapshot.toObject()
      : { ...(rawSnapshot || {}) };
  return {
    _id: revision._id,
    status: revision.status,
    rejectReason: revision.rejectReason ?? null,
    createdAt: revision.createdAt,
    updatedAt: revision.updatedAt,
    ...snapshot,
    ...extra,
  };
}
