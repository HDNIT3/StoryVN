"use client";

import React from "react";
import Link from "next/link";
import { StoryItem } from "@/types/story";

interface MyStoriesPreviewProps {
  stories: StoryItem[];
  onManageChapters?: (story: StoryItem) => void;
  onEdit?: (story: StoryItem) => void;
}

const formatNumber = (num?: number) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("vi-VN");
};

const getTimeAgo = (dateStr?: string) => {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 60) return `${mins} phút trước`;
  if (hrs < 24) return `${hrs} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  return `${Math.floor(days / 30)} tháng trước`;
};

const progressCfg: Record<string, { label: string; cls: string }> = {
  ONGOING: { label: "Đang ra", cls: "bg-green-500/90 text-white" },
  COMPLETED: { label: "Hoàn thành", cls: "bg-blue-500/90 text-white" },
  ON_HOLD: { label: "Tạm dừng", cls: "bg-zinc-400/90 text-white" },
};

export function MyStoriesPreview({ stories, onManageChapters, onEdit }: MyStoriesPreviewProps) {
  const displayStories = stories.slice(0, 3);

  return (
    <div className="mb-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-zinc-900">Tác phẩm của tôi</h2>
        <Link href="/tac-gia/tac-pham" className="text-[13px] font-semibold text-amber-500 hover:text-amber-600 transition">
          Xem tất cả →
        </Link>
      </div>

      {/* Grid */}
      {displayStories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800">Chưa có tác phẩm nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
            Bắt đầu xuất bản câu chuyện đầu tiên để tiếp cận hàng nghìn độc giả trên StoryVN.
          </p>
          <Link
            href="/tac-gia/tac-pham/them-moi"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition shadow-xs"
          >
            + Viết tác phẩm đầu tiên
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayStories.map((story) => {
            const genreNames = (story.genreIds || [])
              .map((g: any) => (typeof g === "object" && g !== null ? g.name : g))
              .filter(Boolean);
            const genres = genreNames.length > 0 ? genreNames : story.genres || [];
            const prog = story.progressState ? progressCfg[story.progressState] : null;

            return (
              <div key={story._id || story.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all">
                {/* Cover */}
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-zinc-100">
                  {story.coverUrl ? (
                    <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-[#1e3a5f] to-[#2d5a8e] flex flex-col items-center justify-center p-3 text-white">
                      <span className="text-[10px] font-semibold uppercase bg-white/20 px-2 py-0.5 rounded mb-2">{genres[0] || "Truyện"}</span>
                      <p className="text-[13px] font-bold text-center leading-tight">{story.title}</p>
                    </div>
                  )}
                  {prog && (
                    <span className={`absolute top-2 right-2 text-[11px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-sm ${prog.cls}`}>
                      {prog.label}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="px-4 pt-3.5 pb-2.5">
                  <h3 className="text-sm font-bold text-zinc-900 truncate mb-2">{story.title}</h3>
                  <div className="flex gap-1.5 mb-2.5">
                    {genres.slice(0, 2).map((g: string, i: number) => (
                      <span key={i} className="text-[11px] font-medium text-gray-500 bg-zinc-100 px-2 py-0.5 rounded">{g}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mb-1.5">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      {formatNumber(story.stats?.viewCount)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      {formatNumber(story.stats?.followCount)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {story.stats?.chapterCount || 0} chương
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Cập nhật: {getTimeAgo(story.updatedAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-t border-zinc-100">
                  <button type="button" onClick={() => onManageChapters?.(story)} className="flex-1 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition cursor-pointer text-center">
                    Quản lý chương
                  </button>
                  <button type="button" onClick={() => onEdit?.(story)} className="flex-1 py-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-lg hover:bg-zinc-200 transition cursor-pointer text-center">
                    Chỉnh sửa
                  </button>
                  <button type="button" title="Thêm" className="w-8 h-8 flex items-center justify-center text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-lg hover:bg-zinc-200 transition cursor-pointer shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
