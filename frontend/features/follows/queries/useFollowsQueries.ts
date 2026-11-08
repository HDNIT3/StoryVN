"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { notificationKeys } from "@/features/notifications/queries/notification.keys";
import { followsService } from "../services/follows.service";
import { followsKeys } from "./follows.keys";
import type {
  FollowTargetType,
  FollowedUpdatesSummary,
  PaginatedFollowedAuthors,
  PaginatedFollowedStories,
  PaginatedFollowedStoryUpdates,
  QueryFollowedAuthorsParams,
  QueryFollowedStoriesParams,
  QueryFollowedUpdatesParams,
  ToggleFollowPayload,
} from "../types";

const DEFAULT_STORIES_PAGINATION: PaginatedFollowedStories = {
  items: [],
  pagination: {
    page: 1,
    limit: 9,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  },
};

const DEFAULT_AUTHORS_PAGINATION: PaginatedFollowedAuthors = {
  items: [],
  pagination: {
    page: 1,
    limit: 6,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  },
};

const DEFAULT_UPDATES_PAGINATION: PaginatedFollowedStoryUpdates = {
  items: [],
  pagination: {
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  },
  summary: {
    unreadStoriesCount: 0,
    unreadChaptersCount: 0,
  },
};

const DEFAULT_UPDATES_SUMMARY: FollowedUpdatesSummary = {
  unreadStoriesCount: 0,
  unreadChaptersCount: 0,
};

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null) {
    const maybeErr = err as {
      response?: { data?: { message?: unknown } };
      message?: unknown;
    };
    const apiMsg = maybeErr.response?.data?.message;
    if (typeof apiMsg === "string" && apiMsg.trim()) return apiMsg;
    if (Array.isArray(apiMsg) && typeof apiMsg[0] === "string") return apiMsg[0];
    if (typeof maybeErr.message === "string" && maybeErr.message.trim()) {
      return maybeErr.message;
    }
  }
  return fallback;
}

export function useFollowedStories(
  params?: QueryFollowedStoriesParams,
  enabled = true
) {
  return useQuery({
    queryKey: followsKeys.stories(params),
    queryFn: async () => {
      const res = await followsService.getFollowedStories(params);
      return res?.data ?? DEFAULT_STORIES_PAGINATION;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30s
  });
}

export function useFollowedAuthors(
  params?: QueryFollowedAuthorsParams,
  enabled = true
) {
  return useQuery({
    queryKey: followsKeys.authors(params),
    queryFn: async () => {
      const res = await followsService.getFollowedAuthors(params);
      return res?.data ?? DEFAULT_AUTHORS_PAGINATION;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30s
  });
}

export function useFollowedUpdates(
  params?: QueryFollowedUpdatesParams,
  enabled = true
) {
  return useQuery({
    queryKey: followsKeys.updates(params),
    queryFn: async () => {
      const res = await followsService.getFollowedUpdates(params);
      return res?.data ?? DEFAULT_UPDATES_PAGINATION;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 20, // 20s
  });
}

export function useFollowedUpdatesUnreadCount(enabled = true) {
  return useQuery({
    queryKey: followsKeys.updatesUnreadCount(),
    queryFn: async () => {
      const res = await followsService.getFollowedUpdatesUnreadCount();
      return res?.data ?? DEFAULT_UPDATES_SUMMARY;
    },
    enabled,
    staleTime: 1000 * 20, // 20s
  });
}

export function useMarkFollowedUpdatesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId?: string) => {
      const res = await followsService.markFollowedUpdatesRead(storyId);
      return { result: res.data, storyId };
    },
    onSuccess: ({ storyId }) => {
      queryClient.invalidateQueries({ queryKey: followsKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(
        storyId
          ? "Đã đánh dấu đã xem chương mới cho truyện"
          : "Đã đánh dấu tất cả chương mới là đã xem"
      );
    },
    onError: (err: unknown) => {
      toast.error(
        getApiErrorMessage(err, "Không thể đánh dấu đã xem chương mới")
      );
    },
  });
}

export function useFollowStatus(
  targetType: FollowTargetType,
  targetId: string,
  enabled = true
) {
  return useQuery({
    queryKey: followsKeys.status(targetType, targetId),
    queryFn: async () => {
      const res = await followsService.checkStatus(targetType, targetId);
      return res?.data ?? { isFollowing: false };
    },
    enabled: Boolean(targetId) && enabled,
    staleTime: 1000 * 60, // 1m
  });
}

export function useFollowStatusBatch(
  targetType: FollowTargetType,
  targetIds: string[],
  enabled = true
) {
  return useQuery({
    queryKey: followsKeys.batchStatus(targetType, targetIds),
    queryFn: async () => {
      const res = await followsService.checkBatchStatus(targetType, targetIds);
      return res?.data ?? {};
    },
    enabled: Boolean(targetIds.length) && enabled,
    staleTime: 1000 * 60, // 1m
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ToggleFollowPayload) => {
      const res = await followsService.toggleFollow(payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: followsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["author"] });
      toast.success(
        data.isFollowing
          ? data.targetType === "STORY"
            ? "Đã thêm truyện vào tủ theo dõi!"
            : "Đã theo dõi tác giả thành công!"
          : data.targetType === "STORY"
          ? "Đã bỏ theo dõi truyện!"
          : "Đã bỏ theo dõi tác giả!"
      );
    },
    onError: (err: unknown) => {
      toast.error(
        getApiErrorMessage(
          err,
          "Có lỗi xảy ra khi cập nhật trạng thái theo dõi"
        )
      );
    },
  });
}

export function useUnfollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
    }: {
      targetType: FollowTargetType;
      targetId: string;
    }) => {
      const res = await followsService.unfollow(targetType, targetId);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: followsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["author"] });
      toast.success(
        data.targetType === "STORY"
          ? "Đã bỏ theo dõi truyện!"
          : "Đã bỏ theo dõi tác giả!"
      );
    },
    onError: (err: unknown) => {
      toast.error(
        getApiErrorMessage(err, "Có lỗi xảy ra khi bỏ theo dõi")
      );
    },
  });
}
