export const categoryKeys = {
  all: ["categories"] as const,
  list: (params?: Record<string, unknown>) =>
    ["categories", "list", ...(params ? [params] : [])] as const,
  detail: (id: string) => ["categories", "detail", id] as const,
} as const;
