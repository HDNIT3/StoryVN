"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authorService } from "@/lib/services/author.service";
import { categoryService } from "@/lib/services/category.service";
import { queryKeys } from "@/lib/query-keys";
import type { AuthorListItem } from "@/types/author";

// Helper định dạng số dạng 1.5K, 2.4M
function formatNumber(num?: number): string {
  if (!num || isNaN(num)) return "0";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString("vi-VN");
}

export default function AuthorsPage() {
  const [, startTransition] = useTransition();

  // ─── 1. State bộ lọc tìm kiếm & sắp xếp ────────────────────────
  const [searchInput, setSearchInput] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");

  const [sortBy, setSortBy] = useState<"featured" | "newest" | "updated" | "stories">("featured");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedProgress, setSelectedProgress] = useState<string>("");
  const [selectedBio, setSelectedBio] = useState<"all" | "yes" | "no">("all");

  const [currentPage, setCurrentPage] = useState<number>(1);

  // ─── 2. React Query: Thống kê cộng đồng ────────────────────────
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: queryKeys.author.communityStats,
    queryFn: () => authorService.getCommunityStats(),
  });
  const stats = statsData?.data;

  // ─── 3. React Query: Danh sách thể loại để đổ vào Dropdown ────
  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.list({ all: true }),
    queryFn: () => categoryService.findAll({ all: true }),
  });
  const categories = categoriesData?.data?.items || [];

  // ─── 4. React Query: Danh sách tác giả theo bộ lọc ────────────
  const queryParams = {
    page: currentPage,
    limit: 12,
    search: appliedSearch.trim() || undefined,
    sortBy,
    genreId: selectedGenre || undefined,
    progressState: selectedProgress || undefined,
    hasBio: selectedBio !== "all" ? selectedBio : undefined,
  };

  const {
    data: authorsData,
    isLoading: isLoadingAuthors,
    isPlaceholderData,
  } = useQuery({
    queryKey: queryKeys.author.list(queryParams),
    queryFn: () => authorService.getAuthorsList(queryParams),
    placeholderData: (prev) => prev,
  });

  const authors: AuthorListItem[] = authorsData?.data?.items || [];
  const pagination = authorsData?.data?.pagination;

  // ─── 5. Handlers ──────────────────────────────────────────────
  const handleApplyFilters = () => {
    startTransition(() => {
      setAppliedSearch(searchInput);
      setCurrentPage(1);
    });
  };

  const handleResetFilters = () => {
    startTransition(() => {
      setSearchInput("");
      setAppliedSearch("");
      setSortBy("featured");
      setSelectedGenre("");
      setSelectedProgress("");
      setSelectedBio("all");
      setCurrentPage(1);
    });
  };

  const handleTabChange = (tab: "featured" | "newest" | "updated") => {
    startTransition(() => {
      setSortBy(tab);
      setCurrentPage(1);
    });
  };

  return (
    <div className="min-h-screen bg-[#faf7f2]/60 dark:bg-zinc-950 pb-20 pt-4 sm:pt-6">
      <div className="w-full px-3 sm:px-5 md:px-7 lg:px-10 xl:px-12 2xl:px-16 space-y-6">
        {/* ═══════════════════════════════════════════════════════════
            1. BANNER HERO: CỘNG ĐỒNG SÁNG TÁC - TÁC GIẢ STORYVN
        ═════════════════════════════════════════════════════════════ */}
        <section className="relative rounded-3xl border border-amber-200/80 dark:border-zinc-800 bg-[#fffdf9] dark:bg-zinc-900/95 shadow-sm p-6 sm:p-8 lg:p-10 transition-colors">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            {/* Cột trái: Illustration + Title + Description */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6 flex-1">
              {/* Hình minh họa bút lông & lọ mực cổ điển */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-amber-50 dark:bg-zinc-800 border border-amber-200/70 dark:border-zinc-700 flex-shrink-0 shadow-sm">
                <Image
                  src="/image/tac-gia-quill.jpg"
                  alt="Tác giả StoryVN - Cộng đồng sáng tác"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Tiêu đề & Giới thiệu */}
              <div className="space-y-1.5">
                <span className="text-xs sm:text-[13px] font-bold tracking-widest text-[#991b1b] dark:text-rose-400 uppercase">
                  CỘNG ĐỒNG SÁNG TÁC
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 font-serif tracking-tight">
                  Tác giả StoryVN
                </h1>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed pt-1">
                  Khám phá những cây bút đang góp phần làm đầy kệ sách StoryVN bằng
                  tác phẩm mới, chương mới và những giọng kể riêng.
                </p>
              </div>
            </div>

            {/* Cột phải: 3 Hộp thống kê (Tác giả - Tác phẩm - Chương) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full sm:w-auto flex-shrink-0">
              {/* Hộp 1: Số Tác giả */}
              <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-amber-200/80 dark:border-zinc-700/80 shadow-sm min-w-[95px] sm:min-w-[120px] text-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#991b1b] dark:text-rose-400 font-serif">
                  {isLoadingStats ? "..." : formatNumber(stats?.totalAuthors || 0)}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                  Tác giả
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  đã đăng truyện
                </span>
              </div>

              {/* Hộp 2: Số Tác phẩm */}
              <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-amber-200/80 dark:border-zinc-700/80 shadow-sm min-w-[95px] sm:min-w-[120px] text-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#991b1b] dark:text-rose-400 font-serif">
                  {isLoadingStats ? "..." : formatNumber(stats?.totalStories || 0)}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                  Tác phẩm
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  đang lưu giữ
                </span>
              </div>

              {/* Hộp 3: Số Chương */}
              <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-amber-200/80 dark:border-zinc-700/80 shadow-sm min-w-[95px] sm:min-w-[120px] text-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#991b1b] dark:text-rose-400 font-serif">
                  {isLoadingStats ? "..." : formatNumber(stats?.totalChapters || 0)}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                  Chương
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  đã xuất bản
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            2. BỘ LỌC TÌM KIẾM (FILTER BAR)
        ═════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 items-end">
            {/* Cột 1: Tìm tác giả (Search Input) */}
            <div className="space-y-1.5">
              <label
                htmlFor="search-author"
                className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                TÌM TÁC GIẢ
              </label>
              <div className="relative">
                <input
                  id="search-author"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyFilters();
                  }}
                  placeholder="Tên tác giả, bút danh hoặc slug"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#8b181b]/30 focus:border-[#8b181b] transition-all"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setAppliedSearch("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Cột 2: Sắp xếp */}
            <div className="space-y-1.5">
              <label
                htmlFor="sort-by"
                className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                SẮP XẾP
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#8b181b]/30 cursor-pointer shadow-none"
              >
                <option value="featured">Nổi bật</option>
                <option value="newest">Mới tham gia</option>
                <option value="updated">Mới cập nhật</option>
                <option value="stories">Nhiều tác phẩm</option>
              </select>
            </div>

            {/* Cột 3: Thể loại */}
            <div className="space-y-1.5">
              <label
                htmlFor="filter-genre"
                className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                THỂ LOẠI
              </label>
              <select
                id="filter-genre"
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#8b181b]/30 cursor-pointer shadow-none"
              >
                <option value="">Tất cả thể loại</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cột 4: Trạng thái truyện */}
            <div className="space-y-1.5">
              <label
                htmlFor="filter-progress"
                className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                TRẠNG THÁI TRUYỆN
              </label>
              <select
                id="filter-progress"
                value={selectedProgress}
                onChange={(e) => {
                  setSelectedProgress(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#8b181b]/30 cursor-pointer shadow-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ONGOING">Đang ra</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="ON_HOLD">Tạm ngưng</option>
              </select>
            </div>

            {/* Cột 5: Tiểu sử */}
            <div className="space-y-1.5">
              <label
                htmlFor="filter-bio"
                className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                TIỂU SỬ
              </label>
              <select
                id="filter-bio"
                value={selectedBio}
                onChange={(e) => {
                  setSelectedBio(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#8b181b]/30 cursor-pointer shadow-none"
              >
                <option value="all">Tất cả tác giả</option>
                <option value="yes">Đã có tiểu sử</option>
                <option value="no">Chưa có tiểu sử</option>
              </select>
            </div>

            {/* Cột 6: Thao tác (Áp dụng & Đặt lại) */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <span className="block text-[11px] font-bold text-transparent select-none uppercase tracking-wider hidden xl:block">
                THAO TÁC
              </span>
              <div className="flex items-center gap-2 w-full">
                {/* Nút Áp dụng */}
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm bg-[#8b181b] hover:bg-[#721316] text-white transition-all shadow-sm shadow-[#8b181b]/20 whitespace-nowrap cursor-pointer hover:scale-[1.02] text-center"
                >
                  Áp dụng
                </button>

                {/* Nút Đặt lại */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-2.5 rounded-xl font-medium text-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors whitespace-nowrap cursor-pointer text-center"
                  title="Đặt lại bộ lọc"
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            3. KHUNG GỢI Ý THEO DÕI & DANH SÁCH THẺ TÁC GIẢ
        ═════════════════════════════════════════════════════════════ */}
        <section className="rounded-3xl border border-amber-300/70 dark:border-amber-900/40 bg-[#fffdfa] dark:bg-zinc-900/90 p-5 sm:p-7 shadow-sm">
          {/* Header Section: Title & Pill Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
            <div>
              <span className="text-xs font-bold tracking-widest text-amber-700 dark:text-amber-500 uppercase">
                GỢI Ý THEO DÕI
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 font-serif tracking-tight mt-0.5">
                {sortBy === "featured"
                  ? "Tác giả nổi bật"
                  : sortBy === "newest"
                  ? "Tác giả mới tham gia"
                  : sortBy === "updated"
                  ? "Tác giả mới cập nhật"
                  : "Tác giả nhiều tác phẩm"}
              </h2>
            </div>

            {/* Pill Tabs: Nổi bật | Mới tham gia | Mới cập nhật */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => handleTabChange("featured")}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  sortBy === "featured"
                    ? "bg-[#8b181b] text-white shadow-sm shadow-[#8b181b]/25"
                    : "bg-white dark:bg-zinc-800/80 border border-zinc-200/90 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                Nổi bật
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("newest")}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  sortBy === "newest"
                    ? "bg-[#8b181b] text-white shadow-sm shadow-[#8b181b]/25"
                    : "bg-white dark:bg-zinc-800/80 border border-zinc-200/90 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                Mới tham gia
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("updated")}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  sortBy === "updated"
                    ? "bg-[#8b181b] text-white shadow-sm shadow-[#8b181b]/25"
                    : "bg-white dark:bg-zinc-800/80 border border-zinc-200/90 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                Mới cập nhật
              </button>
            </div>
          </div>

          {/* Grid Thẻ Tác Giả */}
          {isLoadingAuthors && !isPlaceholderData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 mt-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800 animate-pulse border border-zinc-200/60 dark:border-zinc-800"
                />
              ))}
            </div>
          ) : authors.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 mt-6 p-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-3xl">
                🖋️
              </div>
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                Không tìm thấy tác giả nào
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Không có tác giả phù hợp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 mt-6">
              {authors.map((author) => (
                <Link
                  key={author._id}
                  href={`/tac-gia/${author.username}`}
                  className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-900/60 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
                >
                  <div>
                    {/* Hàng đầu: Avatar + Tên tác giả + Thể loại tags + Mũi tên */}
                    <div className="flex items-start gap-3.5">
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 dark:from-zinc-800 dark:to-zinc-700 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center text-amber-900 dark:text-zinc-200 font-bold text-lg flex-shrink-0 shadow-inner">
                        {author.avatarUrl ? (
                          <Image
                            src={author.avatarUrl}
                            alt={author.penName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <span>
                            {author.penName?.charAt(0)?.toUpperCase() || "A"}
                          </span>
                        )}
                      </div>

                      {/* Tên & Tag Thể Loại */}
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 font-serif group-hover:text-[#8b181b] dark:group-hover:text-amber-400 transition-colors truncate">
                          {author.penName}
                        </h3>

                        {/* Tags Thể Loại tiêu biểu (Đô thị, Tiên hiệp...) */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {author.genres && author.genres.length > 0 ? (
                            author.genres.slice(0, 2).map((g, idx) => (
                              <span
                                key={g._id || idx}
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                  idx === 0
                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60"
                                    : "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60"
                                }`}
                              >
                                {g.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              Sáng tác StoryVN
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Icon Mũi tên điều hướng */}
                      <div className="text-zinc-300 dark:text-zinc-600 group-hover:text-[#8b181b] dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all pt-1 flex-shrink-0">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Đoạn trích Tiểu Sử (Bio quote) */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/70">
                      <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 italic line-clamp-2 leading-relaxed">
                        {author.biography ? (
                          `“${author.biography}”`
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500 not-italic">
                            Tác giả chưa cập nhật tiểu sử sáng tác.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Thông tin số tác phẩm / lượt xem phía dưới thẻ */}
                  <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                    <span>
                      {author.storyCount} tác phẩm
                    </span>
                    <span>
                      👁️ {formatNumber(author.totalViews)} lượt đọc
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Phân Trang (Pagination) */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={!pagination.hasPrevPage}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                Trước
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    pageNum === currentPage
                      ? "bg-[#8b181b] text-white shadow-sm shadow-[#8b181b]/20"
                      : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={!pagination.hasNextPage}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
