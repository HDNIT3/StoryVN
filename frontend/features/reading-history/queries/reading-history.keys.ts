export const readingHistoryKeys = {
  all: ["reading-history"] as const,
  list: (params?: Record<string, unknown>) =>
    ["reading-history", "list", ...(params ? [params] : [])] as const,
  story: (storyId: string) => ["reading-history", "story", storyId] as const,
} as const;
