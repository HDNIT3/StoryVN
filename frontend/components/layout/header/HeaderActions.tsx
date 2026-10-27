"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  HeaderActionsProps,
  BookmarkInfo,
  WalletInfo,
  UserProfile,
  DEFAULT_USER,
  DEFAULT_WALLET,
  DEFAULT_BOOKMARK,
  ROLE_LABEL,
  ROLE_COLOR,
  ACCOUNT_MENU_ITEMS,
  LOGOUT_ICON_PATH,
} from "./header.config";
import { NotificationBell } from "./NotificationBell";

// ─── Bookmark ─────────────────────────────────────────────────────
function HeaderBookmark({
  bookmark = DEFAULT_BOOKMARK,
  onClick,
  className = "",
}: {
  bookmark?: BookmarkInfo;
  onClick?: () => void;
  className?: string;
}) {
  const count = bookmark.count ?? 0;
  const iconSrc = bookmark.iconSrc ?? "/icon/bookmark.svg";
  const href = bookmark.href ?? "/tai-khoan/theo-doi";

  const content = (
    <div
      className={`group relative shrink-0 cursor-pointer rounded-full p-1 text-slate-500 transition-colors select-none hover:bg-sky-50 hover:text-sky-600 sm:p-2 ${className}`}
      title="Tủ truyện"
      aria-label={`Tủ truyện: ${count} truyện đã lưu`}
    >
      <div className="relative h-5 w-5 shrink-0 sm:h-6 sm:w-6">
        <Image
          src={iconSrc}
          alt="Icon tủ truyện"
          width={24}
          height={24}
          className="h-full w-full object-contain"
        />
      </div>

      {/* Badge Count */}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[15px] sm:min-w-[20px] h-[15px] sm:h-[20px] px-0.5 sm:px-1 bg-sky-500 text-white text-[9px] sm:text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs ring-1.5 sm:ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );

  if (bookmark.onClick || onClick) {
    return (
      <button
        type="button"
        onClick={() => {
          onClick?.();
          bookmark.onClick?.();
        }}
      >
        {content}
      </button>
    );
  }

  return <Link href={href}>{content}</Link>;
}

// ─── Wallet ───────────────────────────────────────────────────────
function HeaderWallet({
  wallet = DEFAULT_WALLET,
  onRechargeClick,
  className = "",
  showRechargeButton = true,
}: {
  wallet?: WalletInfo;
  onRechargeClick?: () => void;
  className?: string;
  showRechargeButton?: boolean;
}) {
  const coins = wallet.coins ?? 0;
  const unit = wallet.unit ?? "Xu";
  const iconSrc = wallet.coinIconSrc ?? "/icon/coin.svg";

  const handleRecharge = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRechargeClick) {
      onRechargeClick();
    } else if (wallet.onRechargeClick) {
      wallet.onRechargeClick();
    }
  };

  return (
    <div
      className={`inline-flex shrink-0 select-none items-center gap-1 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-100 to-yellow-50 px-1.5 py-0.5 shadow-[0_6px_18px_-12px_rgba(245,158,11,0.9)] transition-colors hover:from-amber-100 hover:to-amber-50 sm:gap-1.5 sm:px-2.5 sm:py-1 ${className}`}
      title={`Số dư: ${coins.toLocaleString("vi-VN")} ${unit}`}
    >
      {/* Coin Icon from public/icon */}
      <div className="relative h-4 w-4 shrink-0 sm:h-5 sm:w-5">
        <Image
          src={iconSrc}
          alt="Icon đồng xu"
          width={20}
          height={20}
          className="h-full w-full object-contain"
        />
      </div>

      {/* Balance Text */}
      <span className="whitespace-nowrap text-xs font-bold text-amber-600 sm:text-sm">
        {coins.toLocaleString("vi-VN")}{" "}
        <span className="hidden sm:inline">{unit}</span>
      </span>

      {/* Plus Recharge Button */}
      {showRechargeButton && (
        <button
          type="button"
          onClick={handleRecharge}
          aria-label="Nạp thêm xu"
          title="Nạp thêm xu"
          className="ml-0.5 flex h-3 w-3 shrink-0 cursor-pointer items-center justify-center rounded-full text-amber-500 transition-colors hover:bg-amber-200/70 hover:text-amber-700 sm:h-4 sm:w-4"
        >
          <div className="relative w-2 h-2 sm:w-3 sm:h-3 shrink-0">
            <Image
              src="/icon/plus.svg"
              alt="Icon nạp xu"
              width={12}
              height={12}
              className="w-full h-full object-contain"
            />
          </div>
        </button>
      )}
    </div>
  );
}

