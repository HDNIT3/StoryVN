"use client";

import React from "react";
import type { RatingSummaryData } from "../types";

interface RatingSummaryWidgetProps {
  summary?: RatingSummaryData;
  selectedStar?: number;
  onSelectStar: (star?: number) => void;
}

export const RatingSummaryWidget: React.FC<RatingSummaryWidgetProps> = ({
  summary,
  selectedStar,
  onSelectStar,
}) => {
  const avg = summary?.ratingAverage ?? 0;
  const count = summary?.ratingCount ?? 0;
  const breakdown = summary?.breakdown ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div className="bg-zinc-50/80 rounded-2xl p-5 border border-zinc-200/70">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Điểm tổng quan */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-zinc-200/80 pb-5 md:pb-0 pr-0 md:pr-4">
          <div className="text-4xl sm:text-5xl font-black text-amber-500 tracking-tight">
            {avg > 0 ? avg.toFixed(1) : "0.0"}
          </div>
          <div className="flex items-center gap-1 mt-2 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${
                  star <= Math.round(avg) ? "text-amber-400" : "text-zinc-200"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-1.5 font-medium">
            {count > 0
              ? `${count.toLocaleString("vi-VN")} lượt đánh giá`
              : "Chưa có đánh giá nào"}
          </p>
        </div>

        {/* Breakdown từng sao */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const starCount = breakdown[star] || 0;
            const percentage = count > 0 ? Math.round((starCount / count) * 100) : 0;
            const isSelected = selectedStar === star;

            return (
              <button
                key={star}
                type="button"
                onClick={() => onSelectStar(isSelected ? undefined : star)}
                className={`w-full flex items-center gap-3 text-xs group cursor-pointer transition-colors p-1 rounded-lg ${
                  isSelected ? "bg-amber-50" : "hover:bg-zinc-100/60"
                }`}
              >
                <span className="w-10 text-left font-bold text-zinc-700 flex items-center gap-0.5">
                  {star} <span className="text-amber-400">★</span>
                </span>
                <div className="flex-1 h-2 rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right text-zinc-500 font-medium">
                  {starCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="mt-5 pt-4 border-t border-zinc-200/70 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-zinc-500 mr-1">Lọc:</span>
        <button
          type="button"
          onClick={() => onSelectStar(undefined)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            selectedStar === undefined
              ? "bg-emerald-700 text-white"
              : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
          }`}
        >
          Tất cả ({count})
        </button>
        {[5, 4, 3, 2, 1].map((star) => {
          const starCount = breakdown[star] || 0;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onSelectStar(selectedStar === star ? undefined : star)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedStar === star
                  ? "bg-amber-500 text-white"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {star} ★ ({starCount})
            </button>
          );
        })}
      </div>
    </div>
  );
};

