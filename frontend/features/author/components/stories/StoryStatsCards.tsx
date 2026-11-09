"use client";

import React from "react";
import { StoryItem } from "@/features/stories";

interface StoryStatsCardsProps {
  stories: StoryItem[];
}

export function StoryStatsCards({ stories }: StoryStatsCardsProps) {
  const totalStories = stories.length;
  const publishedCount = stories.filter((s) => s.status === "PUBLISHED").length;
  const isPendingReview = (s: StoryItem) =>
    s.status === "PENDING_REVIEW" || s.pendingRevision?.status === "PENDING_REVIEW";
  const pendingCount = stories.filter(isPendingReview).length;
  const draftCount = stories.filter((s) => s.status === "DRAFT").length;

  const totalViews = stories.reduce((sum, s) => sum + (s.stats?.viewCount || 0), 0);
  const viewsToday = stories.reduce((sum, s) => sum + (s.stats?.viewsToday || 0), 0);
  const viewsWeek = stories.reduce((sum, s) => sum + (s.stats?.viewsWeek || 0), 0);
  const viewsMonth = stories.reduce((sum, s) => sum + (s.stats?.viewsMonth || 0), 0);
  const totalChapters = stories.reduce((sum, s) => sum + (s.stats?.chapterCount || 0), 0);

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
          Tổng tác phẩm
        </span>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-zinc-900 tracking-tight">
            {totalStories}
          </span>
          <span className="text-xs text-zinc-500">truyện</span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Tổng {totalChapters} chương đã tạo
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
          Tổng lượt đọc
        </span>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-sky-600 tracking-tight">
            {formatNumber(totalViews)}
          </span>
          <span className="text-xs text-zinc-500">lượt</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-emerald-600 font-semibold">
            Hôm nay: +{formatNumber(viewsToday)}
          </span>
          <span>•</span>
          <span>7 ngày: +{formatNumber(viewsWeek)}</span>
          <span>•</span>
          <span>30 ngày: +{formatNumber(viewsMonth)}</span>
        </div>
      </div>
    </div>
  );
}

