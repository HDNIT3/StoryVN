"use client";

import React from "react";

interface ReadingHistoryPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
}

export function ReadingHistoryPaginationBar({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: ReadingHistoryPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-200/80">
      <span className="text-xs sm:text-sm text-zinc-500 tabular-nums">
        Trang <strong className="font-semibold text-zinc-800">{page}</strong> / {totalPages} ({totalItems} truyện)
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-700 transition-colors cursor-pointer shadow-2xs"
        >
          ← Trước
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-700 transition-colors cursor-pointer shadow-2xs"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
