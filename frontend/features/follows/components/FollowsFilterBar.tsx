"use client";

import React from "react";
import type { FollowStorySortOption, FollowTargetType } from "../types";

interface FollowsFilterBarProps {
  activeTab: FollowTargetType;
  onTabChange: (tab: FollowTargetType) => void;
  storyTotalItems: number;
  authorTotalItems: number;
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
  searchInput,
  onSearchChange,
  sortBy,
  onSortByChange,
  onResetFilters,
}: FollowsFilterBarProps) {
  const isFiltering = Boolean(searchInput.trim());

  return (
    <div className="space-y-4">
      {/* ─── TIÊU ĐỀ TRANG LIỀN TRONG PAGE ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Tủ truyện
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Bộ sưu tập tác phẩm và tác giả bạn đang theo dõi trên StoryVN.
          </p>
        </div>
      </div>

      {/* ─── THANH TABS & BỘ LỌC LIỀN MẠCH (KHÔNG CONTAINER NỀN) ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 pb-2">
        {/* TABS LIỀN KHÔNG CÓ KHỐI NỀN */}
        <div className="flex items-center gap-6 sm:gap-8 -mb-[9px]">
          {/* TAB 1: TỦ TRUYỆN (ƯU TIÊN) */}
          <button
            type="button"
            onClick={() => onTabChange("STORY")}
            className={`group inline-flex items-center gap-2 pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "STORY"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
            }`}
          >
            {/* Standard Book Icon */}
            <svg
              className={`w-4 h-4 transition-colors ${
                activeTab === "STORY"
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
              className={`text-xs font-semibold tabular-nums transition-colors ${
                activeTab === "STORY"
                  ? "text-emerald-700 font-bold"
                  : "text-zinc-400 group-hover:text-zinc-600"
              }`}
            >
              ({storyTotalItems})
            </span>
          </button>

          {/* TAB 2: TÁC GIẢ THEO DÕI */}
          <button
            type="button"
            onClick={() => onTabChange("AUTHOR")}
            className={`group inline-flex items-center gap-2 pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "AUTHOR"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
            }`}
          >
            {/* Standard Users Icon */}
            <svg
              className={`w-4 h-4 transition-colors ${
                activeTab === "AUTHOR"
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
              className={`text-xs font-semibold tabular-nums transition-colors ${
                activeTab === "AUTHOR"
                  ? "text-emerald-700 font-bold"
                  : "text-zinc-400 group-hover:text-zinc-600"
              }`}
            >
              ({authorTotalItems})
            </span>
          </button>
        </div>

        {/* CỘT PHẢI: TÌM KIẾM & BỘ LỌC LIỀN MẠCH KHÔNG BOX NỀN DÀY */}
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
              placeholder={
                activeTab === "STORY"
                  ? "Tìm kiếm trong tủ truyện..."
                  : "Tìm tác giả đã theo dõi..."
              }
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

          {/* Sắp xếp (Tab Truyện) */}
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
                <option value="updated">Mới cập nhật</option>
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
    </div>
  );
}
