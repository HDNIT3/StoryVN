export type CommentStatus = "VISIBLE" | "HIDDEN" | "DELETED";

export interface CommentUser {
  _id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface CommentChapter {
  _id: string;
  chapterNumber: number;
  title: string;
}

export interface CommentItem {
  _id: string;
  userId: CommentUser;
  storyId: string;
  chapterId?: CommentChapter | null;
  parentId?: string | null;
  replyToUserId?: CommentUser | null;
  content: string;
  status: CommentStatus;
  replyCount: number;
  isStoryAuthor?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  storyId: string;
  chapterId?: string | null;
  parentId?: string | null;
  replyToUserId?: string | null;
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}

export interface QueryCommentsParams {
  page?: number;
  limit?: number;
  chapterId?: string;
  onlyStoryLevel?: boolean;
  sort?: "NEWEST" | "OLDEST";
}

export interface QueryRepliesParams {
  page?: number;
  limit?: number;
}

export interface PaginatedCommentsResponse {
  items: CommentItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

