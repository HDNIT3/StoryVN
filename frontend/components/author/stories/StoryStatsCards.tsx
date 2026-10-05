"use client";

import React from "react";
import { StoryItem } from "@/types/story";

interface StoryStatsCardsProps {
  stories: StoryItem[];
}

export function StoryStatsCards({ stories }: StoryStatsCardsProps) {
  const totalStories = stories.length;
  const publishedCount = stories.filter((s) => s.status === "PUBLISHED").length;
  const pendingCount = stories.filter((s) => s.status === "PENDING_REVIEW").length;
  const draftCount = stories.filter((s) => s.status === "DRAFT").length;

  const totalViews = stories.reduce((sum, s) => sum + (s.stats.viewCount || 0), 0);
  const totalFollowers = stories.reduce((sum, s) => sum + (s.stats.followCount || 0), 0);
  const totalChapters = stories.reduce((sum, s) => sum + (s.stats.chapterCount || 0), 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString("vi-VN");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Tổng truyện */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-zinc-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Tổng tác phẩm
          </span>
          <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            {totalStories}
          </span>
          <span className="text-xs text-zinc-500">truyện</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
          <span>Tổng số chương:</span>
          <strong className="text-zinc-800 font-semibold">{totalChapters} chương</strong>
        </div>
      </div>

      {/* Card 2: Đã xuất bản */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-zinc-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Đã phát hành
          </span>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-emerald-600 tracking-tight">
            {publishedCount}
          </span>
          <span className="text-xs text-zinc-500">đang online</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sẵn sàng cho độc giả</span>
        </div>
      </div>

      {/* Card 3: Chờ duyệt & Bản nháp */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-zinc-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Đang xử lý
          </span>
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <div>
            <span className="text-xl sm:text-2xl font-bold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-zinc-400 ml-1">chờ duyệt</span>
          </div>
          <span className="text-zinc-300">/</span>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-zinc-600">{draftCount}</span>
            <span className="text-xs text-zinc-400 ml-1">nháp</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-zinc-500">Cần tiếp tục hoàn thiện nội dung</div>
      </div>

      {/* Card 4: Tổng tương tác */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-zinc-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Tổng tương tác
          </span>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-indigo-600 tracking-tight">
            {formatNumber(totalViews)}
          </span>
          <span className="text-xs text-zinc-500">lượt đọc</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
          <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>{formatNumber(totalFollowers)} người theo dõi</span>
        </div>
      </div>
    </div>
  );
}
