export type FollowTargetType = "STORY" | "AUTHOR";

export type FollowStorySortOption = "followedAt" | "updated" | "title";

export interface FollowedStoryAuthor {
  _id: string;
  username: string;
  displayName: string;
  penName: string;
  avatarUrl: string | null;
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
