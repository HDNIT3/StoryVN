"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/layout/header/NotificationBell";
import { useAuth } from "@/lib/context/AuthContext";

interface AdminHeaderProps {
  onMobileOpen: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/quan-ly/duyet-tac-gia": { title: "Duyệt hồ sơ tác giả", subtitle: "Xét duyệt yêu cầu trở thành tác giả" },
  "/quan-ly/truyen": { title: "Quản lý tác phẩm truyện", subtitle: "Kiểm duyệt, quản lý hiển thị và nội dung truyện" },
  "/quan-ly/chuong": { title: "Kiểm duyệt chương", subtitle: "Phê duyệt các chương mới gửi từ tác giả" },
  "/quan-ly/nguoi-dung": { title: "Quản lý người dùng", subtitle: "Danh sách tài khoản, phân quyền và khóa/mở khóa" },
  "/quan-ly/the-loai": { title: "Quản lý thể loại", subtitle: "Danh mục thể loại truyện trên nền tảng" },
  "/quan-ly/the-tag": { title: "Quản lý thẻ tag", subtitle: "Danh sách từ khóa & tag phân loại" },
  "/quan-ly/binh-luan": { title: "Kiểm duyệt bình luận", subtitle: "Xử lý báo cáo và lọc bình luận vi phạm" },
  "/quan-ly/danh-gia": { title: "Quản lý đánh giá", subtitle: "Theo dõi phản hồi và đánh giá truyện của độc giả" },
  "/quan-ly/goi-nap": { title: "Quản lý gói nạp xu", subtitle: "Cấu hình mệnh giá, ưu đãi và tỷ giá xu" },
  "/quan-ly/giao-dich": { title: "Lịch sử giao dịch", subtitle: "Nhật ký nạp tiền, mua chương và đổi thưởng" },
  "/quan-ly/media": { title: "Thư viện phương tiện", subtitle: "Quản lý file ảnh bìa, avatar đã tải lên" },
};

export function AdminHeader({ onMobileOpen }: AdminHeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  const currentRouteInfo = useMemo(() => {
    return ROUTE_TITLES[pathname] || {
      title: user?.role === "ADMIN" ? "Bảng Quản trị Hệ thống" : "Bảng Quản lý Nội dung",
      subtitle: "Hệ thống quản lý StoryVN CRM",
    };
  }, [pathname, user?.role]);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 admin-crm-header px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 border-b border-slate-200/80 shadow-2xs">
      {/* Mobile hamburger + Page Breadcrumbs */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          onClick={onMobileOpen}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          aria-label="Mở menu điều hướng"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Logo Link to Client */}
        <Link
          href="/"
          className="lg:hidden flex items-center shrink-0 active:scale-95 transition-transform"
          title="StoryVN - Về trang chủ"
        >
          <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-200 shadow-2xs shrink-0">
            <Image
              src="/icon/iconweb.png"
              alt="StoryVN"
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        {/* Breadcrumb & Section Name */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 truncate">
            <span className="hidden sm:inline">Quản trị</span>
            <span className="hidden sm:inline text-slate-300">/</span>
            <span className="text-slate-700 font-semibold truncate">{currentRouteInfo.title}</span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block truncate">
            {currentRouteInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Date Badge (Desktop) */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200/60 capitalize">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{todayStr}</span>
        </div>

        {/* Status indicator */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ thống ổn định</span>
        </div>

        {/* Return to public site */}
        <Link
          href="/"
          className="text-xs font-semibold text-slate-700 hover:text-sky-600 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 shadow-2xs transition-all active:scale-95"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="hidden sm:inline">Xem trang chủ</span>
        </Link>

        {/* Notification Bell */}
        <NotificationBell size="md" />

        {/* User Avatar Chip */}
        <Link
          href="/ho-so"
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 shadow-2xs transition-all cursor-pointer group"
          title={`Đang đăng nhập: ${user.displayName || user.username}`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0 overflow-hidden ring-1 ring-slate-200">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName}
                width={28}
                height={28}
                className="rounded-full object-cover w-full h-full"
              />
            ) : (
              (user.displayName || "A").charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-xs font-bold text-slate-800 max-w-[90px] truncate hidden sm:inline group-hover:text-sky-600">
            {user.displayName || user.username}
          </span>
        </Link>
      </div>
    </header>
  );
}
