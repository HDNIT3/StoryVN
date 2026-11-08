"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, getStoredAccessToken } from "@/lib/context/AuthContext";
import { followsKeys } from "@/features/follows/queries/follows.keys";
import { notificationKeys } from "../queries/notification.keys";
import { API_BASE_URL } from "@/lib/api";

export function useRealtimeNotifications() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [tokenVersion, setTokenVersion] = useState(0);

  useEffect(() => {
    const handleTokenRefreshed = () => {
      setTokenVersion((prev) => prev + 1);
    };
    window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
    return () => {
      window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const token = getStoredAccessToken();
    if (!token) return;

    // Thiết lập kết nối EventSource SSE tới Backend (tự kết nối lại khi token được refresh)
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

          if (parsed.payload.type === "NEW_CHAPTER") {
            queryClient.invalidateQueries({
              queryKey: followsKeys.all,
            });
          }

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
  }, [isAuthenticated, user?._id, tokenVersion, queryClient]);
}

export default useRealtimeNotifications;
