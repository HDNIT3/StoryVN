"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { NavItem, GenreItem as GenreItemType, UserProfile, WalletInfo, BookmarkInfo } from "./header.types";
import { DEFAULT_NAV_ITEMS, DEFAULT_GENRES } from "./header.constants";
import { HeaderSearch } from "./HeaderSearch";
import { NotificationBell } from "./NotificationBell";

const ROLE_LABEL: Record<string, string> = {
  USER: "Người dùng",
  AUTHOR: "Tác giả",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};

const ROLE_COLOR: Record<string, string> = {
  USER: "text-zinc-600 bg-zinc-100",
  AUTHOR: "text-sky-600 bg-sky-50",
  MANAGER: "text-blue-600 bg-blue-50",
  ADMIN: "text-purple-600 bg-purple-50",
};

interface HeaderMobileMenuProps {
  navItems?: NavItem[];
  activeNavId?: string;
  genres?: GenreItemType[];
  isLoggedIn?: boolean;
  user?: UserProfile;
  wallet?: WalletInfo;
  bookmark?: BookmarkInfo;
  onNavItemClick?: (item: NavItem) => void;
  onGenreClick?: (genre: GenreItemType) => void;
  onSearch?: (query: string) => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onRechargeClick?: () => void;
  onBookmarkClick?: () => void;
}

