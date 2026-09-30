"use client";

import React from "react";
import { Button } from "@/components/ui";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  totalItems: number;
  onRefresh: () => void;
}

export function AuthorRequestFilterBar({
  search,
  onSearchChange,
  isLoading,
  totalItems,
  onRefresh,
}: Props) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Ô tìm kiếm */}
      <div className="relative flex-1 max-w-md">
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
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo bút danh, email, tên người dùng..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tổng số & Nút làm mới */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="text-xs text-slate-500 font-medium">
          Tìm thấy <strong className="text-slate-800">{totalItems}</strong> yêu cầu
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
          leftIcon={
            <svg
              className={`w-4 h-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`}
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
          }
        >
          Làm mới
        </Button>
      </div>
    </div>
  );
}
