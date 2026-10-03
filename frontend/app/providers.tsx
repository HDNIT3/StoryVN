"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/lib/context/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";
import { toast } from "@/lib/toast";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

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
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <AuthLogoutListener />
          {children}
          <ToastContainer />
        </AuthProvider>
      </GoogleOAuthProvider>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

// Lắng nghe event auth:logout khi 401 không refresh được
function AuthLogoutListener() {
  const router = useRouter();
  useEffect(() => {
    const handler = () => {
      toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      router.push("/dang-nhap");
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [router]);
  return null;
}

