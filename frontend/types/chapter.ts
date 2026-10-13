export type ChapterStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'HIDDEN'
  | 'REJECTED';

export type ChapterAction = 'DRAFT' | 'SUBMIT';

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
  publishedAt?: string | null;
  rejectReason?: string | null;
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
}

export interface UpdateChapterPayload {
  chapterNumber?: number;
  title?: string;
  content?: string;
  isFree?: boolean;
  coinPrice?: number;
  requirePreviousChapter?: boolean;
  action?: ChapterAction;
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
  } | null;
}
