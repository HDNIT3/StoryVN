"use client";

import React from "react";
import { useCategories } from "@/lib/hooks/queries/useCategoryQuery";

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  selectedGenreId: string;
  onGenreChange: (genreId: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function StoryFilterBar({
  search,
  onSearchChange,
  selectedGenreId,
  onGenreChange,
  sortBy,
  onSortChange,
  onRefresh,
  isRefreshing,
}: Props) {
  // Lấy toàn bộ thể loại để chọn lọc
  const { data: categoriesData } = useCategories({ all: true });
  const categories = categoriesData?.items ?? [];

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Ô tìm kiếm */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên truyện, slug, bút danh hoặc email tác giả..."
          className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all text-slate-800 placeholder-slate-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Lọc theo Thể loại & Sắp xếp & Làm mới */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Dropdown Thể loại */}
        <select
          value={selectedGenreId}
          onChange={(e) => onGenreChange(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white text-slate-700 cursor-pointer font-medium"
        >
          <option value="">Tất cả thể loại</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Dropdown Sắp xếp */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white text-slate-700 cursor-pointer font-medium"
        >
          <option value="createdAt">Mới tạo nhất</option>
          <option value="updatedAt">Cập nhật mới nhất</option>
          <option value="title">Tên truyện (A-Z)</option>
          <option value="viewCount">Lượt xem cao nhất</option>
          <option value="chapterCount">Nhiều chương nhất</option>
        </select>

        {/* Nút Làm mới */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          title="Tải lại dữ liệu"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-sky-600" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
