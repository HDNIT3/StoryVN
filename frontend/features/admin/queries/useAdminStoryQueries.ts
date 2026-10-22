"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { adminStoryService } from "../services/admin-story.service";
import { adminKeys } from "./admin.keys";
import { toast } from "@/lib/toast";
import type { QueryAdminStoriesParams } from "@/features/stories";

export function useAdminStories(params: QueryAdminStoriesParams) {
  return useQuery({
    queryKey: adminKeys.stories(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await adminStoryService.findAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminStoryCounts() {
  return useQuery({
    queryKey: adminKeys.storyCounts,
    queryFn: async () => {
      const res = await adminStoryService.getCounts();
      return res.data;
    },
    refetchInterval: 1000 * 30,
  });
}

export function useAdminStoryDetail(id: string | null) {
  return useQuery({
    queryKey: id ? adminKeys.storyDetail(id) : ["admin", "stories", "detail", "empty"],
    queryFn: async () => {
      if (!id) return null;
      const res = await adminStoryService.findById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useApproveStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string) => {
      const res = await adminStoryService.approve(storyId);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã phê duyệt tác phẩm "${data.title}" thành công!`);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Phê duyệt tác phẩm thất bại";
      toast.error(msg);
    },
  });
}

export function useRejectStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await adminStoryService.reject(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã từ chối tác phẩm "${data.title}" thành công!`);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Từ chối tác phẩm thất bại";
      toast.error(msg);
    },
  });
}

export function useUnpublishStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (arg: string | { id: string; reason?: string }) => {
      const id = typeof arg === "string" ? arg : arg.id;
      const reason = typeof arg === "string" ? undefined : arg.reason;
      const res = await adminStoryService.unpublish(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã gỡ tác phẩm "${data.title}" về bản nháp!`);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Gỡ xuất bản thất bại";
      toast.error(msg);
    },
  });
}

export function useHideStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (arg: string | { id: string; reason?: string }) => {
      const id = typeof arg === "string" ? arg : arg.id;
      const reason = typeof arg === "string" ? undefined : arg.reason;
      const res = await adminStoryService.hide(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã ẩn tác phẩm "${data.title}" thành công!`);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Ẩn tác phẩm thất bại";
      toast.error(msg);
    },
  });
}

export function useUnhideStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await adminStoryService.unhide(id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã mở lại tác phẩm "${data.title}" thành công!`);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Mở lại tác phẩm thất bại";
      toast.error(msg);
    },
  });
}

