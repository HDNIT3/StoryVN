"use client";

import React from "react";
import type { AdminCommentCounts } from "../../types/comment.types";

export type CommentFilterTab = "ALL" | "VISIBLE" | "HIDDEN" | "DELETED";

interface CommentFilterBarProps {
  currentTab: CommentFilterTab;
  onTabChange: (tab: CommentFilterTab) => void;
  counts?: AdminCommentCounts;
  search: string;
  onSearchChange: (search: string) => void;
  sort: "NEWEST" | "OLDEST";
  onSortChange: (sort: "NEWEST" | "OLDEST") => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function CommentFilterBar({
  currentTab,
  onTabChange,
  counts,
  search,
  onSearchChange,
  sort,
  onSortChange,
  onRefresh,
  isRefreshing,
}: CommentFilterBarProps) {
  const tabs: { key: CommentFilterTab; label: string; count?: number }[] = [
    { key: "ALL", label: "Tất cả", count: counts?.total },
    { key: "VISIBLE", label: "Đang hiển thị", count: counts?.visible },
    { key: "HIDDEN", label: "Đang bị ẩn", count: counts?.hidden },
    { key: "DELETED", label: "Đã xóa", count: counts?.deleted },
  ];

  return (
    <div className="admin-filter-bar bg-white rounded-2xl border border-gray-200 p-4 space-y-4 shadow-admin-card">
      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-admin-brand-600 text-white shadow-admin-card"
                  : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-200/90 text-gray-700"
                  }`}
                >
                  {tab.count > 999 ? "999+" : tab.count}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-auto p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          title="Làm mới dữ liệu"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
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

      {/* Filter controls: Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
            placeholder="Tìm theo nội dung, người dùng..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-admin-brand-500/20 focus:border-admin-brand-500 transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-gray-500 font-medium">Sắp xếp:</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "NEWEST" | "OLDEST")}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-semibold text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-admin-brand-500/20 focus:border-admin-brand-500 cursor-pointer"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
          </select>
        </div>
      </div>
    </div>
  );
}

