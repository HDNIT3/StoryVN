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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4 shadow-2xs">
      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/90 text-slate-700"
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
          className="ml-auto p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
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
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-500 font-medium">Sắp xếp:</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "NEWEST" | "OLDEST")}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
          </select>
        </div>
      </div>
    </div>
  );
}

