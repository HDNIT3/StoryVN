"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useMyWallet } from "@/features/wallet";
import { useChapterPurchaseHistory } from "../../queries/useChapterQueries";
import { ChapterPurchaseHistoryCard } from "./ChapterPurchaseHistoryCard";

const PAGE_SIZE = 10;

export function ChapterPurchaseHistoryView() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [page, setPage] = useState(1);

  // Reset về page 1 khi search thay đổi
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1);
  };

  const { data: walletData } = useMyWallet();
  const { data, isLoading, isError, refetch } = useChapterPurchaseHistory({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const summary = data?.summary || { totalUnlocked: 0, totalCoinsSpent: 0 };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex select-none items-center gap-2 text-xs font-medium text-zinc-500"
      >
        <Link
          href="/ho-so"
          className="inline-flex items-center gap-1 transition-colors hover:text-zinc-900"
        >
          <span>← Hồ sơ cá nhân</span>
        </Link>
        <span aria-hidden className="text-zinc-300">
          /
        </span>
        <span className="font-semibold text-zinc-900">Lịch sử mua chương</span>
      </nav>

      {/* Tiêu đề & Nút nạp Xu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-amber-700 uppercase block mb-1">
            GIAO DỊCH NỘI DUNG
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Lịch sử mua chương
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            Danh sách tất cả các chương truyện trả phí bạn đã mở khóa bằng Xu tại StoryVN.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/vi"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200/80 transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Ví của tôi</span>
          </Link>

          <Link
            href="/nap-xu"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nạp Xu</span>
          </Link>
        </div>
      </div>

      {/* Thẻ thống kê tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2.5 text-zinc-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </span>
            <p className="text-xs font-semibold">Chương đã mở khóa</p>
          </div>
          <p className="mt-3 text-xl sm:text-2xl font-bold tabular-nums text-zinc-900">
            {summary.totalUnlocked.toLocaleString("vi-VN")}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">Sở hữu vĩnh viễn không giới hạn</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2.5 text-zinc-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <p className="text-xs font-semibold">Tổng Xu đã dùng</p>
          </div>
          <p className="mt-3 text-xl sm:text-2xl font-bold tabular-nums text-amber-600">
            {summary.totalCoinsSpent.toLocaleString("vi-VN")} Xu
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">Ủng hộ các tác giả sáng tác</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2.5 text-zinc-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </span>
            <p className="text-xs font-semibold">Số dư ví hiện tại</p>
          </div>
          <p className="mt-3 text-xl sm:text-2xl font-bold tabular-nums text-emerald-700">
            {(walletData?.balance ?? 0).toLocaleString("vi-VN")} Xu
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">Sẵn sàng để đọc thêm chương VIP</p>
        </div>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Tìm theo tên truyện, tên chương hoặc số chương..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Danh sách kết quả */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl border border-zinc-200 bg-white animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-2xs">
          <p className="text-sm font-semibold text-rose-600">
            Không thể tải lịch sử mua chương
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Vui lòng kiểm tra kết nối mạng và thử lại.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 cursor-pointer rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-200"
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            {searchInput ? "Không tìm thấy chương đã mua phù hợp" : "Bạn chưa mua chương truyện nào"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-zinc-500">
            {searchInput
              ? "Hãy thử tìm kiếm với từ khóa khác như tên truyện hoặc số thứ tự chương."
              : "Khám phá các tác phẩm đặc sắc và mở khóa để thưởng thức các chương VIP mới nhất."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Xóa bộ lọc
              </button>
            ) : (
              <Link
                href="/truyen"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
              >
                <span>Khám phá truyện ngay</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ChapterPurchaseHistoryCard key={item._id} item={item} />
          ))}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between text-xs select-none">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                ← Trang trước
              </button>

              <span className="font-semibold text-zinc-500">
                Trang <strong className="text-zinc-900">{page}</strong> / {totalPages} (Tổng {total} chương)
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                Trang sau →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChapterPurchaseHistoryView;

