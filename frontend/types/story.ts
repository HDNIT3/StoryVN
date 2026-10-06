export type StoryStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";
export type StoryVisibility = "PUBLIC" | "PRIVATE";
export type StoryAgeRating = "ALL" | "13+" | "16+" | "18+";
export type StoryProgressState = "ONGOING" | "COMPLETED" | "ON_HOLD";
export type StoryOriginType = "ORIGINAL" | "TRANSLATED" | "CONVERT";
export type StoryAction = "DRAFT" | "SUBMIT";

export interface PopulatedRef {
  _id: string;
  name: string;
  slug: string;
}

export interface StoryStats {
  viewCount: number;
  followCount: number;
  ratingCount: number;
  ratingAverage: number;
  chapterCount: number;
  wordCount?: number;
  likeCount: number;
}

export interface StoryItem {
  _id: string;
  id?: string;
  authorId?: string;
  title: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  genreIds?: (string | PopulatedRef)[];
  tagIds?: (string | PopulatedRef)[];
  genres?: string[];
  tags?: string[];
  status: StoryStatus;
  visibility: StoryVisibility;
  ageRating?: StoryAgeRating;
  progressState?: StoryProgressState;
  originType?: StoryOriginType;
  authorNote?: string;
  stats: StoryStats;
  authorPenName?: string;
  rejectReason?: string | null;
  authorFeedback?: string | null;
  appealedAt?: string | null;
  publishedAt?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface CreateStoryPayload {
  title: string;
  slug?: string;
  description?: string;
  coverImage?: string;
  coverUrl?: string;
  genreIds?: string[];
  tagIds?: string[];
  ageRating?: StoryAgeRating;
  progressState?: StoryProgressState;
  originType?: StoryOriginType;
  visibility?: StoryVisibility;
  authorNote?: string;
  action?: StoryAction;
}

export interface UpdateStoryPayload extends Partial<CreateStoryPayload> {}

export interface QueryMyStoriesParams {
  status?: StoryStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "updatedAt" | "createdAt" | "title" | "viewCount" | "chapterCount";
  sortOrder?: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedStories {
  items: StoryItem[];
  pagination: PaginationMeta;
}

export interface StoryApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface StoryAuthorInfo {
  _id: string;
  displayName: string;
  username: string;
  email?: string;
  avatarUrl?: string | null;
  penName?: string;
  biography?: string;
}

export interface AdminStoryItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  genreIds?: PopulatedRef[];
  tagIds?: PopulatedRef[];
  status: StoryStatus;
  visibility: StoryVisibility;
  ageRating?: StoryAgeRating;
  progressState?: StoryProgressState;
  originType?: StoryOriginType;
  authorNote?: string;
  rejectReason?: string | null;
  authorFeedback?: string | null;
  appealedAt?: string | null;
  reviewedBy?: {
    _id: string;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  } | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  stats?: StoryStats;
  authorId?: string | StoryAuthorInfo;
  author?: StoryAuthorInfo | null;
  createdAt: string;
  updatedAt: string;
}

export type StoryReviewDecision = "APPROVED" | "REJECTED";

export interface ReviewStoryPayload {
  action: StoryReviewDecision;
  rejectReason?: string;
}

export interface AppealStoryPayload {
  feedback: string;
}

export interface QueryAdminStoriesParams {
  status?: StoryStatus | "ALL";
  search?: string;
  hasAppeal?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "appealedAt" | "title";
  sortOrder?: "asc" | "desc";
}

export interface AdminStoryStatsData {
  total: number;
  pending: number;
  published: number;
  rejected: number;
  appealed: number;
}

export interface PaginatedAdminStories {
  items: AdminStoryItem[];
  pagination: PaginationMeta;
}