export function HeaderMobileMenu({
  navItems = DEFAULT_NAV_ITEMS,
  activeNavId = "home",
  genres = DEFAULT_GENRES,
  isLoggedIn = true,
  user,
  wallet,
  bookmark,
  onNavItemClick,
  onGenreClick,
  onSearch,
  onLoginClick,
  onLogoutClick,
  onRechargeClick,
  onBookmarkClick,
}: HeaderMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenresExpanded, setIsGenresExpanded] = useState(false);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const initial = user?.avatarInitial || (user?.name ? user.name[0].toUpperCase() : "U");
  const roleKey = (user?.role || "").toUpperCase();
  const roleLabel = ROLE_LABEL[roleKey] || user?.role;
  const roleColor = ROLE_COLOR[roleKey] || "text-zinc-600 bg-zinc-100";
  const isAdminOrManager = roleKey === "ADMIN" || roleKey === "MANAGER";
  const isAuthor = roleKey === "AUTHOR";

  return (
    <div className="xl:hidden flex items-center shrink-0">
      {/* Mobile / Tablet Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Mở menu di động"
        className="p-1 sm:p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
      >
        <div className="relative w-5 h-5 sm:w-6 sm:h-6">
          <Image
            src="/icon/menu.svg"
            alt="Menu"
            width={24}
            height={24}
            className="w-full h-full object-contain"
          />
        </div>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-[320px] sm:max-w-sm bg-white h-screen h-[100dvh] shadow-2xl p-4 sm:p-5 flex flex-col overflow-y-auto z-10 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-3.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-100 shrink-0">
                  <Image src="/icon/iconweb.png" alt="StoryVN" width={32} height={32} className="object-cover w-full h-full" />
                </div>
                <span className="font-black text-base text-zinc-900">
                  Story<span className="text-sky-500">VN</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng menu"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <div className="relative w-5 h-5">
                  <Image
                    src="/icon/close.svg"
                    alt="Đóng"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                  />
                </div>
              </button>
            </div>

            {/* User Profile / Auth Area */}
            {isLoggedIn && user ? (
              <div className="mb-4 bg-zinc-50/80 rounded-2xl p-3.5 border border-zinc-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-500 text-white font-bold text-base flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {user.avatarUrl && !user.avatarUrl.includes("avatar-h.svg") ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.name}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900 truncate">{user.name}</p>
                    <span className={`inline-block mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleColor}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Mobile Wallet & Bookmark row */}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60">
                  {wallet && (
                    <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-amber-50/80 rounded-xl border border-amber-200/80">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="relative w-4 h-4 shrink-0">
                          <Image src={wallet.coinIconSrc || "/icon/coin.svg"} alt="Xu" width={16} height={16} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xs font-bold text-amber-900 truncate">
                          {(wallet.coins || 0).toLocaleString("vi-VN")} {wallet.unit || "Xu"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          if (onRechargeClick) onRechargeClick();
                          else if (wallet.onRechargeClick) wallet.onRechargeClick();
                        }}
                        className="text-[11px] font-bold text-amber-800 bg-amber-200/70 hover:bg-amber-200 px-2 py-0.5 rounded-md transition"
                      >
                        + Nạp
                      </button>
                    </div>
                  )}

                  {bookmark && (
                    <Link
                      href={bookmark.href || "/tai-khoan/tu-truyen"}
                      onClick={() => {
                        setIsOpen(false);
                        if (onBookmarkClick) onBookmarkClick();
                        else if (bookmark.onClick) bookmark.onClick();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 rounded-xl border border-sky-200/80 text-sky-700 hover:bg-sky-100 transition shrink-0"
                      title="Tủ truyện"
                    >
                      <div className="relative w-4 h-4 shrink-0">
                        <Image src={bookmark.iconSrc || "/icon/bookmark.svg"} alt="Tủ truyện" width={16} height={16} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xs font-bold">{bookmark.count || 0}</span>
                    </Link>
                  )}

                  {/* Notification Bell - mobile */}
                  <NotificationBell size="sm" mobileDrawerMode={true} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Link
                  href="/dang-nhap"
                  onClick={() => {
                    setIsOpen(false);
                    onLoginClick?.();
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-ky"
                  onClick={() => {
                    setIsOpen(false);
                    onLoginClick?.();
                  }}
                  className="w-full py-2.5 text-center text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition shadow-xs"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Search */}
            <div className="mb-3">
              <HeaderSearch
                className="max-w-none w-full"
                onSearch={(q) => {
                  setIsOpen(false);
                  onSearch?.(q);
                }}
              />
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-1 flex-1">
              {navItems.map((item) => {
                if (item.hasDropdown && item.dropdownType === "genres") {
                  return (
                    <div key={item.id} className="py-0.5">
                      <button
                        type="button"
                        onClick={() => setIsGenresExpanded(!isGenresExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-zinc-800 hover:bg-zinc-50"
                      >
                        <span>{item.label}</span>
                        <div className="relative w-4 h-4">
                          <Image
                            src={isGenresExpanded ? "/icon/chevron-up.svg" : "/icon/chevron-down.svg"}
                            alt=""
                            width={16}
                            height={16}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </button>

                      {isGenresExpanded && (
                        <div className="grid grid-cols-2 gap-1.5 pl-3 pr-2 py-2 bg-zinc-50 rounded-2xl my-1 border border-zinc-100 max-h-60 overflow-y-auto">
                          {genres.map((g) => (
                            <Link
                              key={g.id}
                              href={g.href}
                              onClick={() => {
                                setIsOpen(false);
                                onGenreClick?.(g);
                              }}
                              className="px-2 py-1.5 text-xs text-zinc-600 hover:text-sky-600 hover:bg-white rounded-lg flex justify-between transition-colors"
                            >
                              <span className="truncate">{g.name}</span>
                              {g.count && <span className="text-[10px] text-zinc-400 font-medium">{g.count}</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = activeNavId === item.id;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      setIsOpen(false);
                      onNavItemClick?.(item);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      isActive
                        ? "bg-sky-50 text-sky-600 font-medium"
                        : "text-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Account Quick Links if Logged In */}
              {isLoggedIn && user && (
                <>
                  <div className="my-2 border-t border-zinc-100" />
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-1">
                    Tài khoản
                  </p>

                  <Link
                    href="/ho-so"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 hover:text-sky-600 hover:bg-sky-50/70 transition-colors"
                  >
                    <svg className="w-4.5 h-4.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Hồ sơ cá nhân</span>
                  </Link>

                  {isAuthor && (
                    <Link
                      href="/tac-gia/tac-pham"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 hover:text-sky-600 hover:bg-sky-50/70 transition-colors"
                    >
                      <svg className="w-4.5 h-4.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>Quản lý tác phẩm</span>
                    </Link>
                  )}

                  {isAdminOrManager && (
                    <Link
                      href="/quan-ly/duyet-tac-gia"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors"
                    >
                      <svg className="w-4.5 h-4.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Bảng quản lý</span>
                    </Link>
                  )}

                  {roleKey === "USER" && (
                    <Link
                      href="/tac-gia/dang-ky"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 hover:text-sky-600 hover:bg-sky-50/70 transition-colors"
                    >
                      <svg className="w-4.5 h-4.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Đăng ký tác giả</span>
                    </Link>
                  )}

                  <div className="mt-auto pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onLogoutClick?.();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <svg className="w-4.5 h-4.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
