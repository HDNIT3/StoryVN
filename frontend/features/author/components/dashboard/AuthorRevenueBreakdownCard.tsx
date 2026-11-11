"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center shadow-2xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-slate-800">Chưa có dữ liệu phân bổ</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Khi độc giả mở khóa các chương VIP trong tác phẩm của bạn, thống kê phân bổ doanh thu theo từng truyện sẽ hiển thị tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Xu đến từ đâu?</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70">
              {breakdown.length} tác phẩm
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tỷ lệ phân bổ nguồn thu từ các tác phẩm có độc giả mở khóa chương.
          </p>
        </div>
        {selectedStoryId && (
          <button
            type="button"
            onClick={() => onSelectStory(undefined)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>✕ Bỏ lọc tác phẩm</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {breakdown.map((item) => {
          const isSelected = selectedStoryId === item.storyId;
          const pct = item.percentage || (totalCoins > 0 ? Math.round((item.totalCoins / totalCoins) * 100) : 0);

          return (
            <div
              key={item.storyId}
              onClick={() => onSelectStory(isSelected ? undefined : item.storyId)}
              className={`group flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-200/60 shadow-xs"
                  : "bg-slate-50/50 hover:bg-white border-slate-200/80 hover:border-amber-200 hover:shadow-xs"
              }`}
            >
              {/* Header card: Cover image & Story info */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-16 rounded-lg bg-slate-200 overflow-hidden relative shrink-0 border border-slate-200 shadow-2xs">
                  {item.coverImage ? (
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-amber-400 to-amber-600 text-white font-bold text-xs p-1 text-center">
                      📖
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span>{item.chapterCount} chương</span>
                    <span>•</span>
                    <span className="font-medium text-slate-600">
                      {item.unlockCount.toLocaleString("vi-VN")} lượt mua
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-amber-600 tracking-tight">
                      +{item.totalCoins.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 uppercase">Xu</span>
                    <span className="text-[11px] font-semibold text-slate-400 ml-1.5">
                      ({pct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full space-y-1">
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-amber-400 to-orange-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>{isSelected ? "Đang lọc xem" : "Bấm để lọc lịch sử"}</span>
                  <span className="font-semibold text-amber-600">{pct}% tổng thu</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

