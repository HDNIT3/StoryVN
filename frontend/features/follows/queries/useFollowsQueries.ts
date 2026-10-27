"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { followsService } from "../services/follows.service";
import { followsKeys } from "./follows.keys";
import type {
  FollowTargetType,
  PaginatedFollowedAuthors,
  PaginatedFollowedStories,
  QueryFollowedAuthorsParams,
  QueryFollowedStoriesParams,
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
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi cập nhật trạng thái theo dõi";
      toast.error(msg);
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
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi bỏ theo dõi";
      toast.error(msg);
    },
  });
}
