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
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-white/80 shadow-[0_6px_18px_-8px_rgba(14,165,233,0.75)] ring-1 ring-slate-100 sm:h-11 sm:w-11 md:h-12 md:w-12">
        <Image
          src={iconSrc}
          alt={`${title}${suffix} Icon`}
          width={48}
          height={48}
          className="h-full w-full object-cover"
          priority
        />
      </div>

      {/* Brand Typography */}
      <span className="select-none text-xl font-extrabold leading-none tracking-tight text-slate-900 sm:text-3xl md:text-[32px]">
        {title}
        <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
          {suffix}
        </span>
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
      className={`w-full border-b border-slate-200/80 bg-white/95 transition-all ${
        sticky
          ? "sticky top-0 z-50 bg-white/95 shadow-xs backdrop-blur-xl supports-[backdrop-filter]:bg-white/90"
          : ""
      } ${className}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl min-w-0 items-center justify-between gap-2 px-4 sm:h-20 sm:gap-3 sm:px-6 lg:gap-4 lg:px-8">
        {/* Left Side: Logo & Desktop Navigation */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
          <HeaderLogo {...logo} />

          {/* Desktop Navigation (visible on lg screens and up) */}
          <div className="hidden items-center lg:flex">
            <HeaderNav
              items={navItems}
              activeNavId={activeNavId}
              onNavItemClick={onNavItemClick}
            />
          </div>
        </div>

        {/* Center: Search Bar (visible on md, lg and xl screens with fluid responsiveness) */}
        <div className="mx-2 hidden min-w-[180px] max-w-xs flex-1 items-center justify-center sm:mx-3 sm:min-w-[220px] md:flex md:max-w-sm lg:max-w-md xl:max-w-lg">
          <HeaderSearch className="w-full" {...search} />
        </div>

        {/* Right Side: User Actions & Mobile Menu */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
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
