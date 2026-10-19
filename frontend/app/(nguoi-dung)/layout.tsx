"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { SmartHeader } from "@/components/layout/header";
import { Footer } from "@/components/layout/Footer";

export default function NguoiDungLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(
        `/dang-nhap?returnUrl=${encodeURIComponent(window.location.pathname)}`
      );
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Khu vực dashboard sáng tác tác giả có sidebar riêng, các trang tài khoản người dùng (hồ sơ, lịch sử đọc...) hiển thị Footer
  const isAuthorDashboard = pathname?.startsWith("/tac-gia");

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      <SmartHeader />
      <main className="flex-1 w-full">{children}</main>
      {!isAuthorDashboard && <Footer />}
    </div>
  );
}
