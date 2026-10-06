"use client";

import React from "react";
import { StoryStatus, StoryVisibility } from "@/types/story";

interface StoryFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: "ALL" | StoryStatus;
  onStatusFilterChange: (status: "ALL" | StoryStatus) => void;
  visibilityFilter: "ALL" | StoryVisibility;
  onVisibilityFilterChange: (vis: "ALL" | StoryVisibility) => void;
  sortBy: "updatedAt" | "createdAt" | "title" | "viewCount" | "chapterCount";
  onSortByChange: (sort: "updatedAt" | "createdAt" | "title" | "viewCount" | "chapterCount") => void;
  statusCounts: Record<string, number>;
  onOpenCreateModal: () => void;
}

export function StoryFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  visibilityFilter,
  onVisibilityFilterChange,
  sortBy,
  onSortByChange,
  statusCounts,
  onOpenCreateModal,
}: StoryFilterBarProps) {
  const statusTabs: { key: "ALL" | StoryStatus; label: string; count?: number }[] = [
    { key: "ALL", label: "Tất cả", count: statusCounts.ALL ?? 0 },
    { key: "PUBLISHED", label: "Đã xuất bản", count: statusCounts.PUBLISHED ?? 0 },
    { key: "PENDING_REVIEW", label: "Chờ duyệt", count: statusCounts.PENDING_REVIEW ?? 0 },
    { key: "DRAFT", label: "Bản nháp", count: statusCounts.DRAFT ?? 0 },
    { key: "REJECTED", label: "Bị từ chối", count: statusCounts.REJECTED ?? 0 },
  ];

  return (
    <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs mb-6 space-y-3.5">
      {/* Top row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên truyện..."
            className="w-full pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs w-4 h-4 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right dropdowns & Create Button */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={visibilityFilter}
            onChange={(e) =>
              onVisibilityFilterChange(e.target.value as "ALL" | StoryVisibility)
            }
            className="px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">Hiển thị: Tất cả</option>
            <option value="PUBLIC">Công khai</option>
            <option value="PRIVATE">Riêng tư</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              onSortByChange(
                e.target.value as "updatedAt" | "createdAt" | "title" | "viewCount" | "chapterCount"
              )
            }
            className="px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
          >
            <option value="updatedAt">Mới cập nhật</option>
            <option value="createdAt">Ngày tạo mới nhất</option>
            <option value="viewCount">Lượt đọc cao nhất</option>
            <option value="chapterCount">Nhiều chương nhất</option>
            <option value="title">Tên tác phẩm (A-Z)</option>
          </select>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm tác phẩm</span>
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-zinc-100">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusFilterChange(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
