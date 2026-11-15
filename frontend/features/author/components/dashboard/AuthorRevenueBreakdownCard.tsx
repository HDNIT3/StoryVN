"use client";

import React from "react";
import type { AuthorStoryRevenueBreakdown } from "../../types";

interface AuthorRevenueBreakdownCardProps {
  breakdown: AuthorStoryRevenueBreakdown[];
  selectedStoryId?: string;
  onSelectStory: (storyId: string | undefined) => void;
  totalCoins: number;
}

export function AuthorRevenueBreakdownCard({
  breakdown,
  selectedStoryId,
  onSelectStory,
  totalCoins,
}: AuthorRevenueBreakdownCardProps) {
  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center shadow-2xs">
        <div className="w-12 h-12 mx-auto rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm sm:text-base font-bold text-zinc-900">Chưa có dữ liệu phân bổ</h3>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
          Khi độc giả mở khóa các chương VIP trong tác phẩm của bạn, thống kê phân bổ doanh thu theo từng truyện sẽ hiển thị tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs overflow-hidden">
      <div className="p-3.5 sm:p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
            <span>Xu đến từ đâu?</span>
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
              {breakdown.length} tác phẩm
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tỷ lệ phân bổ nguồn thu từ các tác phẩm có độc giả mở khóa chương.
          </p>
        </div>
        {selectedStoryId && (
          <button
            type="button"
            onClick={() => onSelectStory(undefined)}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 self-start sm:self-auto cursor-pointer"
          >
            ✕ Bỏ lọc tác phẩm
          </button>
        )}
      </div>

      <div className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {breakdown.map((item) => {
          const isSelected = selectedStoryId === item.storyId;
          const pct = item.percentage || (totalCoins > 0 ? Math.round((item.totalCoins / totalCoins) * 100) : 0);

          return (
            <div
              key={item.storyId}
              onClick={() => onSelectStory(isSelected ? undefined : item.storyId)}
              className={`group flex flex-col justify-between p-3 rounded-md border transition cursor-pointer ${
                isSelected
                  ? "bg-sky-50/60 border-sky-300"
                  : "bg-white border-zinc-200 hover:border-sky-200 hover:bg-zinc-50/50"
              }`}
            >
              {/* Header card: Cover image & Story info */}
              <div className="flex items-start gap-3">
                <div className="w-11 aspect-[2/3] shrink-0 rounded overflow-hidden relative border border-zinc-200 bg-zinc-100 flex items-center justify-center">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-900 line-clamp-1 group-hover:text-sky-700 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                    <span>{item.chapterCount} chương</span>
                    <span>•</span>
                    <span className="font-medium text-zinc-600">
                      {item.unlockCount.toLocaleString("vi-VN")} lượt mua
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-sm font-bold text-amber-600 tracking-tight">
                      +{item.totalCoins.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase">xu</span>
                    <span className="text-[11px] font-medium text-zinc-400 ml-1">
                      ({pct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full space-y-1">
                <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                  <span>{isSelected ? "Đang lọc xem" : "Bấm để lọc lịch sử"}</span>
                  <span className="font-semibold text-zinc-600">{pct}% tổng thu</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
