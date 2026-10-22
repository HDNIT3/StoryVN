"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { notificationService } from "../services/notification.service";
import { notificationKeys } from "./notification.keys";
import { toast } from "@/lib/toast";
import type { QueryNotificationsParams } from "../types";

export function useMyNotifications(params?: QueryNotificationsParams, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await notificationService.getMyNotifications(params);
      return res.data;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useUnreadNotificationsCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: async () => {
      const res = await notificationService.getUnreadCount();
      return res.data?.unreadCount ?? 0;
    },
    enabled,
    refetchInterval: 1000 * 60, // 1 phút
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await notificationService.markOneAsRead(id);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await notificationService.markAllAsRead();
      return res;
    },
    onSuccess: () => {
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      toast.error(msg);
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await notificationService.deleteOne(id);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể xóa thông báo";
      toast.error(msg);
    },
  });
}
