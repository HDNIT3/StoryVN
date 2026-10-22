export const mediaKeys = {
  all: ["media"] as const,
  list: (params?: unknown) =>
    ["media", "list", ...(params ? [params] : [])] as const,
} as const;
