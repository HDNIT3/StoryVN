"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const authorMenuItems: SidebarItem[] = [
  {
    id: "tong-quan",
    label: "Tổng quan",
    href: "/tac-gia/tong-quan",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "quan-ly-tac-pham",
    label: "Quản lý tác phẩm",
    href: "/tac-gia/tac-pham",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "viet-truyen-moi",
    label: "Viết truyện mới",
    href: "/tac-gia/tac-pham/them-moi",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: "chuong-truyen",
    label: "Quản lý chương",
    href: "/tac-gia/chuong-truyen",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export function AuthorSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Restore collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("author_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("author_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === "/tac-gia/tong-quan") {
      return pathname === "/tac-gia/tong-quan" || pathname === "/tac-gia/tong-quan/";
    }
    if (href === "/tac-gia/tac-pham") {
      return pathname === "/tac-gia/tac-pham" || pathname === "/tac-gia/tac-pham/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col shrink-0 sticky top-16 h-[calc(100vh-64px)] transition-all duration-300 ease-in-out select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)] z-30 hidden lg:flex ${isCollapsed ? "w-20 min-w-20" : "w-72 min-w-72"
        }`}
    >
      {/* Top Header / Profile Card */}
      <div className="border-b border-slate-100 flex flex-col transition-all">
        {isCollapsed ? (
          <div className="flex flex-col items-center py-4 px-2">
            <div
              className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-300 ring-2 ring-amber-100 mb-2 relative group cursor-pointer"
              title={user?.displayName || "Tác giả"}
            >
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName || "Avatar"}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-sky-500 to-indigo-600 text-white font-bold text-base">
                  {(user?.displayName || "T").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Mở rộng menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="p-5 flex flex-col items-center text-center relative">
            {/* Collapse toggle button in header */}
            <button
              onClick={toggleCollapse}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Thu gọn menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Avatar */}
            <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-amber-300/80 ring-4 ring-amber-50 shadow-sm mb-3">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName || "Avatar"}
                  width={72}
                  height={72}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-sky-500 to-indigo-600 text-white font-bold text-2xl">
                  {(user?.displayName || "T").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & Role */}
            <h3 className="text-[15px] font-bold text-slate-800 line-clamp-1 mb-1">
              {user?.displayName || "Tác giả StoryVN"}
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-0.5 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Tác giả chính thức
            </span>

            <Link
              href="/ho-so"
              className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 px-3.5 py-1.5 rounded-lg transition"
            >
              Xem trang cá nhân
            </Link>
          </div>
        )}
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        <div>
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Quản lý tác giả
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {authorMenuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative flex items-center rounded-xl transition-all ${isCollapsed
                    ? "justify-center p-3"
                    : "gap-3.5 px-3.5 py-2.5 text-[14px]"
                    } font-medium ${active
                      ? "bg-sky-50 text-sky-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                >
                  <span
                    className={`transition-colors ${active
                      ? "text-sky-600"
                      : "text-slate-400 group-hover:text-slate-600"
                      }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {active && !isCollapsed && (
                    <span className="w-1.5 h-4 bg-sky-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Collapse Toggle Footer */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={toggleCollapse}
          className={`w-full flex items-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition py-2 text-xs font-semibold ${isCollapsed ? "justify-center" : "px-3 gap-2"
            }`}
          title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""
              }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!isCollapsed && <span>Thu gọn</span>}
        </button>
      </div>
    </aside>
  );
}
