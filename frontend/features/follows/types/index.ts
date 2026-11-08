export type FollowTargetType = "STORY" | "AUTHOR";

export type FollowBookshelfTab = "STORY" | "UPDATES" | "AUTHOR";

export type FollowStorySortOption = "followedAt" | "updatedAt" | "title";

export interface FollowedStoryAuthor {
  _id: string;
  username: string;
  displayName: string;
  penName: string;
  avatarUrl: string | null;
}

export interface FollowedChapterBrief {
  _id: string;
  chapterNumber: number;
  title: string;
  wordCount: number;
  releasedAt: string;
  isUnread?: boolean;
  isRead?: boolean;
}

export interface FollowedStoryStats {
  viewCount: number;
  followCount: number;
  chapterCount: number;
  ratingAverage: number;
}

export interface FollowedStoryItem {
  _id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  description: string;
  author: FollowedStoryAuthor | null;
  stats: FollowedStoryStats;
  progressState: "ONGOING" | "COMPLETED" | "ON_HOLD" | string;
  updatedAt: string;
  followedAt: string;
  latestChapter?: FollowedChapterBrief | null;
  unreadChapterCount?: number;
  lastReadChapterNumber?: number | null;
}

export interface FollowedStoryUpdateItem {
  story: {
    _id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    progressState: "ONGOING" | "COMPLETED" | "ON_HOLD" | string;
    author: FollowedStoryAuthor | null;
    stats: {
      chapterCount: number;
      viewCount: number;
    };
  };
  followedAt: string;
  updatesSeenAt: string | null;
  latestChapter: FollowedChapterBrief;
  recentNewChapters: FollowedChapterBrief[];
  unreadChapterCount: number;
  hasUnread: boolean;
  lastReadChapterNumber: number | null;
  targetChapterNumber: number;
}

export interface FollowedUpdatesSummary {
  unreadStoriesCount: number;
  unreadChaptersCount: number;
}

export interface PaginatedFollowedStoryUpdates {
  items: FollowedStoryUpdateItem[];
  pagination: PaginationMeta;
  summary: FollowedUpdatesSummary;
}

export interface QueryFollowedUpdatesParams {
  page?: number;
  limit?: number;
  search?: string;
  onlyUnread?: boolean;
}

export interface FollowedAuthorStoryItem {
  _id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  progressState: "ONGOING" | "COMPLETED" | "ON_HOLD" | string;
  updatedAt: string;
  followedAt: string;
  stats: {
    chapterCount: number;
    viewCount: number;
  };
}

export interface FollowedAuthorItem {
  _id: string;
  username: string;
  displayName: string;
  penName: string;
  avatarUrl: string | null;
  biography: string;
  followerCount: number;
  storyCount: number;
  totalViews: number;
  followedAt: string;
  followedStories?: FollowedAuthorStoryItem[];
  followedStoryCount?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface PaginatedFollowedStories {
  items: FollowedStoryItem[];
  pagination: PaginationMeta;
}

export interface PaginatedFollowedAuthors {
  items: FollowedAuthorItem[];
  pagination: PaginationMeta;
}

export interface QueryFollowedStoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: FollowStorySortOption;
}

export interface QueryFollowedAuthorsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ToggleFollowResult {
  isFollowing: boolean;
  targetType: FollowTargetType;
  targetId: string;
}

export interface ToggleFollowPayload {
  targetType: FollowTargetType;
  targetId: string;
}
