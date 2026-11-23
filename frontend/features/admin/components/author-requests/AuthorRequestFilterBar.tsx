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
    <div className="admin-filter-bar bg-white p-4 rounded-2xl border border-gray-200 shadow-admin-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Ô tìm kiếm */}
      <div className="relative flex-1 max-w-md">
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
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo bút danh, email, tên người dùng..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-admin-brand-500/20 focus:border-admin-brand-500 transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tổng số & Nút làm mới */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="text-xs text-gray-500 font-medium">
          Tìm thấy <strong className="text-gray-800">{totalItems}</strong> yêu cầu
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          leftIcon={
            <svg
              className={`w-4 h-4 text-gray-500 ${isLoading ? "animate-spin" : ""}`}
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
