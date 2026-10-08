export interface TagItem {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTagPayload {
  name: string;
  slug?: string;
  isActive?: boolean;
}

export interface UpdateTagPayload {
  name?: string;
  slug?: string;
  isActive?: boolean;
}

export interface QueryTagParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "createdAt" | "name" | "slug" | "updatedAt";
  sortOrder?: "asc" | "desc";
  all?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedTags {
  items: TagItem[];
  pagination?: PaginationMeta;
}

export interface TagApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface SeedTagResult {
  total: number;
  createdCount: number;
  skippedCount: number;
  createdItems: TagItem[];
}
