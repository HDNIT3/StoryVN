"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/context/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { toast } from "@/lib/toast";

import { useRealtimeNotifications } from "@/features/notifications";

const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then(
            (mod) => mod.ReactQueryDevtools
          ),
        { ssr: false }
      )
    : () => null;

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Tạo QueryClient instance theo component lifecycle (khuyến nghị cho Next.js App Router)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // Dữ liệu giữ trạng thái fresh trong 2 phút
            gcTime: 1000 * 60 * 10,   // Dọn dẹp cache sau 10 phút không hoạt động
            refetchOnWindowFocus: false, // Không tự refetch khi chuyển qua lại tab
            retry: 1, // Thử lại tối đa 1 lần nếu lỗi mạng
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthLogoutListener />
        <RealtimeNotificationListener />
        {children}
        <CookieBanner />
        <ToastContainer />
      </AuthProvider>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

// Lắng nghe thông báo SSE thời gian thực khi user đã đăng nhập
function RealtimeNotificationListener() {
  useRealtimeNotifications();
  return null;
}

// Lắng nghe event auth:logout khi 401 không refresh được
function AuthLogoutListener() {
  const router = useRouter();
  const lastHandledRef = useRef(0);

  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      if (now - lastHandledRef.current < 2000) return;
      lastHandledRef.current = now;

      const pathname = window.location.pathname;
      if (
        pathname.startsWith("/dang-nhap") ||
        pathname.startsWith("/dang-ky") ||
        pathname.startsWith("/quen-mat-khau")
      ) {
        return;
      }

      toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      const returnTarget = `${pathname}${window.location.search}`;
      router.push(`/dang-nhap?returnUrl=${encodeURIComponent(returnTarget)}`);
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [router]);
  return null;
}

