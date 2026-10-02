"use client";

import React from "react";
import { HeaderProps } from "./header.types";
import {
  DEFAULT_LOGO,
  DEFAULT_NAV_ITEMS,
  DEFAULT_GENRES,
  DEFAULT_USER,
  DEFAULT_WALLET,
  DEFAULT_BOOKMARK,
  DEFAULT_SEARCH,
} from "./header.constants";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderNav } from "./HeaderNav";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderActions } from "./HeaderActions";
import { HeaderMobileMenu } from "./HeaderMobileMenu";

export function Header({
  logo = DEFAULT_LOGO,
  navItems = DEFAULT_NAV_ITEMS,
  activeNavId = "home",
  genres = DEFAULT_GENRES,
  isLoggedIn = true,
  user = DEFAULT_USER,
  wallet = DEFAULT_WALLET,
  bookmark = DEFAULT_BOOKMARK,
  search = DEFAULT_SEARCH,
  onGenreClick,
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
      <div className="w-full max-w-[1600px] mx-auto px-2.5 xs:px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 h-15 sm:h-18 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
        {/* Left Side: Logo & Desktop Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-5 shrink-0">
          <HeaderLogo {...logo} />

          {/* Desktop Navigation (visible on xl screens) */}
          <div className="hidden xl:flex items-center">
            <HeaderNav
              items={navItems}
              activeNavId={activeNavId}
              genres={genres}
              onNavItemClick={onNavItemClick}
              onGenreClick={onGenreClick}
            />
          </div>
        </div>

        {/* Center: Search Bar (visible on lg and xl screens) */}
        <div className="hidden lg:flex items-center justify-center flex-1 max-w-[180px] xl:max-w-[240px] 2xl:max-w-xs mx-1 sm:mx-2 min-w-0">
          <HeaderSearch className="w-full" {...search} />
        </div>

        {/* Right Side: User Actions & Mobile Menu */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
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
            genres={genres}
            isLoggedIn={isLoggedIn}
            user={user}
            wallet={wallet}
            bookmark={bookmark}
            onNavItemClick={onNavItemClick}
            onGenreClick={onGenreClick}
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

export default Header;
