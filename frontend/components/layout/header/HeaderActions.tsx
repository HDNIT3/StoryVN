"use client";

import React from "react";
import { HeaderActionsProps } from "./header.types";
import { DEFAULT_USER, DEFAULT_WALLET, DEFAULT_BOOKMARK } from "./header.constants";
import { HeaderBookmark } from "./HeaderBookmark";
import { HeaderWallet } from "./HeaderWallet";
import { HeaderUserAvatar } from "./HeaderUserAvatar";
import { NotificationBell } from "./NotificationBell";

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
      {isLoggedIn && (
        <HeaderBookmark
          bookmark={bookmark}
          onClick={onBookmarkClick}
        />
      )}

      {/* Notification Bell */}
      {isLoggedIn && (
        <NotificationBell size="md" />
      )}

      {/* Wallet coin pill */}
      {isLoggedIn && (
        <HeaderWallet
          wallet={wallet}
          onRechargeClick={onRechargeClick}
        />
      )}

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

