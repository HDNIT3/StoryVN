"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  HeaderProps,
  LogoProps,
  DEFAULT_LOGO,
  DEFAULT_NAV_ITEMS,
  DEFAULT_USER,
  DEFAULT_WALLET,
  DEFAULT_BOOKMARK,
  DEFAULT_SEARCH,
} from "./header.config";
import { HeaderNav } from "./HeaderNav";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderActions } from "./HeaderActions";
import { HeaderMobileMenu } from "./HeaderMobileMenu";

// ─── Logo ─────────────────────────────────────────────────────────
function HeaderLogo({
  title = DEFAULT_LOGO.title ?? "Story",
  suffix = DEFAULT_LOGO.suffix ?? "VN",
  subtitle = DEFAULT_LOGO.subtitle ?? "TIỂU THUYẾT TRỰC TUYẾN",
  iconSrc = DEFAULT_LOGO.iconSrc ?? "/icon/iconweb.png",
  href = DEFAULT_LOGO.href ?? "/",
  className = "",
}: LogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 sm:gap-2.5 shrink-0 ${className}`}
      aria-label={`${title}${suffix} - ${subtitle}`}
    >
      {/* Brand Icon Box */}
      <div className="relative w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 rounded-xl overflow-hidden border border-zinc-100">
        <Image
          src={iconSrc}
          alt={`${title}${suffix} Icon`}
          width={40}
          height={40}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {/* Brand Typography */}
      <span className="select-none text-lg sm:text-2xl md:text-[26px] font-black tracking-tight leading-none text-zinc-900">
        {title}
        <span className="text-sky-500">{suffix}</span>
      </span>
    </Link>
  );
}

// ─── Header shell ─────────────────────────────────────────────────
export function Header({
  logo = DEFAULT_LOGO,
  navItems = DEFAULT_NAV_ITEMS,
  activeNavId = "home",
  isLoggedIn = true,
  user = DEFAULT_USER,
  wallet = DEFAULT_WALLET,
  bookmark = DEFAULT_BOOKMARK,
  search = DEFAULT_SEARCH,
  onNavItemClick,
  onLoginClick,
  onLogoutClick,
  sticky = true,
  className = "",
}: HeaderProps = {}) {
  return (
    <header
      className={`w-full bg-white border-b border-zinc-100 transition-all ${
        sticky ? "sticky top-0 z-40 backdrop-blur-md bg-white/95" : ""
      } ${className}`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 min-w-0">
        {/* Left Side: Logo & Desktop Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 shrink-0">
          <HeaderLogo {...logo} />

          {/* Desktop Navigation (visible on xl screens) */}
          <div className="hidden xl:flex items-center">
            <HeaderNav
              items={navItems}
              activeNavId={activeNavId}
              onNavItemClick={onNavItemClick}
            />
          </div>
        </div>

        {/* Center: Search Bar (visible on md, lg and xl screens with fluid responsiveness) */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2 sm:mx-3 min-w-[160px] sm:min-w-[200px]">
          <HeaderSearch className="w-full" {...search} />
        </div>

        {/* Right Side: User Actions & Mobile Menu */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          <HeaderActions
            isLoggedIn={isLoggedIn}
            user={user}
            wallet={wallet}
            bookmark={bookmark}
            onLoginClick={onLoginClick}
            onLogoutClick={onLogoutClick}
            onBookmarkClick={() => {
              if (bookmark?.onClick) bookmark.onClick();
            }}
            onRechargeClick={() => {
              if (wallet?.onRechargeClick) wallet.onRechargeClick();
            }}
          />

          {/* Mobile/Tablet Menu Button & Drawer (visible on < xl screens) */}
          <HeaderMobileMenu
            navItems={navItems}
            activeNavId={activeNavId}
            isLoggedIn={isLoggedIn}
            user={user}
            wallet={wallet}
            bookmark={bookmark}
            onNavItemClick={onNavItemClick}
            onSearch={search?.onSearch}
            onLoginClick={onLoginClick}
            onLogoutClick={onLogoutClick}
            onRechargeClick={() => {
              if (wallet?.onRechargeClick) wallet.onRechargeClick();
            }}
            onBookmarkClick={() => {
              if (bookmark?.onClick) bookmark.onClick();
            }}
          />
        </div>
      </div>
    </header>
  );
}

// ─── Auth-aware wrapper ───────────────────────────────────────────
/**
 * SmartHeader: đọc trạng thái đăng nhập từ AuthContext,
 * tự động cập nhật khi user login/logout và active menu item theo URL.
 */
export function SmartHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  let activeNavId = "home";
  if (pathname.startsWith("/truyen")) {
    activeNavId = "truyen";
  } else if (pathname.startsWith("/tac-gia")) {
    activeNavId = "tac-gia";
  }

  const handleLogout = async () => {
    await logout();
    router.push("/dang-nhap");
  };

  const userProfileForHeader = user
    ? {
        name: user.displayName,
        avatarUrl: user.avatarUrl ?? undefined,
        email: user.email,
        role: user.role,
      }
    : undefined;

  return (
    <Header
      activeNavId={activeNavId}
      isLoggedIn={isAuthenticated}
      user={userProfileForHeader}
      onLogoutClick={handleLogout}
    />
  );
}

export default Header;
