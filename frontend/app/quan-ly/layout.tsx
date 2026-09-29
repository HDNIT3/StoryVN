"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import Image from "next/image";

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
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const visibleItems = SIDEBAR_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  );

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
    <aside
      className={`fixed top-0 left-0 h-full flex flex-col bg-slate-900 text-white transition-all duration-300 z-50 shadow-2xl ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo + Toggle */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700/60">
        {!collapsed && (
          <Link href="/quan-ly/duyet-tac-gia" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <Image src="/image/logo-icon.svg" alt="StoryVN" width={20} height={20} />
            </div>
            <span className="font-bold text-base tracking-tight">
              Story<span className="text-orange-400">VN</span>{" "}
              <span className="text-slate-400 font-normal text-xs">Admin</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto">
            <Image src="/image/logo-icon.svg" alt="StoryVN" width={20} height={20} />
          </div>
        )}
        <button
          onClick={onToggle}
          className={`text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg p-1.5 transition-colors ${
            collapsed ? "mx-auto mt-0" : ""
          }`}
          aria-label="Thu gọn menu"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* User info mini */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-slate-700/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName}
                width={36}
                height={36}
                className="rounded-xl object-cover"
              />
            ) : (
              avatarInitial
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
            <p className="text-xs text-orange-400 font-medium">
              {roleLabel[user.role] || user.role}
            </p>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className={`text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 ${collapsed ? "px-2 text-center" : "px-4"}`}>
          {!collapsed ? "Quản lý" : "·"}
        </p>
        <ul className="space-y-0.5 px-2">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Separator */}
        <div className="mx-4 my-4 border-t border-slate-700/50" />

        {/* Profile link */}
        <ul className="space-y-0.5 px-2">
          <li>
            <Link
              href="/ho-so"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              title={collapsed ? "Hồ sơ cá nhân" : undefined}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {!collapsed && <span>Hồ sơ cá nhân</span>}
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-red-900/40 hover:text-red-400 transition-all"
              title={collapsed ? "Đăng xuất" : undefined}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!collapsed && <span>Đăng xuất</span>}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default function QuanLyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setRedirecting(true);
        router.replace(
          `/dang-nhap?returnUrl=${encodeURIComponent(window.location.pathname)}`
        );
      } else if (user && user.role !== "ADMIN" && user.role !== "MANAGER") {
        setRedirecting(true);
        router.replace("/ho-so");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Hiển thị spinner khi đang tải hoặc đang chuyển hướng
  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">
            {redirecting ? "Đang chuyển hướng..." : "Đang tải..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return null;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {user.role === "ADMIN" ? "Quản trị hệ thống" : "Bảng quản lý"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              StoryVN · {user.role === "ADMIN" ? "Quản trị viên" : "Quản lý"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Trang chủ
            </Link>
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-sm font-bold text-white">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={32}
                  height={32}
                  className="rounded-lg object-cover"
                />
              ) : (
                (user.displayName || "A").charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
