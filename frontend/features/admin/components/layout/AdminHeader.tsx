"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { NotificationBell } from "@/components/layout/header/NotificationBell";
import { useAuth } from "@/lib/context/AuthContext";

interface AdminHeaderProps {
  onMobileOpen: () => void;
}

export function AdminHeader({ onMobileOpen }: AdminHeaderProps) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 admin-crm-header px-4 sm:px-6 py-3 flex items-center justify-between gap-3 border-b border-slate-200/80 shadow-2xs">
      {/* Mobile hamburger + Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
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

        <div className="flex items-center gap-2.5 truncate">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
            {user.role === "ADMIN" ? "Bảng Quản trị Hệ thống" : "Bảng Quản lý Nội dung"}
          </h2>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đang hoạt động
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/"
          className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 shadow-2xs transition-all"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Trang chủ</span>
        </Link>

        {/* Notification Bell */}
        <NotificationBell size="md" />

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0 cursor-pointer overflow-hidden ring-2 ring-white border border-slate-200">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={32}
              height={32}
              className="rounded-full object-cover w-full h-full"
            />
          ) : (
            (user.displayName || "A").charAt(0).toUpperCase()
          )}
        </div>
      </div>
    </header>
  );
}
