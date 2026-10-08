export type StoryStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";
export type StoryVisibility = "PUBLIC" | "PRIVATE";
export type StoryAgeRating = "ALL" | "13+" | "16+" | "18+";
export type StoryProgressState = "ONGOING" | "COMPLETED" | "ON_HOLD";
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
  authorNote?: string;
  stats: StoryStats;
  authorPenName?: string;
  rejectReason?: string | null;
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

export interface AdminStoryAuthor {
  _id: string;
  displayName: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  createdAt?: string;
}

export interface AdminStoryItem extends Omit<StoryItem, "authorId"> {
  authorId?: AdminStoryAuthor | any;
  authorProfile?: {
    penName?: string;
    bio?: string;
    storyCount?: number;
    level?: number;
  } | null;
}

export interface AdminStoryCounts {
  all: number;
  pending: number;
  published: number;
  rejected: number;
  draft: number;
  hidden: number;
}

export interface QueryAdminStoriesParams {
  status?: StoryStatus;
  visibility?: StoryVisibility;
  genreId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedAdminStories {
  items: AdminStoryItem[];
  pagination: PaginationMeta;
}

