export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface QueryCategoryParams {
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

export interface PaginatedCategories {
  items: CategoryItem[];
  pagination?: PaginationMeta;
}

export interface CategoryApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface SeedCategoryResult {
  total: number;
  createdCount: number;
  skippedCount: number;
  createdItems: CategoryItem[];
}
