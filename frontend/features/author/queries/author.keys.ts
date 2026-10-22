export const authorKeys = {
  all: ["author"] as const,
  communityStats: ["author", "community-stats"] as const,
  list: (params?: Record<string, unknown>) =>
    ["author", "list", ...(params ? [params] : [])] as const,
  profile: (username: string) => ["author", "profile", username] as const,
  stories: (username: string, params?: Record<string, unknown>) =>
    ["author", "stories", username, ...(params ? [params] : [])] as const,
} as const;

export const authorRequestKeys = {
  all: ["author-request"] as const,
  myStatus: ["author-request", "my-status"] as const,
  list: (params?: Record<string, unknown>) =>
    ["author-request", "list", ...(params ? [params] : [])] as const,
} as const;
