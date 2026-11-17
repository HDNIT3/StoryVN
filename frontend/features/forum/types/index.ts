export type ForumPostStatus = "PENDING" | "VISIBLE" | "HIDDEN" | "REJECTED" | "DELETED";

export interface ForumUser {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface ForumPost {
  _id: string;
  title: string;
  content: string;
  contentFormat?: "plain" | "html";
  status: ForumPostStatus;
  userId: ForumUser | null;
  likeCount?: number;
  likedByMe?: boolean;
  viewCount?: number;
  shareCount?: number;
  sharedByMe?: boolean;
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
  reportCount?: number;
}

export interface ForumStats {
  total: number;
  PENDING: number;
  VISIBLE: number;
  HIDDEN: number;
  REJECTED: number;
  DELETED: number;
  views: number;
  likes: number;
  shares: number;
  counterScope?: string;
}

export interface ForumPage<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ForumPostInput {
  title: string;
  content: string;
  contentFormat: "html";
}

export interface ForumReport {
  _id: string;
  userId: ForumUser | null;
  reason?: string;
  createdAt: string;
}
