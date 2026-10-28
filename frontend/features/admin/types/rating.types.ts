export type AdminRatingStatus = 'VISIBLE' | 'HIDDEN' | 'DELETED';

export interface AdminRatingUser {
  _id: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  email?: string;
}

export interface AdminRatingStory {
  _id: string;
  title: string;
  slug: string;
  coverUrl?: string;
}

export interface AdminRatingItem {
  _id: string;
  userId: AdminRatingUser;
  storyId: AdminRatingStory;
  rating: number;
  review?: string;
  status: AdminRatingStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminRatingCounts {
  total: number;
  visible: number;
  hidden: number;
  deleted: number;
  avgRating: number;
}

export interface QueryAdminRatingsParams {
  page?: number;
  limit?: number;
  status?: 'ALL' | 'VISIBLE' | 'HIDDEN' | 'DELETED';
  rating?: number;
  search?: string;
  storyId?: string;
  sort?: 'NEWEST' | 'OLDEST' | 'HIGHEST' | 'LOWEST';
}

export interface AdminRatingsListResponse {
  items: AdminRatingItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

