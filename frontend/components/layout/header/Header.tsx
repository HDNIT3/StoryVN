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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Logo & Desktop Navigation */}
        <div className="flex items-center gap-6 lg:gap-8 shrink-0">
          <HeaderLogo {...logo} />

          <div className="hidden md:block">
            <HeaderNav
              items={navItems}
              activeNavId={activeNavId}
              genres={genres}
              onNavItemClick={onNavItemClick}
              onGenreClick={onGenreClick}
            />
          </div>
        </div>

        {/* Center / Right-Middle: Search Bar */}
        <div className="hidden sm:flex items-center justify-end flex-1 max-w-md mx-2">
          <HeaderSearch {...search} />
        </div>

        {/* Right Side: User Actions (Bookmark, Wallet, Avatar) & Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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

          {/* Mobile Menu Button & Drawer */}
          <HeaderMobileMenu
            navItems={navItems}
            activeNavId={activeNavId}
            genres={genres}
            onNavItemClick={onNavItemClick}
            onGenreClick={onGenreClick}
            onSearch={search?.onSearch}
          />
        </div>
      </div>
    </header>
  );
}

export default Header;
