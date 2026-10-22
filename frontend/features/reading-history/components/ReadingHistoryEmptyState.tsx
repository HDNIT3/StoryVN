"use client";

import React from "react";
import Link from "next/link";

interface ReadingHistoryEmptyStateProps {
  isFiltering: boolean;
  onResetFilters: () => void;
}

export function ReadingHistoryEmptyState({
  isFiltering,
  onResetFilters,
}: ReadingHistoryEmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-10 sm:p-14 text-center flex flex-col items-center shadow-2xs">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-4">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900">
        {isFiltering ? "Không có truyện nào khớp bộ lọc" : "Chưa có lịch sử đọc"}
      </h3>
      <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm">
        {isFiltering
          ? "Thử đổi từ khoá, thể loại hoặc khoảng thời gian để xem kết quả khác."
          : "Mở một chương truyện bất kỳ, lịch sử đọc của bạn sẽ được lưu lại tại đây."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
        {isFiltering && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Xoá bộ lọc
          </button>
        )}
        <Link
          href="/truyen"
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition-colors shadow-2xs"
        >
          Khám phá truyện
        </Link>
      </div>
    </div>
  );
}
