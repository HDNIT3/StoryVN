"use client";

import React, { useEffect, useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface StoryOption {
  _id: string;
  title: string;
}

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  selectedStoryId: string;
  onStoryChange: (storyId: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderToggle: () => void;
  storyOptions?: StoryOption[];
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function ChapterFilterBar({
  search,
  onSearchChange,
  selectedStoryId,
  onStoryChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
  storyOptions = [],
  onRefresh,
  isRefreshing = false,
}: Props) {
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 400);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-2xs p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Tìm kiếm */}
      <div className="relative flex-1 min-w-[240px]">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Tìm tiêu đề chương, số chương hoặc tên tác phẩm..."
          className="w-full pl-9 pr-9 py-2 text-xs md:text-sm bg-slate-50/70 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch("");
              onSearchChange("");
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Lọc & Sắp xếp */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Lọc theo Tác phẩm */}
        {storyOptions.length > 0 && (
          <div className="relative">
            <select
              value={selectedStoryId}
              onChange={(e) => onStoryChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50/70 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 cursor-pointer max-w-[200px] truncate"
            >
              <option value="">Tất cả tác phẩm</option>
              {storyOptions.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.title}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Tiêu chí sắp xếp */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-slate-50/70 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 cursor-pointer"
          >
            <option value="createdAt">Ngày tạo</option>
            <option value="updatedAt">Ngày cập nhật</option>
            <option value="chapterNumber">Số thứ tự chương</option>
            <option value="title">Tên chương</option>
            <option value="viewCount">Lượt xem</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Nút Đổi Chiều Sắp xếp */}
        <button
          type="button"
          onClick={onSortOrderToggle}
          className="p-2 text-slate-600 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          title={sortOrder === "asc" ? "Tăng dần (Click để giảm dần)" : "Giảm dần (Click để tăng dần)"}
        >
          {sortOrder === "asc" ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
          )}
        </button>

        {/* Nút Làm mới */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-600 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          title="Làm mới danh sách"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
