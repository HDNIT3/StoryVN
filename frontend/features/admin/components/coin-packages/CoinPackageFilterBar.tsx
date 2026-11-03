"use client";

import React from "react";

interface Props {
  search: string;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  featuredFilter: "ALL" | "FEATURED" | "NORMAL";
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (status: "ALL" | "ACTIVE" | "INACTIVE") => void;
  onFeaturedFilterChange: (featured: "ALL" | "FEATURED" | "NORMAL") => void;
  onReset: () => void;
}

export function CoinPackageFilterBar({
  search,
  statusFilter,
  featuredFilter,
  onSearchChange,
  onStatusFilterChange,
  onFeaturedFilterChange,
  onReset,
}: Props) {
  const isFiltered =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    featuredFilter !== "ALL";

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      {/* Ô tìm kiếm */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên gói nạp..."
          className="w-full pl-9.5 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 placeholder-slate-400"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nhóm bộ lọc */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Lọc Trạng thái */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-medium text-slate-600">
          <button
            onClick={() => onStatusFilterChange("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === "ALL"
                ? "bg-white text-slate-900 font-bold shadow-2xs"
                : "hover:text-slate-900"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => onStatusFilterChange("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              statusFilter === "ACTIVE"
                ? "bg-white text-emerald-700 font-bold shadow-2xs"
                : "hover:text-emerald-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Hoạt động
          </button>
          <button
            onClick={() => onStatusFilterChange("INACTIVE")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              statusFilter === "INACTIVE"
                ? "bg-white text-slate-700 font-bold shadow-2xs"
                : "hover:text-slate-900"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Đang ẩn
          </button>
        </div>

        {/* Lọc Gói nổi bật */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-medium text-slate-600">
          <button
            onClick={() => onFeaturedFilterChange("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              featuredFilter === "ALL"
                ? "bg-white text-slate-900 font-bold shadow-2xs"
                : "hover:text-slate-900"
            }`}
          >
            Tất cả loại
          </button>
          <button
            onClick={() => onFeaturedFilterChange("FEATURED")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              featuredFilter === "FEATURED"
                ? "bg-white text-amber-700 font-bold shadow-2xs"
                : "hover:text-amber-600"
            }`}
          >
            ⭐ Nổi bật
          </button>
        </div>

        {/* Nút reset */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Xóa bộ lọc"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Đặt lại</span>
          </button>
        )}
      </div>
    </div>
  );
}
