export interface CoinPackageItem {
  _id: string;
  name: string;
  description?: string | null;
  price: number;
  coinAmount: number;
  bonusCoin: number;
  totalCoin: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCoinPackagePayload {
  name: string;
  description?: string;
  price: number;
  coinAmount: number;
  bonusCoin?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface UpdateCoinPackagePayload {
  name?: string;
  description?: string;
  price?: number;
  coinAmount?: number;
  bonusCoin?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface QueryCoinPackageParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortBy?:
    | "sortOrder"
    | "price"
    | "coinAmount"
    | "totalCoin"
    | "createdAt"
    | "name"
    | "updatedAt";
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

export interface PaginatedCoinPackages {
  items: CoinPackageItem[];
  pagination?: PaginationMeta;
}

export interface CoinPackageApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface SeedCoinPackageResult {
  createdCount: number;
  skippedCount: number;
}
