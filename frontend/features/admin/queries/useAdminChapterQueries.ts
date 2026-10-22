"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { adminChapterService } from "../services/admin-chapter.service";
import { adminKeys } from "./admin.keys";
import { chapterKeys } from "@/features/chapters";
import { toast } from "@/lib/toast";
import type { QueryAdminChaptersParams } from "@/features/chapters";

export function useAdminChapters(params: QueryAdminChaptersParams) {
  return useQuery({
    queryKey: adminKeys.chapters(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await adminChapterService.findAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminPendingChapters(params?: Omit<QueryAdminChaptersParams, "status">) {
  return useQuery({
    queryKey: adminKeys.chapters({ ...params, status: "PENDING_REVIEW" } as Record<string, unknown>),
    queryFn: async () => {
      const res = await adminChapterService.findPending(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminChapterCounts(storyId?: string) {
  return useQuery({
    queryKey: adminKeys.chapterCounts(storyId),
    queryFn: async () => {
      const res = await adminChapterService.getCounts(storyId);
      return res.data;
    },
    refetchInterval: 1000 * 30,
  });
}

export function useAdminChapterDetail(id: string | null) {
  return useQuery({
    queryKey: id ? adminKeys.chapterDetail(id) : ["admin", "chapters", "detail", "empty"],
    queryFn: async () => {
      if (!id) return null;
      const res = await adminChapterService.findById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useApproveChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await adminChapterService.approve(id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã phê duyệt Chương ${data.chapterNumber}${data.title ? `: "${data.title}"` : ""} thành công!`
      );
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Phê duyệt chương thất bại";
      toast.error(msg);
    },
  });
}

export function useRejectChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await adminChapterService.reject(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã từ chối Chương ${data.chapterNumber}${data.title ? `: "${data.title}"` : ""}!`
      );
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Từ chối chương thất bại";
      toast.error(msg);
    },
  });
}

export function useUnpublishChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (arg: string | { id: string; reason?: string }) => {
      const id = typeof arg === "string" ? arg : arg.id;
      const reason = typeof arg === "string" ? undefined : arg.reason;
      const res = await adminChapterService.unpublish(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã gỡ Chương ${data.chapterNumber}${data.title ? `: "${data.title}"` : ""} về bản nháp!`
      );
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Gỡ xuất bản thất bại";
      toast.error(msg);
    },
  });
}

export function useHideChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (arg: string | { id: string; reason?: string }) => {
      const id = typeof arg === "string" ? arg : arg.id;
      const reason = typeof arg === "string" ? undefined : arg.reason;
      const res = await adminChapterService.hide(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã ẩn Chương ${data.chapterNumber}${data.title ? `: "${data.title}"` : ""}!`
      );
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Ẩn chương thất bại";
      toast.error(msg);
    },
  });
}

export function useUnhideChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await adminChapterService.unhide(id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã mở lại Chương ${data.chapterNumber}${data.title ? `: "${data.title}"` : ""}!`
      );
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Mở lại chương thất bại";
      toast.error(msg);
    },
  });
}

export function useResetPendingChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await adminChapterService.resetPending(id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã chuyển Chương ${data.chapterNumber} quay lại chờ duyệt!`
      );
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Khôi phục chờ duyệt thất bại";
      toast.error(msg);
    },
  });
}

