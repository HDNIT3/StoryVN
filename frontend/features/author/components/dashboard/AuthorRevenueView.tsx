"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useMyWallet } from "@/features/wallet";
import { useMyStories } from "@/features/stories";
import { useAuthorRevenueHistory } from "../../queries/useAuthorQueries";
import { AuthorRevenueBreakdownCard } from "./AuthorRevenueBreakdownCard";
import { AuthorRevenueHistoryCard } from "./AuthorRevenueHistoryCard";

const PAGE_SIZE = 15;

export function AuthorRevenueView() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [selectedStoryId, setSelectedStoryId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Fetch author personal wallet for quick reference
  const { data: walletData } = useMyWallet();
  const walletBalance = walletData?.balance ?? 0;

  // Fetch author stories for the filter dropdown
  const { data: myStoriesData } = useMyStories({ limit: 100 });
  const allStories = myStoriesData?.items || [];

  // Fetch revenue history & summary
  const {
    data: revenueData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAuthorRevenueHistory({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    storyId: selectedStoryId,
  });

  const items = revenueData?.items || [];
  const meta = revenueData?.meta || {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
  const summary = revenueData?.summary || {
    totalCoinsEarned: 0,
    totalUnlocks: 0,
    storyCount: 0,
    storiesBreakdown: [],
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1);
  };

  const handleStoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStoryId(val ? val : undefined);
    setPage(1);
  };

  const handleSelectStoryBreakdown = (storyId: string | undefined) => {
    setSelectedStoryId(storyId);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSelectedStoryId(undefined);
    setPage(1);
  };

  const storiesWithRevenue = summary.storiesBreakdown.filter((s) => s.totalCoins > 0).length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Doanh thu & Xu
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Theo dõi xu nhận được từ mở khóa chương VIP và phân bổ doanh thu theo từng tác phẩm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Tải lại dữ liệu"
          >
            <svg
              className={`w-4 h-4 ${isFetching ? "animate-spin text-sky-600" : "text-zinc-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isFetching ? "Đang đồng bộ..." : "Làm mới"}</span>
          </button>

          <Link
            href="/vi"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs"
          >
            <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>
              Ví cá nhân:{" "}
              <strong className="font-bold text-amber-600">
                {walletBalance.toLocaleString("vi-VN")} xu
              </strong>
            </span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng xu nhận được */}
        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Tổng xu nhận được
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-600 tracking-tight">
              +{summary.totalCoinsEarned.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs text-zinc-500">xu</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Từ mở khóa chương VIP
          </div>
        </div>

        {/* Card 2: Tổng lượt mở khóa */}
        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Lượt độc giả mở khóa
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-zinc-900 tracking-tight">
              {summary.totalUnlocks.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs text-zinc-500">lượt</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Số lần trả xu mở chương VIP
          </div>
        </div>

        {/* Card 3: Tác phẩm có doanh thu */}
        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Tác phẩm sinh doanh thu
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 tracking-tight">
              {storiesWithRevenue}
            </span>
            <span className="text-xs text-zinc-500">
              / {summary.storyCount || allStories.length} truyện
            </span>
          </div>
          <div className="mt-1 text-xs text-zinc-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Có ít nhất 1 lượt mở khóa</span>
          </div>
        </div>

        {/* Card 4: Số dư ví cá nhân */}
        <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Số dư ví cá nhân
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-sky-600 tracking-tight">
              {walletBalance.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs text-zinc-500">xu</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Ví tài khoản của bạn</span>
            <Link
              href="/vi"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              Chi tiết →
            </Link>
          </div>
        </div>
      </div>

      {/* Breakdown Section: "Xu đến từ đâu?" */}
      <AuthorRevenueBreakdownCard
        breakdown={summary.storiesBreakdown}
        selectedStoryId={selectedStoryId}
        onSelectStory={handleSelectStoryBreakdown}
        totalCoins={summary.totalCoinsEarned}
      />

      {/* Detailed Unlock History Transactions */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs overflow-hidden">
        {/* Section Header & Filters */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
              <span>Lịch sử mở khóa chương</span>
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
                {meta.total} giao dịch
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Chi tiết từng lượt mở khóa: độc giả, chương, tác phẩm và thời gian nhận xu.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Story Filter Select */}
            <select
              value={selectedStoryId || ""}
              onChange={handleStoryChange}
              className="px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer max-w-[220px]"
            >
              <option value="">Tất cả tác phẩm ({allStories.length})</option>
              {allStories.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:flex-none sm:max-w-xs min-w-[180px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm chương hoặc độc giả..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-8 py-1.5 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Clear Filter button if filters active */}
            {(selectedStoryId || searchInput) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-xs font-semibold transition cursor-pointer"
                title="Xóa bộ lọc"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-zinc-100 rounded-md animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-red-600">
              Không thể tải lịch sử nhận xu của tác giả.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-xs font-semibold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900">
              {selectedStoryId || searchInput
                ? "Không tìm thấy lượt mở khóa phù hợp"
                : "Chưa có lượt mở khóa chương nào"}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm">
              {selectedStoryId || searchInput
                ? "Vui lòng thử tìm kiếm bằng từ khóa khác hoặc bỏ chọn lọc tác phẩm."
                : "Khi độc giả mở khóa các chương VIP trả phí trong tác phẩm của bạn, danh sách giao dịch chi tiết sẽ xuất hiện tại đây."}
            </p>
            {(selectedStoryId || searchInput) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-xs font-semibold transition cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 space-y-2.5">
            {items.map((item) => (
              <AuthorRevenueHistoryCard key={item._id} item={item} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3.5 sm:px-4 py-3 border-t border-zinc-200 text-xs">
            <span className="text-zinc-500">
              Hiển thị{" "}
              <strong className="font-semibold text-zinc-700">
                {(meta.page - 1) * meta.limit + 1} -{" "}
                {Math.min(meta.page * meta.limit, meta.total)}
              </strong>{" "}
              trong tổng số{" "}
              <strong className="font-semibold text-zinc-700">{meta.total}</strong> lượt mở khóa
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md border border-zinc-200 bg-white font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                ← Trước
              </button>

              <span className="px-3 py-1.5 font-semibold text-white bg-zinc-900 rounded-md">
                Trang {meta.page} / {meta.totalPages}
              </span>

              <button
                type="button"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-md border border-zinc-200 bg-white font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
