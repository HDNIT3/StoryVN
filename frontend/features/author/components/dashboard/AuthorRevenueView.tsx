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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-8 max-w-7xl mx-auto space-y-6 sm:space-y-7 min-w-0">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex select-none items-center gap-2 text-xs font-medium text-slate-500"
      >
        <Link
          href="/tac-gia/tong-quan"
          className="inline-flex items-center gap-1 transition-colors hover:text-slate-900"
        >
          <span>← Bàn làm việc tác giả</span>
        </Link>
        <span aria-hidden className="text-slate-300">
          /
        </span>
        <span className="font-semibold text-slate-900">Doanh thu & Xu</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-amber-500/10 via-orange-500/5 to-transparent p-4 sm:p-6 rounded-2xl border border-amber-200/60 shadow-2xs">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100/70 border border-amber-200/80 px-2.5 py-0.5 rounded-full mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            DOANH THU & XU NHẬN ĐƯỢC
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span role="img" aria-label="coins" className="text-xl sm:text-2xl shrink-0">🪙</span>
            <span className="truncate">Lịch sử nhận Xu & Doanh thu tác giả</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Theo dõi chi tiết nguồn xu đến từ đâu, độc giả nào mở khóa chương nào và phân tích doanh thu theo từng tác phẩm của bạn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Tải lại dữ liệu"
          >
            <svg
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-amber-600" : "text-slate-500"}`}
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl transition shadow-2xs"
          >
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Ví cá nhân: <strong className="font-extrabold">{walletBalance.toLocaleString("vi-VN")} xu</strong> →</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng xu nhận được */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng xu nhận được
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              +{summary.totalCoinsEarned.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-bold text-amber-700 uppercase">Xu</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tổng doanh thu từ mở khóa chương VIP
          </p>
        </div>

        {/* Card 2: Tổng lượt mở khóa */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lượt độc giả mở khóa
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.totalUnlocks.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-semibold text-slate-500">lượt</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Số lần độc giả trả Xu mở chương VIP
          </p>
        </div>

        {/* Card 3: Tác phẩm có doanh thu */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tác phẩm sinh doanh thu
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
              {storiesWithRevenue}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / {summary.storyCount || allStories.length} truyện
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tác phẩm có ít nhất 1 lần mở khóa
          </p>
        </div>

        {/* Card 4: Số dư ví cá nhân */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Số dư ví cá nhân
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tracking-tight">
              {walletBalance.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-bold text-indigo-700 uppercase">Xu</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Ví tài khoản của bạn</span>
            <Link
              href="/vi"
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline"
            >
              Xem chi tiết →
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Lịch sử mở khóa chương</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {meta.total} giao dịch
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chi tiết từng lượt mở khóa: tên độc giả, chương, tác phẩm và thời gian nhận Xu.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Story Filter Select */}
            <div className="relative min-w-[160px] sm:min-w-[200px]">
              <select
                value={selectedStoryId || ""}
                onChange={handleStoryChange}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
              >
                <option value="">Tất cả tác phẩm ({allStories.length})</option>
                {allStories.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm chương hoặc độc giả..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
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
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-2 rounded-xl border border-rose-200 transition cursor-pointer"
                title="Xóa bộ lọc"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between gap-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="w-36 h-3.5 bg-slate-200 rounded" />
                    <div className="w-48 h-3 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-slate-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
            <p className="text-sm font-semibold text-rose-700">
              Không thể tải lịch sử nhận Xu của tác giả.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-xs font-bold text-rose-800 underline cursor-pointer"
            >
              Thử lại ngay
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-3 text-2xl">
              📖
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {selectedStoryId || searchInput
                ? "Không tìm thấy lượt mở khóa phù hợp"
                : "Chưa có lượt mở khóa chương nào"}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {selectedStoryId || searchInput
                ? "Vui lòng thử tìm kiếm bằng từ khóa khác hoặc bỏ chọn lọc tác phẩm."
                : "Khi độc giả mở khóa các chương VIP trả phí trong tác phẩm của bạn, danh sách giao dịch chi tiết sẽ xuất hiện tại đây."}
            </p>
            {(selectedStoryId || searchInput) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-lg hover:bg-amber-100 transition cursor-pointer"
              >
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <AuthorRevenueHistoryCard key={item._id} item={item} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Hiển thị{" "}
              <strong className="font-semibold text-slate-700">
                {(meta.page - 1) * meta.limit + 1} -{" "}
                {Math.min(meta.page * meta.limit, meta.total)}
              </strong>{" "}
              trong tổng số{" "}
              <strong className="font-semibold text-slate-700">{meta.total}</strong> lượt mở khóa
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                ← Trước
              </button>

              <span className="px-3 py-1.5 font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
                Trang {meta.page} / {meta.totalPages}
              </span>

              <button
                type="button"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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

