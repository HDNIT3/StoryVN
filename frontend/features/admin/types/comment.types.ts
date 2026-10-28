export type AdminCommentStatus = 'VISIBLE' | 'HIDDEN' | 'DELETED';

export interface AdminCommentUser {
  _id: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  email?: string;
  role?: string;
}

export interface AdminCommentStory {
  _id: string;
  title: string;
  slug: string;
  coverUrl?: string;
}

export interface AdminCommentChapter {
  _id: string;
  chapterNumber: number;
  title: string;
}

export interface AdminCommentItem {
  _id: string;
  userId: AdminCommentUser;
  replyToUserId?: AdminCommentUser | null;
  storyId?: AdminCommentStory | null;
  chapterId?: AdminCommentChapter | null;
  parentId?: string | null;
  content: string;
  status: AdminCommentStatus;
  replyCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminCommentCounts {
  total: number;
  visible: number;
  hidden: number;
  deleted: number;
}

export interface QueryAdminCommentsParams {
  page?: number;
  limit?: number;
  status?: 'ALL' | 'VISIBLE' | 'HIDDEN' | 'DELETED';
  search?: string;
  storyId?: string;
  sort?: 'NEWEST' | 'OLDEST';
}

export interface AdminCommentsListResponse {
  items: AdminCommentItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

