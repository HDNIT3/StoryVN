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
    <div className="min-h-screen bg-white pb-20 pt-4 sm:pt-6">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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

        {/* Suggestion Section & Cards Grid (Đã xóa nền boxed) */}
        <section className="space-y-6 pt-2">
          {/* Header Section: Title & Pill Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold tracking-widest text-sky-600 uppercase">
                GỢI Ý THEO DÕI
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
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
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Nổi bật
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("newest")}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  sortBy === "newest"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Mới tham gia
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("updated")}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  sortBy === "updated"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Mới cập nhật
              </button>
            </div>
          </div>

          {/* Grid Thẻ Tác Giả: CỐ ĐỊNH 3 TÁC GIẢ MỖI HÀNG TRÊN DESKTOP */}
          {isLoadingAuthors && !isPlaceholderData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/80"
                />
              ))}
            </div>
          ) : authors.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 mt-6 p-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-sky-50 flex items-center justify-center text-3xl">
                🖋️
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Không tìm thấy tác giả nào
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Không có tác giả phù hợp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-6">
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
            <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={!pagination.hasPrevPage}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
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
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={!pagination.hasNextPage}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
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
