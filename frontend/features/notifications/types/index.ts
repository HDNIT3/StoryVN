export type NotificationType =
  | 'NEW_CHAPTER'
  | 'FOLLOW'
  | 'COMMENT'
  | 'REPLY'
  | 'FORUM'
  | 'SYSTEM'
  | 'MODERATION';

export interface NotificationStory {
  _id: string;
  title: string;
  slug: string;
  coverUrl?: string;
}

export interface NotificationChapter {
  _id: string;
  chapterNumber: number;
  title: string;
}

export interface NotificationActor {
  _id: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  storyId?: string | NotificationStory | null;
  chapterId?: string | NotificationChapter | null;
  actorId?: string | NotificationActor | null;
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
