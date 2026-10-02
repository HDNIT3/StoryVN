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

function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
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
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-200"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full flex flex-col bg-white text-slate-700 border-r border-slate-200/80 transition-all duration-300 z-50 shadow-lg lg:shadow-xs ${
          /* Mobile: drawer overlay */
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${
          /* Desktop */
          collapsed ? "lg:w-20" : "lg:w-72"
        }`}
      >
        {/* Logo + Nút thu gọn / Đóng */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <Link
            href="/quan-ly/duyet-tac-gia"
            onClick={onMobileClose}
            className={`flex items-center gap-3 ${collapsed ? "lg:hidden" : ""}`}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs border border-slate-100">
              <Image src="/icon/iconweb.png" alt="StoryVN" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">
              Story<span className="text-sky-500">VN</span>{" "}
              <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-1 uppercase">
                Admin
              </span>
            </span>
          </Link>

          {collapsed && (
            <div className="hidden lg:flex w-10 h-10 rounded-xl overflow-hidden items-center justify-center mx-auto shadow-xs border border-slate-100">
              <Image src="/icon/iconweb.png" alt="StoryVN" width={40} height={40} className="object-cover w-full h-full" />
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggle}
            className={`hidden lg:flex text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 transition-colors cursor-pointer ${
              collapsed ? "mx-auto mt-2" : ""
            }`}
            aria-label="Thu gọn menu"
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 transition-colors cursor-pointer"
            aria-label="Đóng menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thông tin người dùng thu nhỏ */}
        {user && (
          <div className={`px-4 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70 ${collapsed ? "lg:hidden" : ""}`}>
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center text-base font-bold shrink-0 shadow-xs">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={40}
                  height={40}
                  className="rounded-xl object-cover"
                />
              ) : (
                avatarInitial
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
              <p className="text-xs text-sky-600 font-semibold mt-0.5">
                {roleLabel[user.role] || user.role}
              </p>
            </div>
          </div>
        )}

        {/* Danh sách điều hướng */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <p className={`text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 ${collapsed ? "lg:px-2 lg:text-center px-4.5" : "px-4.5"}`}>
            {collapsed ? <span className="hidden lg:inline">·</span> : null}
            <span className={collapsed ? "lg:hidden" : ""}>Quản lý hệ thống</span>
          </p>
          <ul className="space-y-1.5 px-3">
            {visibleItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={`flex items-center gap-3.5 px-3.5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                      isActive
                        ? "bg-sky-500 text-white shadow-sm font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`ml-auto bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${collapsed ? "lg:hidden" : ""}`}>
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Phân cách */}
          <div className="mx-4 my-4 border-t border-slate-100" />

          {/* Menu tài khoản */}
          <ul className="space-y-1.5 px-3">
            <li>
              <Link
                href="/ho-so"
                onClick={onMobileClose}
                className="flex items-center gap-3.5 px-3.5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                title={collapsed ? "Hồ sơ cá nhân" : undefined}
              >
                <svg className="w-5 h-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="w-full flex items-center gap-3.5 px-3.5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                title={collapsed ? "Đăng xuất" : undefined}
              >
                <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className={collapsed ? "lg:hidden" : ""}>Đăng xuất</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 max-w-xs w-full text-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">
            {redirecting ? "Đang chuyển hướng..." : "Đang tải dữ liệu..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return null;

  return (
    <div className="min-h-screen bg-slate-50/70 flex text-slate-800">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-72"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          {/* Mobile hamburger + Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
              aria-label="Mở menu điều hướng"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {user.role === "ADMIN" ? "Bảng Quản trị Hệ thống" : "Bảng Quản lý Nội dung"}
              </h2>
              <p className="hidden xs:block text-[11px] text-slate-500 mt-0.5 truncate">
                StoryVN Management Portal
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 hover:bg-sky-50/50 hover:border-sky-200 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden xs:inline">Về trang chủ</span>
              <span className="xs:hidden">Trang chủ</span>
            </Link>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-500 flex items-center justify-center text-xs sm:text-base font-bold text-white shadow-xs shrink-0">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={40}
                  height={40}
                  className="rounded-xl object-cover w-full h-full"
                />
              ) : (
                (user.displayName || "A").charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </header>

        {/* Main page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
