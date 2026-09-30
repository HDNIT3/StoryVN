"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Header } from "@/components/layout/header";

/**
 * SmartHeader: đọc trạng thái đăng nhập từ AuthContext,
 * tự động cập nhật khi user login/logout.
 */
export function SmartHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

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
      isLoggedIn={isAuthenticated}
      user={userProfileForHeader}
      onLogoutClick={handleLogout}
    />
  );
}
