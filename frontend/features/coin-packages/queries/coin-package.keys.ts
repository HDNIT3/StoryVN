export const coinPackageKeys = {
  all: ["coin-packages"] as const,
  userList: () => ["coin-packages", "user-list"] as const,
  adminList: (params?: Record<string, unknown>) =>
    ["coin-packages", "admin-list", ...(params ? [params] : [])] as const,
  detail: (id: string) => ["coin-packages", "detail", id] as const,
} as const;
