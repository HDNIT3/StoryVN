"use client";

import React from "react";
import type { FollowBookshelfTab, FollowStorySortOption } from "../types";

interface FollowsFilterBarProps {
  activeTab: FollowBookshelfTab;
  onTabChange: (tab: FollowBookshelfTab) => void;
  storyTotalItems: number;
  authorTotalItems: number;
  updatesUnreadChapters: number;
  updatesUnreadStories: number;
  onlyUnread: boolean;
  onOnlyUnreadChange: (value: boolean) => void;
  onMarkAllUpdatesRead: () => void;
  isMarkingAllRead: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  sortBy: FollowStorySortOption;
  onSortByChange: (sort: FollowStorySortOption) => void;
  onResetFilters: () => void;
}

export function FollowsFilterBar({
  activeTab,
  onTabChange,
  storyTotalItems,
  authorTotalItems,
  updatesUnreadChapters,
  updatesUnreadStories,
  onlyUnread,
  onOnlyUnreadChange,
  onMarkAllUpdatesRead,
  isMarkingAllRead,
  searchInput,
  onSearchChange,
  sortBy,
  onSortByChange,
  onResetFilters,
}: FollowsFilterBarProps) {
  const isFiltering = Boolean(searchInput.trim());

  const searchPlaceholder =
    activeTab === "STORY"
      ? "Tìm kiếm trong tủ truyện..."
      : activeTab === "UPDATES"
        ? "Tìm truyện có chương mới..."
        : "Tìm tác giả đã theo dõi...";

  return (
    <div className="space-y-4">
      {/* ─── TIÊU ĐỀ TRANG LIỀN TRONG PAGE ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Tủ truyện
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Bộ sưu tập tác phẩm, chương mới cập nhật và tác giả bạn đang theo dõi trên StoryVN.
          </p>
        </div>
      </div>

      {/* ─── THANH TABS & BỘ LỌC LIỀN MẠCH (KHÔNG CONTAINER NỀN) ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 pb-2">
        {/* TABS LIỀN KHÔNG CÓ KHỐI NỀN */}
        <div className="flex items-center gap-5 sm:gap-7 -mb-[9px] overflow-x-auto">
          {/* TAB 1: TỦ TRUYỆN */}
          <button
            type="button"
            onClick={() => onTabChange("STORY")}
            className={`group shrink-0 inline-flex items-center gap-2 pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === "STORY"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
              }`}
          >
            <svg
              className={`w-4 h-4 transition-colors ${activeTab === "STORY"
                  ? "text-emerald-700"
                  : "text-zinc-400 group-hover:text-zinc-600"
                }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Tủ truyện</span>
            <span
              className={`text-xs font-semibold tabular-nums transition-colors ${activeTab === "STORY"
                  ? "text-emerald-700 font-bold"
                  : "text-zinc-400 group-hover:text-zinc-600"
                }`}
            >
              ({storyTotalItems})
            </span>
          </button>

          {/* TAB 2: CHƯƠNG MỚI */}
          <button
            type="button"
            onClick={() => onTabChange("UPDATES")}
            className={`group shrink-0 inline-flex items-center gap-2 pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === "UPDATES"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
              }`}
          >
            <svg
              className={`w-4 h-4 transition-colors ${activeTab === "UPDATES"
                  ? "text-emerald-700"
                  : "text-zinc-400 group-hover:text-zinc-600"
                }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Chương mới</span>
            {updatesUnreadChapters > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold leading-none tabular-nums">
                {updatesUnreadChapters > 99 ? "99+" : updatesUnreadChapters}
              </span>
            )}
          </button>

          {/* TAB 3: TÁC GIẢ THEO DÕI */}
          <button
            type="button"
            onClick={() => onTabChange("AUTHOR")}
            className={`group shrink-0 inline-flex items-center gap-2 pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === "AUTHOR"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
              }`}
          >
            <svg
              className={`w-4 h-4 transition-colors ${activeTab === "AUTHOR"
                  ? "text-emerald-700"
                  : "text-zinc-400 group-hover:text-zinc-600"
                }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Tác giả theo dõi</span>
            <span
              className={`text-xs font-semibold tabular-nums transition-colors ${activeTab === "AUTHOR"
                  ? "text-emerald-700 font-bold"
                  : "text-zinc-400 group-hover:text-zinc-600"
                }`}
            >
              ({authorTotalItems})
            </span>
          </button>
        </div>

        {/* CỘT PHẢI: TÌM KIẾM & BỘ LỌC */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 sm:w-64 lg:w-72">
            <svg
              className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-transparent border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 rounded-xl transition-all text-zinc-800 placeholder:text-zinc-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Sắp xếp (Tab Tủ truyện) */}
          {activeTab === "STORY" && (
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) =>
                  onSortByChange(e.target.value as FollowStorySortOption)
                }
                className="appearance-none pl-3 pr-8 py-1.5 bg-transparent border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 rounded-xl text-xs sm:text-sm font-medium text-zinc-700 cursor-pointer transition-all"
              >
                <option value="followedAt">Mới theo dõi nhất</option>
                <option value="updatedAt">Mới cập nhật</option>
                <option value="title">Tên truyện A - Z</option>
              </select>
              <svg
                className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}

          {/* Nút Xóa lọc nếu đang tìm kiếm */}
          {isFiltering && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* ─── THANH HÀNH ĐỘNG RIÊNG CHO TAB CHƯƠNG MỚI ───────────────── */}
      {activeTab === "UPDATES" && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100/80 border border-zinc-200/70">
            <button
              type="button"
              onClick={() => onOnlyUnreadChange(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!onlyUnread
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-800"
                }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => onOnlyUnreadChange(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${onlyUnread
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-800"
                }`}
            >
              <span>Chưa đọc</span>
              {updatesUnreadStories > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold leading-none tabular-nums">
                  {updatesUnreadStories}
                </span>
              )}
            </button>
          </div>

          {updatesUnreadStories > 0 && (
            <button
              type="button"
              onClick={onMarkAllUpdatesRead}
              disabled={isMarkingAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                {isMarkingAllRead
                  ? "Đang xử lý..."
                  : "Đánh dấu tất cả đã xem"}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
