"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chapterService } from "../services/chapter.service";
import { chapterKeys } from "./chapter.keys";
import { storyKeys } from "@/features/stories";
import { toast } from "@/lib/toast";
import type {
  CreateChapterPayload,
  QueryChaptersParams,
  ReorderChaptersPayload,
  UpdateChapterPayload,
} from "../types";

export function useStoryChapters(params: QueryChaptersParams, enabled = true) {
  return useQuery({
    queryKey: chapterKeys.byStory(params),
    queryFn: async () => {
      const res = await chapterService.getChapters(params);
      return res.data;
    },
    enabled: Boolean(params.storyId) && enabled,
  });
}

export function useChapterDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: chapterKeys.detail(id),
    queryFn: async () => {
      const res = await chapterService.getChapterDetail(id);
      return res.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useChapterHistory(id: string, enabled = true) {
  return useQuery({
    queryKey: chapterKeys.history(id),
    queryFn: async () => {
      const res = await chapterService.getChapterHistory(id);
      return res.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useAllChapterHistory(
  params?: {
    storyId?: string;
    chapterId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
  enabled = true
) {
  return useQuery({
    queryKey: ["chapters", "allHistory", params],
    queryFn: async () => {
      const res = await chapterService.getAllChapterHistory(params);
      return res.data;
    },
    enabled,
  });
}

export function useStoryChaptersStats(storyId: string, enabled = true) {
  return useQuery({
    queryKey: chapterKeys.stats(storyId),
    queryFn: async () => {
      const res = await chapterService.getStoryChaptersStats(storyId);
      return res.data;
    },
    enabled: Boolean(storyId) && enabled,
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateChapterPayload) => {
      const res = await chapterService.createChapter(payload);
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Tạo chương thành công!");
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Tạo chương thất bại!";
      toast.error(msg);
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateChapterPayload;
    }) => {
      const res = await chapterService.updateChapter(id, payload);
      return res;
    },
    onSuccess: (res, variables) => {
      toast.success(res.message || "Cập nhật chương thành công!");
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
      queryClient.invalidateQueries({
        queryKey: chapterKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Cập nhật chương thất bại!";
      toast.error(msg);
    },
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await chapterService.deleteChapter(id);
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Xóa chương thành công!");
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Xóa chương thất bại!";
      toast.error(msg);
    },
  });
}

export function useReorderChapters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storyId,
      payload,
    }: {
      storyId: string;
      payload: ReorderChaptersPayload;
    }) => {
      const res = await chapterService.reorderChapters(storyId, payload);
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Cập nhật thứ tự chương thành công!");
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Sắp xếp thứ tự chương thất bại!";
      toast.error(msg);
    },
  });
}

export function useBulkSubmitChapters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapterIds: string[]) => {
      const res = await chapterService.bulkSubmitChapters(chapterIds);
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Gửi phê duyệt hàng loạt thành công!");
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Gửi phê duyệt hàng loạt thất bại!";
      toast.error(msg);
    },
  });
}
