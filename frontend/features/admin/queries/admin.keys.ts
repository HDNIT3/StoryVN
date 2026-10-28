export const adminKeys = {
  all: ["admin"] as const,
  users: (params?: Record<string, unknown>) =>
    ["admin", "users", ...(params ? [params] : [])] as const,
  userStats: ["admin", "users", "stats"] as const,
  authorRequests: (params?: Record<string, unknown>) =>
    ["admin", "author-requests", ...(params ? [params] : [])] as const,
  authorRequestStats: ["admin", "author-requests", "stats"] as const,
  stories: (params?: Record<string, unknown>) =>
    ["admin", "stories", ...(params ? [params] : [])] as const,
  storyCounts: ["admin", "stories", "counts"] as const,
  storyDetail: (id: string) => ["admin", "stories", "detail", id] as const,
  chapters: (params?: Record<string, unknown>) =>
    ["admin", "chapters", ...(params ? [params] : [])] as const,
  chapterCounts: (storyId?: string) =>
    ["admin", "chapters", "counts", ...(storyId ? [storyId] : [])] as const,
  chapterDetail: (id: string) => ["admin", "chapters", "detail", id] as const,
  comments: (params?: Record<string, unknown>) =>
    ["admin", "comments", ...(params ? [params] : [])] as const,
  commentCounts: ["admin", "comments", "counts"] as const,
  ratings: (params?: Record<string, unknown>) =>
    ["admin", "ratings", ...(params ? [params] : [])] as const,
  ratingCounts: ["admin", "ratings", "counts"] as const,
} as const;
