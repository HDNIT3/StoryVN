export const tagKeys = {
  all: ["tags"] as const,
  list: (params?: Record<string, unknown>) =>
    ["tags", "list", ...(params ? [params] : [])] as const,
  detail: (id: string) => ["tags", "detail", id] as const,
} as const;
