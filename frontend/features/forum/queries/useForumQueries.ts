"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "@/lib/toast";
import type { DateRange } from "@/components/statistics";
import { forumService } from "../services/forum.service";
import type { ForumPostInput, ForumPostStatus } from "../types";

export function useForumPosts(scope: "feed" | "me" | "admin", page: number, status?: ForumPostStatus, range?: DateRange) {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["forum", user?._id, scope, page, status, range],
    queryFn: async () => {
      const response = await forumService.list(scope, page, status, range);
      if (!response.data) throw new Error("Không tải được bài viết.");
      return response.data;
    },
    enabled: scope === "feed" ? true : (isAuthenticated && (scope !== "admin" || user?.role === "ADMIN" || user?.role === "MANAGER")),
  });
}

export function useForumPost(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["forum", "post", id, user?._id],
    queryFn: async () => {
      const response = await forumService.detail(id);
      if (!response.data) throw new Error("Không tải được bài viết.");
      return response.data;
    },
    enabled: Boolean(id),
  });
}

export function useForumStats(range?: DateRange) {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["forum", "admin-stats", user?._id, range],
    queryFn: async () => {
      const response = await forumService.stats(range);
      if (!response.data) throw new Error("Không tải được thống kê diễn đàn.");
      return response.data;
    },
    enabled: isAuthenticated && (user?.role === "ADMIN" || user?.role === "MANAGER"),
  });
}

export function useMyForumStats(range?: DateRange) {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["forum", "my-stats", user?._id, range],
    queryFn: async () => {
      const response = await forumService.myStats(range);
      if (!response.data) throw new Error("Không tải được thống kê bài viết.");
      return response.data;
    },
    enabled: isAuthenticated,
  });
}

export function useForumReports(id: string, page: number, range?: DateRange) {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["forum", user?._id, "reports", id, page, range],
    queryFn: async () => {
      const response = await forumService.reports(id, page, range);
      if (!response.data) throw new Error("Không tải được báo cáo.");
      return response.data;
    },
    enabled: isAuthenticated && (user?.role === "ADMIN" || user?.role === "MANAGER"),
  });
}

type ForumAction =
  | { type: "create"; input: ForumPostInput }
  | { type: "update"; id: string; input: ForumPostInput }
  | { type: "delete"; id: string }
  | { type: "status"; id: string; status: ForumPostStatus };

export function useForumMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: ForumAction) => {
      switch (action.type) {
        case "create": return forumService.create(action.input);
        case "update": return forumService.update(action.id, action.input);
        case "delete": return forumService.remove(action.id);
        case "status": return forumService.updateStatus(action.id, action.status);
      }
    },
    onSuccess: async () => {
       toast.success("Đã lưu thay đổi bài viết.");
       await queryClient.invalidateQueries({ queryKey: ["forum"] });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Không thể lưu thay đổi. Vui lòng thử lại.");
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isLiked }: { id: string; isLiked: boolean }) => {
      const res = isLiked ? await forumService.unlike(id) : await forumService.like(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum"] });
    },
  });
}

export function useSharePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await forumService.share(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum"] });
    },
  });
}

export function useViewPost() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await forumService.view(id);
      return res.data;
    },
  });
}

export function useReportPost() {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await forumService.report(id, reason);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Đã gửi báo cáo vi phạm thành công.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Không thể gửi báo cáo.");
    },
  });
}
