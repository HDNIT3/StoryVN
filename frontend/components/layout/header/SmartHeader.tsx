"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/AuthContext";
import { Header } from "@/components/layout/header";
import categoryService from "@/lib/services/category.service";
import { historyService } from "@/lib/services/history.service";
import type { GenreItem } from "./header.types";

/**
 * SmartHeader: đọc trạng thái đăng nhập từ AuthContext,
 * tải thể loại từ API, kích hoạt chức năng tìm kiếm và menu thể loại.
 */
export function SmartHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [historyCount, setHistoryCount] = useState(0);

  // Xác định tab đang active dựa trên pathname
  let activeNavId = "home";
  if (pathname?.startsWith("/the-loai")) {
    activeNavId = "the-loai";
  } else if (pathname?.startsWith("/bang-xep-hang")) {
    activeNavId = "bang-xep-hang";
  } else if (pathname === "/") {
    activeNavId = "home";
  }

  // Cập nhật số lượng truyện đã đọc trong lịch sử
  useEffect(() => {
    const updateCount = () => {
      setHistoryCount(historyService.getHistory().length);
    };
    updateCount();
    window.addEventListener("storyvn_history_updated", updateCount);
    return () => window.removeEventListener("storyvn_history_updated", updateCount);
  }, []);

  // Tải danh sách thể loại từ API
  const { data: categoriesData } = useQuery({
    queryKey: ["header", "categories"],
    queryFn: async () => {
      const res = await categoryService.findAll({ all: true, isActive: true });
      return res.data?.items ?? [];
    },
    staleTime: 1000 * 60 * 10, // 10 phút
  });

  const genres: GenreItem[] = (categoriesData || []).map((c) => ({
    id: c.slug || c._id,
    name: c.name,
    href: `/the-loai?genre=${c.slug || c._id}`,
  }));

  const handleLogout = async () => {
    await logout();
    router.push("/dang-nhap");
  };

  const handleSearch = (keyword: string) => {
    if (keyword.trim()) {
      router.push(`/?search=${encodeURIComponent(keyword.trim())}`);
    } else {
      router.push("/");
    }
  };

  const handleGenreClick = (genre: GenreItem) => {
    if (genre.href) {
      router.push(genre.href);
    } else {
      router.push(`/the-loai?genre=${genre.id}`);
    }
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
      activeNavId={activeNavId}
      genres={genres}
      search={{
        placeholder: "Tìm tên truyện, tác giả...",
        onSearch: handleSearch,
      }}
      bookmark={{
        count: historyCount,
        iconSrc: "/icon/bookmark.svg",
        href: "/ho-so",
      }}
      onGenreClick={handleGenreClick}
      onLogoutClick={handleLogout}
    />
  );
}
