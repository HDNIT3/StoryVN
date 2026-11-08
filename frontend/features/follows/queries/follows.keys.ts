import type {
  QueryFollowedAuthorsParams,
  QueryFollowedStoriesParams,
  QueryFollowedUpdatesParams,
} from "../types";

export const followsKeys = {
  all: ["follows"] as const,
  stories: (params?: QueryFollowedStoriesParams) =>
    [...followsKeys.all, "stories", params] as const,
  authors: (params?: QueryFollowedAuthorsParams) =>
    [...followsKeys.all, "authors", params] as const,
  updates: (params?: QueryFollowedUpdatesParams) =>
    [...followsKeys.all, "updates", params] as const,
  updatesUnreadCount: () =>
    [...followsKeys.all, "updates-unread-count"] as const,
  status: (targetType: string, targetId: string) =>
    [...followsKeys.all, "status", targetType, targetId] as const,
  batchStatus: (targetType: string, ids: string[]) =>
    [...followsKeys.all, "batchStatus", targetType, ids] as const,
};
