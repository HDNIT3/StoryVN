"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

interface FeaturePlaceholderProps {
  title?: string;
  category?: string;
  description?: string;
}

export function FeaturePlaceholder({
  title,
  category = "Tính năng quản lý",
  description = "Chức năng này đang được phát triển theo lộ trình của StoryVN và sẽ sớm ra mắt trong phiên bản tiếp theo.",
}: FeaturePlaceholderProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Tạo tiêu đề tự động nếu không truyền title
  const displayTitle = title || (
    pathname.includes("truyen")
      ? "Quản lý Truyện"
      : pathname.includes("thanh-toan")
      ? "Quản lý Thanh toán"
      : pathname.includes("he-thong")
      ? "Quản lý Hệ thống"
      : "Chức năng Quản lý"
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in duration-300">
      {/* Breadcrumb nhỏ */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
        <Link href="/quan-ly/duyet-tac-gia" className="hover:text-sky-600 transition-colors">
          {user?.role === "ADMIN" ? "Admin" : "Quản lý"}
        </Link>
        <span>/</span>
        <span className="text-slate-400">{category}</span>
        <span>/</span>
        <span className="text-sky-600 font-semibold">{displayTitle}</span>
      </div>

      {/* Card thông báo chính */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-12 text-center relative overflow-hidden">
        {/* Họa tiết nền trang trí */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto">
          {/* Icon nổi bật */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center mx-auto mb-6 shadow-md shadow-sky-500/20">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            ĐANG PHÁT TRIỂN (COMING SOON)
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
            {displayTitle}
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
            {description}
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left mb-8 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Đường dẫn hiện tại: <span className="font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded">{pathname}</span>
            </div>
            <p className="text-slate-500">
              Bạn có thể dễ dàng liên kết trang này với API hoặc trang chức năng cụ thể khi giao diện hoàn tất.
            </p>
          </div>

          {/* Các liên kết điều hướng nhanh */}
          <div className="border-t border-slate-100 pt-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Chuyển nhanh đến chức năng có sẵn:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/quan-ly/duyet-tac-gia"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all"
              >
                Duyệt tác giả
              </Link>
              <Link
                href="/quan-ly/nguoi-dung"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all"
              >
                Quản lý người dùng
              </Link>
              <Link
                href="/quan-ly/the-loai"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all"
              >
                Quản lý thể loại
              </Link>
              <Link
                href="/quan-ly/media"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all"
              >
                Thư viện ảnh
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
