"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  NavItem,
  UserProfile,
  WalletInfo,
  BookmarkInfo,
  DEFAULT_NAV_ITEMS,
  ROLE_LABEL,
  ROLE_COLOR,
  ACCOUNT_MENU_ITEMS,
  LOGOUT_ICON_PATH,
} from "./header.config";
import { HeaderSearch } from "./HeaderSearch";
import { NotificationBell } from "./NotificationBell";

interface HeaderMobileMenuProps {
  navItems?: NavItem[];
  activeNavId?: string;
  isLoggedIn?: boolean;
  user?: UserProfile;
  wallet?: WalletInfo;
  bookmark?: BookmarkInfo;
  onNavItemClick?: (item: NavItem) => void;
  onSearch?: (query: string) => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onRechargeClick?: () => void;
  onBookmarkClick?: () => void;
}

export function HeaderMobileMenu({
  navItems = DEFAULT_NAV_ITEMS,
  activeNavId = "home",
  isLoggedIn = true,
  user,
  wallet,
  bookmark,
  onNavItemClick,
  onSearch,
  onLoginClick,
  onLogoutClick,
  onRechargeClick,
  onBookmarkClick,
}: HeaderMobileMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

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
  const accountItems = ACCOUNT_MENU_ITEMS.filter((item) => item.visibleFor(roleKey));

  return (
    <div className="flex shrink-0 items-center lg:hidden">
      {/* Mobile / Tablet Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Mở menu di động"
        className="p-1 sm:p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
      >
        <div className="relative h-6 w-6 sm:h-7 sm:w-7">
          <Image
            src="/icon/menu.svg"
            alt="Menu"
            width={28}
            height={28}
            className="h-full w-full object-contain"
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
          <div className="fixed top-0 right-0 bottom-0 z-10 flex h-screen h-[100dvh] w-full max-w-[320px] flex-col overflow-y-auto border-l border-white/70 bg-white/95 p-4 shadow-[0_30px_80px_-30px_rgba(14,165,233,0.45)] backdrop-blur-xl animate-in slide-in-from-right duration-250 sm:max-w-sm sm:p-5">
            {/* Drawer Header */}
            <div className="mb-3.5 flex shrink-0 items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-xl border border-white/80 shadow-[0_6px_18px_-10px_rgba(14,165,233,0.8)] ring-1 ring-slate-100">
                  <Image src="/icon/iconweb.png" alt="StoryVN" width={32} height={32} className="object-cover w-full h-full" />
                </div>
                <span className="text-lg font-extrabold text-slate-900">
                  Story
                  <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                    VN
                  </span>
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
              <div className="mb-4 space-y-3 rounded-2xl border border-sky-100/80 bg-gradient-to-br from-sky-50/70 to-white p-3.5">
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
                    <p className="text-base font-bold text-zinc-900 truncate">{user.name}</p>
                    <span className={`inline-block mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleColor}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Mobile Wallet & Bookmark row */}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60">
                  {wallet && (
                    <div className="flex flex-1 items-center justify-between rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-100 to-yellow-50 px-3 py-1.5">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <div className="relative h-4 w-4 shrink-0">
                          <Image src={wallet.coinIconSrc || "/icon/coin.svg"} alt="Xu" width={16} height={16} className="w-full h-full object-contain" />
                        </div>
                        <span className="truncate text-xs font-bold text-amber-600">
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
                        className="rounded-md bg-amber-200/70 px-2 py-0.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-200"
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
                  className="w-full py-2.5 text-center text-base font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-ky"
                  onClick={() => {
                    setIsOpen(false);
                    onLoginClick?.();
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-2.5 text-center text-base font-bold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5"
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
                  if (onSearch) {
                    onSearch(q);
                  } else {
                    router.push(`/truyen?search=${encodeURIComponent(q)}`);
                  }
                }}
              />
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-1 flex-1">
              {navItems.map((item) => {
                const isActive = activeNavId === item.id;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      setIsOpen(false);
                      onNavItemClick?.(item);
                    }}
                    className={`px-3 py-2.5 rounded-lg text-base transition-colors ${
                      isActive
                        ? "bg-sky-50 text-sky-600 font-semibold"
                        : "text-zinc-700 font-medium hover:text-sky-600 hover:bg-sky-50/70"
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

                  {accountItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-base font-medium text-zinc-700 transition-colors ${
                        item.isAdmin
                          ? "hover:text-blue-600 hover:bg-blue-50/70"
                          : "hover:text-sky-600 hover:bg-sky-50/70"
                      }`}
                    >
                      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                      </svg>
                      <span>{item.label}</span>
                    </Link>
                  ))}

                  <div className="mt-auto pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onLogoutClick?.();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 font-medium hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={LOGOUT_ICON_PATH} />
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
