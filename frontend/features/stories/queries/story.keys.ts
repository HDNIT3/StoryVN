export const storyKeys = {
  all: ["stories"] as const,
  filtered: (params?: Record<string, unknown>) =>
    ["stories", "filtered", ...(params ? [params] : [])] as const,
  topViews: (limit?: number) =>
    ["stories", "top-views", limit || 10] as const,
  topWordCount: (limit?: number) =>
    ["stories", "top-word-count", limit || 10] as const,
  myList: (params?: Record<string, unknown>) =>
    ["stories", "my", ...(params ? [params] : [])] as const,
  latestUpdated: (params?: Record<string, unknown>) =>
    ["stories", "latest-updated", ...(params ? [params] : [])] as const,
  detail: (id: string) => ["stories", "detail", id] as const,
  revisions: (id: string) => ["stories", "revisions", id] as const,
  bySlug: (slug: string) => ["stories", "by-slug", slug] as const,
  sameGenre: (slug: string, limit?: number) =>
    ["stories", "same-genre", slug, limit || 6] as const,
} as const;
