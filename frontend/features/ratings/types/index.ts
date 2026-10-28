export type RatingStatus = "VISIBLE" | "HIDDEN" | "DELETED";

export interface RatingUser {
  _id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface StoryRatingItem {
  _id: string;
  userId: RatingUser;
  storyId: string;
  rating: number;
  review?: string;
  status: RatingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummaryData {
  storyId: string;
  ratingAverage: number;
  ratingCount: number;
  breakdown: Record<number, number>;
}

export interface CreateRatingInput {
  rating: number;
  review?: string;
}

export interface QueryRatingsParams {
  page?: number;
  limit?: number;
  rating?: number;
  sort?: "NEWEST" | "OLDEST" | "RATING_DESC" | "RATING_ASC";
}

export interface PaginatedRatingsResponse {
  items: StoryRatingItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

