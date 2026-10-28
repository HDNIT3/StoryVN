"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useAdminStoryCounts, useAdminChapterCounts } from "@/features/admin";

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  roles: string[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "nguoi-dung",
    label: "Quản lý người dùng",
    href: "/quan-ly/nguoi-dung",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "truyen",
    label: "Quản lý Truyện",
    href: "/quan-ly/truyen",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "chuong",
    label: "Duyệt & Quản lý Chương",
    href: "/quan-ly/chuong",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "duyet-tac-gia",
    label: "Duyệt tác giả",
    href: "/quan-ly/duyet-tac-gia",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "binh-luan",
    label: "Quản lý bình luận",
    href: "/quan-ly/binh-luan",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: "danh-gia",
    label: "Quản lý đánh giá",
    href: "/quan-ly/danh-gia",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    id: "the-loai",
    label: "Quản lý thể loại",
    href: "/quan-ly/the-loai",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    id: "the-tag",
    label: "Quản lý thẻ tag",
    href: "/quan-ly/the-tag",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    id: "media",
    label: "Thư viện ảnh",
    href: "/quan-ly/media",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { data: storyCounts } = useAdminStoryCounts();
  const { data: chapterCounts } = useAdminChapterCounts();
  const pendingStoryCount = storyCounts?.pending ?? 0;
  const pendingChapterCount = chapterCounts?.pending ?? 0;

  const visibleItems = SIDEBAR_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  ).map((item) => {
    if (item.id === "truyen") {
      return {
        ...item,
        label: "Quản lý Truyện",
        badge: pendingStoryCount,
      };
    }
    if (item.id === "chuong") {
      return {
        ...item,
        badge: pendingChapterCount,
      };
    }
    return item;
  });

  const handleLogout = async () => {
    await logout();
    router.push("/dang-nhap");
  };

  const avatarInitial = user
    ? (user.displayName || user.username || "A").charAt(0).toUpperCase()
    : "A";

  const roleLabel: Record<string, string> = {
    ADMIN: "Quản trị viên",
    MANAGER: "Quản lý",
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-200"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full flex flex-col bg-white border-r border-slate-200/80 text-slate-700 transition-all duration-300 z-50 shadow-[0_0_25px_-5px_rgba(0,0,0,0.04)] ${
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Header Logo + Collapse */}
        <div className={`flex items-center justify-between px-5 pt-5 pb-3 ${collapsed ? "lg:flex-col lg:px-2 lg:gap-2.5 lg:items-center" : ""}`}>
          <Link
            href="/"
            onClick={onMobileClose}
            className={`flex items-center gap-2.5 transition-transform active:scale-95 group ${collapsed ? "lg:hidden" : ""}`}
            title="StoryVN - Về trang chủ"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-xs group-hover:shadow-md transition-shadow border border-slate-200/80 shrink-0">
              <Image
                src="/icon/iconweb.png"
                alt="StoryVN Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col select-none">
              <span className="font-black text-xl tracking-tight text-slate-900 flex items-center leading-none">
                Story<span className="text-sky-500 ml-0.5">VN</span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-slate-400 mt-1 uppercase leading-none">
                TIỂU THUYẾT TRỰC TUYẾN
              </span>
            </div>
          </Link>

          {collapsed && (
            <Link
              href="/"
              className="hidden lg:flex w-10 h-10 rounded-xl overflow-hidden border border-slate-200/80 mx-auto shadow-xs hover:shadow-md transition-all shrink-0 active:scale-95"
              title="StoryVN - Về trang chủ"
            >
              <Image
                src="/icon/iconweb.png"
                alt="StoryVN Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </Link>
          )}

          <button
            onClick={onToggle}
            className={`hidden lg:flex text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer ${
              collapsed ? "mx-auto" : ""
            }`}
            aria-label="Thu gọn menu"
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>

          <button
            onClick={onMobileClose}
            className="lg:hidden text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
            aria-label="Đóng menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Card Pill */}
        {user && (
          <div className={`px-3 py-2 ${collapsed ? "lg:hidden" : ""}`}>
            <div className="bg-slate-50 hover:bg-slate-100/70 transition-colors rounded-2xl p-2.5 flex items-center gap-3 border border-slate-200/80 shadow-2xs">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-xs ring-1 ring-slate-200">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName}
                    width={36}
                    height={36}
                    className="rounded-xl object-cover w-full h-full"
                  />
                ) : (
                  avatarInitial
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
                <span className="inline-block text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 mt-0.5">
                  {roleLabel[user.role] || user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
          <div>
            <p className={`text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ${collapsed ? "lg:text-center px-1" : "px-3"}`}>
              {collapsed ? "···" : "Quản lý hệ thống"}
            </p>
            <ul className="space-y-1">
              {visibleItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-50/90 text-indigo-700 font-bold border border-indigo-200/70 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className={`shrink-0 transition-colors ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-700"}`}>
                        {item.icon}
                      </div>
                      <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                            collapsed ? "lg:hidden" : ""
                          } ${
                            isActive
                              ? "bg-indigo-600 text-white"
                              : "bg-amber-100 text-amber-800 border border-amber-200/80"
                          }`}
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Account Group */}
          <div className="pt-2 border-t border-slate-200/70">
            <p className={`text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ${collapsed ? "lg:text-center px-1" : "px-3"}`}>
              {collapsed ? "···" : "Tài khoản"}
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/ho-so"
                  onClick={onMobileClose}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-all"
                  title={collapsed ? "Hồ sơ cá nhân" : undefined}
                >
                  <svg className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-slate-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className={collapsed ? "lg:hidden" : ""}>Hồ sơ cá nhân</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    onMobileClose();
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  title={collapsed ? "Đăng xuất" : undefined}
                >
                  <svg className="w-5 h-5 shrink-0 text-slate-400 hover:text-rose-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className={collapsed ? "lg:hidden" : ""}>Đăng xuất</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200/60 mt-auto">
          <div className="flex items-center gap-2.5 px-2 py-1.5 text-[11px] text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Hệ thống trực tuyến</span>
          </div>
        </div>
      </aside>
    </>
  );
}
