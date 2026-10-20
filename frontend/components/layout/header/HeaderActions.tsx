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
  const href = bookmark.href ?? "/tai-khoan/tu-truyen";

  const content = (
    <div
      className={`relative p-1 sm:p-2 rounded-full hover:bg-zinc-100 text-zinc-700 transition-colors select-none group cursor-pointer shrink-0 ${className}`}
      title="Tủ truyện đã lưu"
      aria-label={`Tủ truyện: ${count} truyện đã lưu`}
    >
      <div className="relative w-4 h-4 sm:w-5 sm:h-5 shrink-0">
        <Image
          src={iconSrc}
          alt="Icon tủ truyện"
          width={20}
          height={20}
          className="w-full h-full object-contain"
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
      className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-amber-50 hover:bg-amber-100/60 border border-amber-200 rounded-full transition-colors select-none shrink-0 ${className}`}
      title={`Số dư: ${coins.toLocaleString("vi-VN")} ${unit}`}
    >
      {/* Coin Icon from public/icon */}
      <div className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0">
        <Image
          src={iconSrc}
          alt="Icon đồng xu"
          width={16}
          height={16}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Balance Text */}
      <span className="text-[11px] sm:text-xs font-bold text-amber-900 whitespace-nowrap">
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
          className="ml-0.5 w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center rounded-full text-amber-700 hover:text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer shrink-0"
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
          className="px-3.5 py-2 text-sm font-medium text-zinc-700 hover:text-sky-600 hover:bg-sky-50/70 transition-colors rounded-lg whitespace-nowrap"
        >
          Đăng nhập
        </Link>
        <Link
          href="/dang-ky"
          onClick={onLoginClick}
          className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 active:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
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
        className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 rounded-full hover:bg-zinc-100 transition-colors group cursor-pointer shrink-0"
      >
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-sky-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center overflow-hidden ring-2 ring-sky-200 group-hover:ring-sky-400 transition-colors select-none shrink-0">
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
        <div className="absolute right-0 mt-2 w-60 sm:w-64 max-w-[calc(100vw-20px)] bg-white rounded-xl shadow-xl border border-zinc-200/80 p-1.5 z-50">
          {/* User Info Header */}
          <div className="px-3 py-2.5 border-b border-zinc-100 mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-sky-500 text-white font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
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
