"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, getStoredAccessToken } from "@/lib/context/AuthContext";
import { notificationKeys } from "../queries/notification.keys";
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
          queryClient.invalidateQueries({
            queryKey: notificationKeys.all,
          });

          window.dispatchEvent(
            new CustomEvent("notification:new", { detail: parsed.payload })
          );
        }
      } catch {
        // Heartbeat hoặc ping
      }
    };

    es.onerror = () => {
      // EventSource tự động reconnect
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isAuthenticated, user, queryClient]);
}

export default useRealtimeNotifications;
