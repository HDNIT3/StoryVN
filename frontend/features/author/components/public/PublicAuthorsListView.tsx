"use client";

import React, { useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { authorService, authorKeys, AuthorListItem } from "@/features/author";
import { useAllCategories } from "@/features/categories";
import { AuthorStatsBanner } from "./AuthorStatsBanner";
import { AuthorListFilterBar } from "./AuthorListFilterBar";
import { AuthorCardItem } from "./AuthorCardItem";

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

export function PublicAuthorsListView() {
  const [, startTransition] = useTransition();

  // Filters & Search
  const [searchInput, setSearchInput] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");

  const [sortBy, setSortBy] = useState<"featured" | "newest" | "updated" | "stories">("featured");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedProgress, setSelectedProgress] = useState<string>("");
  const [selectedBio, setSelectedBio] = useState<"all" | "yes" | "no">("all");

  const [currentPage, setCurrentPage] = useState<number>(1);

  // React Query: Community Stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: authorKeys.communityStats,
    queryFn: () => authorService.getCommunityStats(),
  });
  const stats = statsData?.data;

  // Categories Dropdown
  const { data: categories = [] } = useAllCategories();

  // Authors List Query
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
    queryKey: authorKeys.list(queryParams),
    queryFn: () => authorService.getAuthorsList(queryParams),
    placeholderData: (prev) => prev,
  });

  const authors: AuthorListItem[] = authorsData?.data?.items || [];
  const pagination = authorsData?.data?.pagination;

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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Banner Hero */}
        <AuthorStatsBanner
          stats={stats}
          isLoading={isLoadingStats}
          formatNumber={formatNumber}
        />

        {/* Filter Bar */}
        <AuthorListFilterBar
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          selectedGenre={selectedGenre}
          onSelectedGenreChange={setSelectedGenre}
          selectedProgress={selectedProgress}
          onSelectedProgressChange={setSelectedProgress}
          selectedBio={selectedBio}
          onSelectedBioChange={setSelectedBio}
          categories={categories}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        {/* Suggestion Section & Cards Grid */}
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

            {/* Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => handleTabChange("featured")}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
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
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
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
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
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
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 mt-6">
              {authors.map((author) => (
                <AuthorCardItem
                  key={author._id}
                  author={author}
                  formatNumber={formatNumber}
                />
              ))}
            </div>
          )}

          {/* Phân Trang */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={!pagination.hasPrevPage}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Trước
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
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
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
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
