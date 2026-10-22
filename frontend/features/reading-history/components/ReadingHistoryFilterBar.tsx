"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { CategoryItem } from "@/features/categories";
import {
  ReadingHistorySortOption,
  ReadingStatusFilter,
} from "../types";

const STATUS_TABS: { value: ReadingStatusFilter | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "reading", label: "Đang đọc" },
  { value: "completed", label: "Đã đọc hết" },
];

const SORT_OPTIONS: { value: ReadingHistorySortOption; label: string }[] = [
  { value: "lastReadAt", label: "Mới đọc gần nhất" },
  { value: "progress", label: "Tiến độ cao nhất" },
  { value: "title", label: "Tên truyện A - Z" },
];

const MIN_CHAPTER_OPTIONS = [
  { value: "", label: "Mọi số chương" },
  { value: "10", label: "Từ 10 chương trở lên" },
  { value: "50", label: "Từ 50 chương trở lên" },
  { value: "100", label: "Từ 100 chương trở lên" },
  { value: "200", label: "Từ 200 chương trở lên" },
];

const SELECT_CLASS =
  "px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs sm:text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 cursor-pointer transition";

const DATE_LABEL_CLASS =
  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600";

interface ReadingHistoryFilterBarProps {
  totalItems: number;
  searchInput: string;
  debouncedSearch: string;
  genre: string;
  status: ReadingStatusFilter | "";
  sortBy: ReadingHistorySortOption;
  minChapterNumber: string;
  fromDate: string;
  toDate: string;
  genres: CategoryItem[];
  isFiltering: boolean;
  onSearchChange: (val: string) => void;
  onGenreChange: (val: string) => void;
  onStatusChange: (val: ReadingStatusFilter | "") => void;
  onSortByChange: (val: ReadingHistorySortOption) => void;
  onMinChapterNumberChange: (val: string) => void;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  onResetFilters: () => void;
}

export function ReadingHistoryFilterBar({
  totalItems,
  searchInput,
  debouncedSearch,
  genre,
  status,
  sortBy,
  minChapterNumber,
  fromDate,
  toDate,
  genres,
  isFiltering,
  onSearchChange,
  onGenreChange,
  onStatusChange,
  onSortByChange,
  onMinChapterNumberChange,
  onFromDateChange,
  onToDateChange,
  onResetFilters,
}: ReadingHistoryFilterBarProps) {
  const currentGenreName = useMemo(() => {
    if (!genre || !genres) return "";
    const found = genres.find((g) => g.slug === genre || g._id === genre);
    return found?.name || genre;
  }, [genre, genres]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
              Lịch sử đọc
            </h1>
            {totalItems > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 tabular-nums">
                {totalItems} truyện
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-[65ch]">
            {totalItems > 0
              ? `${totalItems} bộ truyện bạn đã mở, hiển thị truyện mới đọc gần nhất trước.`
              : "Những bộ truyện bạn đã mở sẽ được lưu lại tại đây."}
          </p>
        </div>

        <Link
          href="/truyen"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs sm:text-sm font-semibold transition-colors shadow-2xs self-start sm:self-auto shrink-0"
        >
          <span>Khám phá truyện</span>
          <span>→</span>
        </Link>
      </div>

      {/* Thanh tìm kiếm & bộ lọc */}
      <div className="pt-4 border-t border-zinc-100 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo tên truyện..."
              aria-label="Tìm theo tên truyện"
              className="w-full pl-9 pr-9 py-2.5 bg-zinc-50 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {searchInput && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Xoá từ khoá tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Trạng thái & Sắp xếp */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5">
              {STATUS_TABS.map((tab) => {
                const isActive = status === tab.value;
                return (
                  <button
                    key={tab.value || "all"}
                    type="button"
                    onClick={() => onStatusChange(tab.value)}
                    aria-pressed={isActive}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "bg-sky-500 text-white shadow-2xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as ReadingHistorySortOption)}
              aria-label="Sắp xếp lịch sử đọc"
              className={`${SELECT_CLASS} ml-auto sm:ml-0`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bộ lọc chi tiết */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-zinc-100">
          <select
            value={genre}
            onChange={(e) => onGenreChange(e.target.value)}
            aria-label="Lọc theo thể loại"
            className={SELECT_CLASS}
          >
            <option value="">Tất cả thể loại</option>
            {genres?.map((item) => (
              <option key={item._id} value={item.slug || item._id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={minChapterNumber}
            onChange={(e) => onMinChapterNumberChange(e.target.value)}
            aria-label="Lọc theo số chương đã đọc"
            className={SELECT_CLASS}
          >
            {MIN_CHAPTER_OPTIONS.map((opt) => (
              <option key={opt.value || "any"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className={DATE_LABEL_CLASS}>
            <span className="text-zinc-400 shrink-0">Từ ngày</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 font-semibold focus:outline-none cursor-pointer"
            />
          </label>

          <label className={DATE_LABEL_CLASS}>
            <span className="text-zinc-400 shrink-0">Đến ngày</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 font-semibold focus:outline-none cursor-pointer"
            />
          </label>

          {isFiltering && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Xoá bộ lọc
            </button>
          )}
        </div>

        {/* Active filter tags */}
        {isFiltering && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-zinc-400 font-medium">Đang lọc:</span>

            {debouncedSearch.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                Từ khoá: &quot;{debouncedSearch.trim()}&quot;
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label="Xoá lọc theo từ khoá"
                >
                  ✕
                </button>
              </span>
            )}

            {currentGenreName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                Thể loại: {currentGenreName}
                <button
                  type="button"
                  onClick={() => onGenreChange("")}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label="Xoá lọc theo thể loại"
                >
                  ✕
                </button>
              </span>
            )}

            {status && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                {status === "reading" ? "Đang đọc" : "Đã đọc hết"}
                <button
                  type="button"
                  onClick={() => onStatusChange("")}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label="Xoá lọc theo trạng thái"
                >
                  ✕
                </button>
              </span>
            )}

            {minChapterNumber && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                Từ {minChapterNumber} chương
                <button
                  type="button"
                  onClick={() => onMinChapterNumberChange("")}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label="Xoá lọc theo số chương"
                >
                  ✕
                </button>
              </span>
            )}

            {(fromDate || toDate) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                {fromDate || "..."} → {toDate || "..."}
                <button
                  type="button"
                  onClick={() => {
                    onFromDateChange("");
                    onToDateChange("");
                  }}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label="Xoá lọc theo thời gian"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
