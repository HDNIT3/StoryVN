export const chapterKeys = {
  all: ["chapters"] as const,
  byStory: (params: unknown) =>
    ["chapters", "by-story", params] as const,
  bySlug: (slug: string, params?: unknown) =>
    ["chapters", "by-slug", slug, ...(params ? [params] : [])] as const,
  reading: (slug: string, chapterNumber: number | string) =>
    ["chapters", "reading", slug, String(chapterNumber)] as const,
  detail: (id: string) => ["chapters", "detail", id] as const,
  stats: (storyId: string) => ["chapters", "stats", storyId] as const,
  history: (chapterId: string) => ["chapters", "history", chapterId] as const,
  purchased: (storyId?: string) =>
    ["chapters", "purchased", ...(storyId ? [storyId] : [])] as const,
  purchaseHistory: (params?: unknown) =>
    ["chapters", "purchase-history", params] as const,
  unlockStatus: (chapterId: string) =>
    ["chapters", "unlock-status", chapterId] as const,
} as const;
