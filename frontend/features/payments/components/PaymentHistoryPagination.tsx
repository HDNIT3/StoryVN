"use client";

import React from "react";

interface PaymentHistoryPaginationBarProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
}

export function PaymentHistoryPaginationBar({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: PaymentHistoryPaginationBarProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-zinc-200/80 pt-4">
      <span className="text-xs text-zinc-500 tabular-nums sm:text-sm">
        Trang <strong className="font-semibold text-zinc-800">{page}</strong> / {totalPages} ({totalItems} giao dịch)
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Trước
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
