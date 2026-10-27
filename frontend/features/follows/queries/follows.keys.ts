import type {
  QueryFollowedAuthorsParams,
  QueryFollowedStoriesParams,
} from "../types";

export const followsKeys = {
  all: ["follows"] as const,
  stories: (params?: QueryFollowedStoriesParams) =>
    [...followsKeys.all, "stories", params] as const,
  authors: (params?: QueryFollowedAuthorsParams) =>
    [...followsKeys.all, "authors", params] as const,
  status: (targetType: string, targetId: string) =>
    [...followsKeys.all, "status", targetType, targetId] as const,
  batchStatus: (targetType: string, ids: string[]) =>
    [...followsKeys.all, "batchStatus", targetType, ids] as const,
};
