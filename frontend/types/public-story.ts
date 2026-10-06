// Types for public story pages

import type {
  PaginationMeta,
  PopulatedRef,
  StoryAgeRating,
  StoryApiResponse,
  StoryOriginType,
  StoryProgressState,
  StoryStats,
} from "./story";

export interface PublicAuthorInfo {
  _id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  penName?: string;
}

export interface PublicStoryItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  genreIds?: PopulatedRef[];
  tagIds?: PopulatedRef[];
  ageRating?: StoryAgeRating;
  progressState?: StoryProgressState;
  originType?: StoryOriginType;
  stats: StoryStats;
  authorId?: string | PublicAuthorInfo;
  author?: PublicAuthorInfo | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStoryDetail extends PublicStoryItem {
  authorNote?: string;
  interaction: {
    liked: boolean;
    followed: boolean;
    myRating: number | null;
  };
}

export interface QueryPublicStoriesParams {
  search?: string;
  genre?: string;
  tag?: string;
  ageRating?: StoryAgeRating;
  progressState?: StoryProgressState;
  originType?: StoryOriginType;
  sortBy?: "viewCount" | "likeCount" | "followCount" | "ratingAverage" | "chapterCount" | "updatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedPublicStories {
  items: PublicStoryItem[];
  pagination: PaginationMeta;
}

export interface StoryInteractionResult {
  liked: boolean;
  likeCount: number;
}

export interface StoryFollowResult {
  followed: boolean;
  followCount: number;
}

export interface StoryRatingResult {
  ratingAverage: number;
  ratingCount: number;
  myScore: number;
}
