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
    stories: (params?: Record<string, any>) =>
      ["admin", "stories", ...(params ? [params] : [])] as const,
    storyCounts: ["admin", "stories", "counts"] as const,
    storyDetail: (id: string) => ["admin", "stories", "detail", id] as const,
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
  stories: {
    all: ["stories"] as const,
    filtered: (params?: Record<string, any>) =>
      ["stories", "filtered", ...(params ? [params] : [])] as const,
    topViews: (limit?: number) =>
      ["stories", "top-views", limit || 10] as const,
    myList: (params?: Record<string, any>) =>
      ["stories", "my", ...(params ? [params] : [])] as const,
    latestUpdated: (params?: Record<string, any>) =>
      ["stories", "latest-updated", ...(params ? [params] : [])] as const,
    detail: (id: string) => ["stories", "detail", id] as const,
    bySlug: (slug: string) => ["stories", "by-slug", slug] as const,
    sameGenre: (slug: string, limit?: number) =>
      ["stories", "same-genre", slug, limit || 6] as const,
  },
  media: {
    all: ["media"] as const,
    list: (params?: Record<string, any>) =>
      ["media", "list", ...(params ? [params] : [])] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params?: Record<string, any>) =>
      ["notifications", "list", ...(params ? [params] : [])] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  author: {
    all: ["author"] as const,
    communityStats: ["author", "community-stats"] as const,
    list: (params?: Record<string, any>) =>
      ["author", "list", ...(params ? [params] : [])] as const,
    profile: (username: string) => ["author", "profile", username] as const,
    stories: (username: string, params?: Record<string, any>) =>
      ["author", "stories", username, ...(params ? [params] : [])] as const,
  },
} as const;
