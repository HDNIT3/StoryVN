"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, getStoredAccessToken } from "@/lib/context/AuthContext";
import { queryKeys } from "@/lib/query-keys";
import { API_BASE_URL } from "@/lib/api";

export function useRealtimeNotifications() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const token = getStoredAccessToken();
    if (!token) return;

    // Thiết lập kết nối EventSource SSE tới Backend
    const streamUrl = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        if (!event.data) return;
        const parsed = JSON.parse(event.data);

        if (parsed.type === "NOTIFICATION" && parsed.payload) {
          // 1. Invalidate queries để chuông thông báo và danh sách tự động cập nhật ngay lập tức
          queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.all,
          });

          // 2. Bắn event để chuông lắc lư / nháy nháy báo hiệu có tin mới
          window.dispatchEvent(
            new CustomEvent("notification:new", { detail: parsed.payload })
          );
        }
      } catch {
        // Heartbeat hoặc ping
      }
    };

    es.onerror = () => {
      // EventSource tự động reconnect khi mất kết nối
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isAuthenticated, user, queryClient]);
}
