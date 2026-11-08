"use client";

import React, { useEffect } from "react";
import { notFound, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { AuthorSidebar } from "../dashboard/AuthorSidebar";

interface AuthorLayoutViewProps {
  children: React.ReactNode;
}

export function AuthorLayoutView({ children }: AuthorLayoutViewProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Trang đăng ký làm tác giả (/tac-gia/dang-ky) là trang để người dùng nộp đơn, không phải dashboard quản trị
  const isRegisterPage =
    pathname === "/tac-gia/dang-ky" || pathname?.startsWith("/tac-gia/dang-ky");

  useEffect(() => {
    if (!isLoading && !isRegisterPage) {
      if (!isAuthenticated) {
        router.replace(
          `/dang-nhap?returnUrl=${encodeURIComponent(window.location.pathname)}`
        );
      }
    }
  }, [isLoading, isAuthenticated, isRegisterPage, router]);

  // Với trang đăng ký:
  // KHÔNG hiển thị AuthorSidebar quản trị tác giả, chỉ render nội dung trang đăng ký
  if (isRegisterPage) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] w-full">
        <main className="w-full">{children}</main>
      </div>
    );
  }

  // Với các trang quản lý tác giả (/tac-gia/tong-quan, /tac-gia/tac-pham, /tac-gia/chuong-truyen, v.v.):
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-xs border border-slate-200/80 max-w-sm w-full text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, đợi router.replace chuyển hướng
  if (!isAuthenticated || !user) return null;

  // PHƯƠNG ÁN 1: Bất kỳ role nào không phải AUTHOR (kể cả ADMIN, MANAGER hay USER thường)
  // khi cố tình truy cập vào các trang quản lý tác giả sẽ trả về 404 Not Found
  if (user.role !== "AUTHOR") {
    notFound();
  }

  // Chỉ người dùng là Tác giả chính thức mới hiển thị giao diện quản lý
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] flex flex-col lg:flex-row w-full min-w-0">
      {/* Persistent Author Sidebar (Desktop) & Top Nav Bar (Mobile/Tablet) */}
      <AuthorSidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full">{children}</main>
    </div>
  );
}
