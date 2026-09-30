"use client";

import React from "react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export function AuthorRequestPagination({
  page,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-500">
      <div>
        Trang <span className="font-semibold text-slate-800">{page}</span> /{" "}
        <span className="font-semibold text-slate-800">{totalPages}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          ← Trang trước
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((p, idx, arr) => {
            const prev = arr[idx - 1];
            const isCurrent = p === page;
            return (
              <React.Fragment key={p}>
                {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                <button
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg font-semibold transition-colors ${
                    isCurrent
                      ? "bg-sky-500 text-white shadow-sm"
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
          className="px-3 py-1.5 font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Trang sau →
        </button>
      </div>
    </div>
  );
}
