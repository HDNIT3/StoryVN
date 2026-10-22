export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params?: Record<string, unknown>) =>
    ["notifications", "list", ...(params ? [params] : [])] as const,
  unreadCount: ["notifications", "unread-count"] as const,
} as const;