// ─── User avatar + account dropdown ───────────────────────────────
function HeaderUserAvatar({
  user = DEFAULT_USER,
  isLoggedIn = true,
  onLoginClick,
  onLogoutClick,
  className = "",
}: {
  user?: UserProfile;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!isLoggedIn) {
    return (
      <div className={`flex items-center gap-1.5 sm:gap-2.5 shrink-0 ${className}`}>
        <Link
          href="/dang-nhap"
          onClick={onLoginClick}
          className="whitespace-nowrap rounded-lg px-4 py-2.5 text-base font-medium text-slate-600 transition-colors hover:bg-sky-50/70 hover:text-sky-600"
        >
          Đăng nhập
        </Link>
        <Link
          href="/dang-ky"
          onClick={onLoginClick}
          className="shimmer-hover whitespace-nowrap rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/30"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  const initial = user.avatarInitial || (user.name ? user.name[0].toUpperCase() : "U");
  const roleKey = (user.role || "").toUpperCase();
  const roleLabel = ROLE_LABEL[roleKey] || user.role;
  const roleColor = ROLE_COLOR[roleKey] || "text-zinc-600 bg-zinc-100";
  const visibleItems = ACCOUNT_MENU_ITEMS.filter((item) => item.visibleFor(roleKey));

  return (
    <div ref={menuRef} className={`relative inline-block shrink-0 ${className}`}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Menu tài khoản"
        className="group flex shrink-0 cursor-pointer items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-sky-50 sm:gap-1.5 sm:p-1"
      >
        <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white ring-2 ring-sky-100 transition-all group-hover:ring-sky-300 sm:h-10 sm:w-10 sm:text-base">
          {user.avatarUrl && !user.avatarUrl.includes("avatar-h.svg") ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <svg
          className={`hidden sm:block w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-60 max-w-[calc(100vw-20px)] rounded-2xl border border-slate-100 bg-white/95 p-1.5 shadow-[0_24px_60px_-24px_rgba(14,165,233,0.35)] backdrop-blur-xl sm:w-64">
          {/* User Info Header */}
          <div className="mb-1 border-b border-slate-100 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white">
                {user.avatarUrl && !user.avatarUrl.includes("avatar-h.svg") ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-bold text-zinc-900 truncate">{user.name}</p>
                <span
                  className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-md ${roleColor}`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5">
            {visibleItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-700 transition-colors font-medium ${
                  item.isAdmin
                    ? "hover:text-blue-600 hover:bg-blue-50/70"
                    : "hover:text-sky-600 hover:bg-sky-50/70"
                }`}
              >
                <svg
                  className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-sky-600 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                </svg>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-zinc-100 mt-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogoutClick?.();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 font-medium hover:bg-rose-50 rounded-lg transition-colors cursor-pointer group"
            >
              <svg
                className="w-4 h-4 shrink-0 text-rose-400 group-hover:text-rose-600 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={LOGOUT_ICON_PATH} />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Actions cluster ──────────────────────────────────────────────
export function HeaderActions({
  isLoggedIn = true,
  user = DEFAULT_USER,
  wallet = DEFAULT_WALLET,
  bookmark = DEFAULT_BOOKMARK,
  onLoginClick,
  onLogoutClick,
  onRechargeClick,
  onBookmarkClick,
  className = "",
}: HeaderActionsProps) {
  return (
    <div className={`flex items-center gap-1 sm:gap-2 md:gap-2.5 shrink-0 ${className}`}>
      {/* Bookmark ribbon with badge */}
      {isLoggedIn && <HeaderBookmark bookmark={bookmark} onClick={onBookmarkClick} />}

      {/* Notification Bell */}
      {isLoggedIn && <NotificationBell size="md" />}

      {/* Wallet coin pill */}
      {isLoggedIn && <HeaderWallet wallet={wallet} onRechargeClick={onRechargeClick} />}

      {/* User profile avatar or login button */}
      <HeaderUserAvatar
        user={user}
        isLoggedIn={isLoggedIn}
        onLoginClick={onLoginClick}
        onLogoutClick={onLogoutClick}
      />
    </div>
  );
}
