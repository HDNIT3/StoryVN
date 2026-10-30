export type ChapterStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'HIDDEN'
  | 'REJECTED';

export type ChapterAction = 'DRAFT' | 'SUBMIT' | 'WITHDRAW' | 'DISCARD_UPDATE';

export interface ChapterRevisionItem {
  _id: string;
  chapterId: string | { _id: string; chapterNumber?: number; title?: string; status?: ChapterStatus };
  storyId: string | { _id: string; title?: string; slug?: string; coverUrl?: string };
  authorId: string | { _id: string; displayName?: string; username?: string; avatarUrl?: string };
  title: string;
  content: string;
  isFree: boolean;
  coinPrice: number;
  requirePreviousChapter: boolean;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  isActive?: boolean;
  wordCount?: number;
  rejectReason?: string | null;
  reviewerId?: string | { _id: string; displayName?: string; username?: string; avatarUrl?: string } | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChapterItem {
  _id: string;
  id?: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content?: string;
  status: ChapterStatus;
  isFree: boolean;
  coinPrice: number;
  requirePreviousChapter: boolean;
  viewCount: number;
  wordCount?: number;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  rejectReason?: string | null;
  pendingRevision?: ChapterRevisionItem | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicChapterItem {
  _id: string;
  chapterNumber: number;
  title: string;
  viewCount?: number;
  wordCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChapterPayload {
  storyId: string;
  chapterNumber?: number;
  title: string;
  content: string;
  isFree?: boolean;
  coinPrice?: number;
  requirePreviousChapter?: boolean;
  action?: ChapterAction;
  scheduledAt?: string | null;
}

export interface UpdateChapterPayload {
  chapterNumber?: number;
  title?: string;
  content?: string;
  isFree?: boolean;
  coinPrice?: number;
  requirePreviousChapter?: boolean;
  action?: ChapterAction;
  scheduledAt?: string | null;
}

export interface BulkSubmitChaptersPayload {
  chapterIds: string[];
}

export interface BulkSubmitChaptersResponse {
  submittedCount: number;
  message: string;
}

export interface QueryChaptersParams {
  storyId: string;
  status?: ChapterStatus;
  sortBy?: 'chapterNumber' | 'createdAt' | 'updatedAt' | 'viewCount';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ChapterOrderItem {
  chapterId: string;
  chapterNumber: number;
}

export interface ReorderChaptersPayload {
  orders: ChapterOrderItem[];
}

export interface ChapterStatsData {
  totalChapters: number;
  published: number;
  pending: number;
  draft: number;
  rejected: number;
  totalViews: number;
  totalWords: number;
  paidCount: number;
  freeCount: number;
  topViewed: ChapterItem[];
}

export interface StoryChaptersResponse {
  items: ChapterItem[];
  total: number;
  page: number;
  limit: number;
  story: {
    _id: string;
    title: string;
    slug: string;
    status: string;
  };
  stats?: {
    totalChapters: number;
    published: number;
    pending: number;
    draft: number;
    rejected: number;
    totalViews: number;
    totalWords?: number;
  } | null;
}

export interface AdminChapterItem extends ChapterItem {
  storyId: any;
  isPendingRevisionReview?: boolean;
}

export interface AdminChapterCounts {
  all: number;
  pending: number;
  published: number;
  rejected: number;
  draft: number;
  hidden: number;
}

export interface QueryAdminChaptersParams {
  storyId?: string;
  status?: ChapterStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'chapterNumber' | 'title' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedAdminChapters {
  items: AdminChapterItem[];
  pagination: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
