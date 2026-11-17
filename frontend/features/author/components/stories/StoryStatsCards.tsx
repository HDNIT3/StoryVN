"use client";

import React from "react";
import type { MyStoryCounts } from "@/features/stories";

interface StoryStatsCardsProps {
  counts?: MyStoryCounts;
}

export function StoryStatsCards({ counts }: StoryStatsCardsProps) {
  const totalStories = counts?.all ?? 0;
  const publishedCount = counts?.published ?? 0;
  const pendingCount = counts?.pending ?? 0;
  const draftCount = counts?.draft ?? 0;
  const totalViews = counts?.selectedPeriodViews ?? 0;
  const totalChapters = counts?.totalChapters ?? 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString("vi-VN");
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Card 1 */}
      <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Tác phẩm tạo trong kỳ
        </span>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-zinc-900 tracking-tight">
            {totalStories}
          </span>
          <span className="text-xs text-zinc-500">truyện</span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Hiện có {totalChapters} chương của nhóm truyện này
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Đang xuất bản
        </span>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-emerald-600 tracking-tight">
            {publishedCount}
          </span>
          <span className="text-xs text-zinc-500">tác phẩm</span>
        </div>
        <div className="mt-1 text-xs text-zinc-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Sẵn sàng cho độc giả</span>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Chờ duyệt / Nháp
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-600 tracking-tight">
            {pendingCount}
          </span>
          <span className="text-xs text-zinc-400">chờ duyệt</span>
          <span className="text-zinc-300">/</span>
          <span className="text-lg font-bold text-zinc-600">
            {draftCount}
          </span>
          <span className="text-xs text-zinc-400">nháp</span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Cần hoàn thiện nội dung
        </div>
      </div>

      {/* Card 4 */}
      <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Lượt đọc trong kỳ
        </span>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-sky-600 tracking-tight">
            {formatNumber(totalViews)}
          </span>
          <span className="text-xs text-zinc-500">lượt</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>Lũy kế hiện tại: {formatNumber(counts?.totalViews ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}

