"use client";

import React, { useEffect, useState } from "react";
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

// ─── Home section anchors ─────────────────────────────────────────
const HOME_SECTION_LINKS = [
  { id: "noi-bat", label: "Nổi bật" },
  { id: "bang-xep-hang", label: "Bảng xếp hạng" },
  { id: "top-nhieu-chu", label: "Top nhiều chữ" },
  { id: "moi-cap-nhat", label: "Mới cập nhật" },
] as const;

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
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [activeSection, setActiveSection] = useState<string>("noi-bat");

  useEffect(() => {
    if (!isHome) return;

    const sections = HOME_SECTION_LINKS.map((item) =>
      document.getElementById(item.id)
    ).filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-140px 0px -55% 0px",
        threshold: [0, 0.2, 0.5, 0.8],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHome]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <header
      className={`w-full border-b border-white/60 bg-white/80 transition-all ${
        sticky
          ? "sticky top-0 z-40 bg-white/80 shadow-[0_1px_0_rgba(15,23,42,0.04),0_14px_40px_-30px_rgba(14,165,233,0.55)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/70"
          : ""
      } ${className}`}
    >
      <div className="flex h-16 w-full min-w-0 items-center justify-between gap-2 px-4 sm:h-20 sm:gap-3 sm:px-6 lg:gap-4 lg:px-8 2xl:px-10">
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

      {/* Home section quick navigation */}
      {isHome && (
        <div className="border-t border-slate-100/80 bg-white/70 backdrop-blur-xl">
          <nav
            aria-label="Mục lục trang chủ"
            className="flex w-full items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8 2xl:px-10"
          >
            <span className="hidden shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-slate-400 sm:inline">
              Mục lục
            </span>
            <div className="flex items-center gap-1">
              {HOME_SECTION_LINKS.map((item) => {
                const isActive = activeSection === item.id;

                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToSection(item.id);
                    }}
                    aria-current={isActive ? "true" : undefined}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-sky-50 text-sky-600 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.16)]"
                        : "text-slate-600 hover:bg-sky-50/70 hover:text-sky-600"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </nav>
        </div>
      )}
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
