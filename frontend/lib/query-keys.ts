/**
 * Query Keys Factory for TanStack Query
 * Giúp quản lý cache key tập trung, tránh gõ nhầm string và hỗ trợ invalidate chính xác
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: ["auth", "me"] as const,
  },
  user: {
    all: ["user"] as const,
    profile: ["user", "profile"] as const,
    authorStatus: ["user", "author-status"] as const,
  },
  authorRequest: {
    all: ["author-request"] as const,
    myStatus: ["author-request", "my-status"] as const,
  },
  admin: {
    all: ["admin"] as const,
    users: (params?: Record<string, any>) =>
      ["admin", "users", ...(params ? [params] : [])] as const,
    userStats: ["admin", "users", "stats"] as const,
    authorRequests: (params?: Record<string, any>) =>
      ["admin", "author-requests", ...(params ? [params] : [])] as const,
    authorRequestStats: ["admin", "author-requests", "stats"] as const,
  },
  tags: {
    all: ["tags"] as const,
    list: (params?: Record<string, any>) =>
      ["tags", "list", ...(params ? [params] : [])] as const,
    detail: (id: string) => ["tags", "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (params?: Record<string, any>) =>
      ["categories", "list", ...(params ? [params] : [])] as const,
    detail: (id: string) => ["categories", "detail", id] as const,
  },
} as const;
