// ─── Notification Types ───────────────────────────────────────────
export type NotificationType =
  | 'NEW_CHAPTER'
  | 'FOLLOW'
  | 'COMMENT'
  | 'REPLY'
  | 'FORUM'
  | 'SYSTEM'
  | 'MODERATION';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  storyId?: string | null;
  chapterId?: string | null;
  actorId?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotificationsListResponse {
  items: Notification[];
  pagination: NotificationPagination;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface QueryNotificationsParams {
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  limit?: number;
}
