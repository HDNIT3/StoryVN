"use client";

import React from "react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export function TagPagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-3 text-xs text-slate-500">
      <div>
        Trang <span className="font-semibold text-slate-800">{page}</span> /{" "}
        <span className="font-semibold text-slate-800">{totalPages}</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2.5 sm:px-3 py-1.5 font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          ← Trước
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((p, idx, arr) => {
            const prev = arr[idx - 1];
            const isCurrent = p === page;
            return (
              <React.Fragment key={p}>
                {prev && p - prev > 1 && (
                  <span className="px-1 text-slate-400">...</span>
                )}
                <button
                  onClick={() => onPageChange(p)}
                  className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg font-semibold text-xs sm:text-sm transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-sky-500 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 sm:px-3 py-1.5 font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
