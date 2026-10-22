"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { storyService } from "../services/story.service";
import { storyKeys } from "./story.keys";
import { toast } from "@/lib/toast";
import type {
  CreateStoryPayload,
  FilterStoriesParams,
  QueryMyStoriesParams,
  QueryRecentStoriesParams,
  StoryAction,
  UpdateStoryPayload,
} from "../types";

export function useStories(params?: FilterStoriesParams) {
  return useQuery({
    queryKey: storyKeys.filtered(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await storyService.getStories(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useTopViews(limit = 10) {
  return useQuery({
    queryKey: storyKeys.topViews(limit),
    queryFn: async () => {
      const res = await storyService.getTopViews(limit);
      return res.data;
    },
  });
}

export function useTopWordCount(limit = 10) {
  return useQuery({
    queryKey: storyKeys.topWordCount(limit),
    queryFn: async () => {
      const res = await storyService.getTopWordCount(limit);
      return res.data;
    },
  });
}

export function useLatestUpdated(params?: QueryRecentStoriesParams) {
  return useQuery({
    queryKey: storyKeys.latestUpdated(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await storyService.getLatestUpdated(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useStoryBySlug(slug: string, enabled = true) {
  return useQuery({
    queryKey: storyKeys.bySlug(slug),
    queryFn: async () => {
      const res = await storyService.getStoryBySlug(slug);
      return res.data;
    },
    enabled: Boolean(slug) && enabled,
  });
}

export function useSameGenreStories(slug: string, limit = 6, enabled = true) {
  return useQuery({
    queryKey: storyKeys.sameGenre(slug, limit),
    queryFn: async () => {
      const res = await storyService.getSameGenreStories(slug, limit);
      return res.data;
    },
    enabled: Boolean(slug) && enabled,
  });
}

export function useMyStories(params?: QueryMyStoriesParams) {
  return useQuery({
    queryKey: storyKeys.myList(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await storyService.getMyStories(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useMyStoryDetail(slugOrId: string) {
  return useQuery({
    queryKey: storyKeys.detail(slugOrId),
    queryFn: async () => {
      const res = await storyService.getMyStories({ limit: 100 });
      const found = res.data?.items?.find(
        (s) => s.slug === slugOrId || s._id === slugOrId || s.id === slugOrId
      );
      if (!found) {
        throw new Error("Không tìm thấy tác phẩm trong danh sách của bạn");
      }
      return found;
    },
    enabled: Boolean(slugOrId),
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payload,
      action,
    }: {
      payload: CreateStoryPayload;
      action?: StoryAction;
    }) => {
      const res = await storyService.createStory(payload, action);
      return res;
    },
    onSuccess: (_, variables) => {
      const isSubmit = variables.action === "SUBMIT";
      toast.success(
        isSubmit
          ? "Đã tạo và gửi duyệt tác phẩm thành công!"
          : "Đã lưu bản nháp tác phẩm thành công!"
      );
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể tạo tác phẩm";
      toast.error(msg);
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
      action,
    }: {
      id: string;
      payload: UpdateStoryPayload;
      action?: StoryAction;
    }) => {
      const res = await storyService.updateMyStory(id, payload, action);
      return res;
    },
    onSuccess: (_, variables) => {
      const isSubmit = variables.action === "SUBMIT";
      toast.success(
        isSubmit
          ? "Đã cập nhật và gửi duyệt tác phẩm!"
          : "Đã cập nhật tác phẩm thành công!"
      );
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể cập nhật tác phẩm";
      toast.error(msg);
    },
  });
}
