"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Header } from "@/components/layout/header";

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
  } else if (pathname.startsWith("/the-loai")) {
    activeNavId = "the-loai";
  } else if (pathname.startsWith("/bang-xep-hang")) {
    activeNavId = "bang-xep-hang";
  } else if (pathname.startsWith("/dien-dan")) {
    activeNavId = "dien-dan";
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
