"use client";

import React from "react";
import { StoryItem } from "@/types/story";

interface StoryCardItemProps {
  story: StoryItem;
  onEdit: (story: StoryItem) => void;
  onDelete: (story: StoryItem) => void;
  onSubmitReview: (story: StoryItem) => void;
}

export function StoryCardItem({
  story,
  onEdit,
  onDelete,
  onSubmitReview,
}: StoryCardItemProps) {
  const statusBadgeConfig: Record<
    string,
    { label: string; bg: string; text: string; dot: string }
  > = {
    PUBLISHED: {
      label: "Đã xuất bản",
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    PENDING_REVIEW: {
      label: "Chờ duyệt",
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    DRAFT: {
      label: "Bản nháp",
      bg: "bg-zinc-100 border-zinc-200",
      text: "text-zinc-700",
      dot: "bg-zinc-400",
    },
    REJECTED: {
      label: "Bị từ chối",
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
    },
  };

  const statusConfig = statusBadgeConfig[story.status] || statusBadgeConfig.DRAFT;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString("vi-VN");
  };

  const formattedDate = new Date(story.updatedAt).toLocaleDateString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs hover:shadow-sm transition-all duration-150 overflow-hidden flex flex-col md:flex-row gap-5 p-4 sm:p-5">
      {/* Book Cover Design */}
      <div className="w-full md:w-36 h-48 md:h-52 shrink-0 rounded-lg overflow-hidden relative shadow-2xs group">
        <div className="w-full h-full bg-linear-to-br from-sky-600 via-indigo-600 to-violet-800 p-3 flex flex-col justify-between text-white relative">
          <div className="absolute inset-0 bg-radial from-white/10 to-black/30 pointer-events-none" />

          {/* Top header tag */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-1.5 py-0.5 rounded-sm">
              {story.genres[0] || "Truyện"}
            </span>
            <span className="text-[10px] text-white/80">VN</span>
          </div>

          {/* Book title on cover */}
          <div className="relative z-10 my-auto text-center px-1">
            <h4 className="font-extrabold text-sm sm:text-base leading-tight drop-shadow-xs line-clamp-3">
              {story.title}
            </h4>
          </div>

          {/* Bottom chapter count */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-white/90 border-t border-white/20 pt-1.5">
            <span>{story.stats.chapterCount} chương</span>
            {story.stats.ratingAverage > 0 && (
              <span className="text-white font-semibold">
                {story.stats.ratingAverage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Status & Visibility Row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${statusConfig.bg} ${statusConfig.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                story.visibility === "PUBLIC"
                  ? "bg-sky-50 border-sky-200 text-sky-700"
                  : "bg-zinc-100 border-zinc-200 text-zinc-600"
              }`}
            >
              {story.visibility === "PUBLIC" ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              )}
              <span>{story.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}</span>
            </span>

            <span className="text-xs text-zinc-400 ml-auto hidden sm:inline">
              Cập nhật: {formattedDate}
            </span>
          </div>

          {/* Title & Slug */}
          <h3
            onClick={() => onEdit(story)}
            className="text-lg font-bold text-zinc-900 hover:text-sky-600 cursor-pointer transition-colors line-clamp-1"
          >
            {story.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 truncate font-mono">
            slug: /{story.slug}
          </p>

          {/* Description */}
          <p className="text-sm text-zinc-600 mt-2 line-clamp-2 leading-relaxed">
            {story.description}
          </p>

          {/* Rejected Warning if any */}
          {story.status === "REJECTED" && story.rejectReason && (
            <div className="mt-2.5 p-3 rounded-lg bg-red-50/90 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <strong className="font-semibold">Lý do từ chối:</strong> {story.rejectReason}
              </div>
            </div>
          )}

          {/* Genres & Tags */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {story.genres.map((g) => (
              <span
                key={g}
                className="text-xs font-medium px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100"
              >
                {g}
              </span>
            ))}
            {story.tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Stats & Action Buttons */}
        <div className="mt-4 pt-3.5 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Stats Badges */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-zinc-600">
            <span className="flex items-center gap-1">
              <strong className="text-zinc-900 font-bold">{story.stats.chapterCount}</strong> chương
            </span>
            <span className="text-zinc-300">•</span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span><strong className="text-zinc-900 font-bold">{formatNumber(story.stats.viewCount)}</strong> đọc</span>
            </span>
            <span className="text-zinc-300">•</span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span><strong className="text-zinc-900 font-bold">{formatNumber(story.stats.followCount)}</strong> theo dõi</span>
            </span>
            {story.stats.ratingAverage > 0 && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="flex items-center gap-1 text-zinc-800 font-semibold">
                  <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span>{story.stats.ratingAverage} ({story.stats.ratingCount})</span>
                </span>
              </>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            {/* Submit for review button if Draft or Rejected */}
            {(story.status === "DRAFT" || story.status === "REJECTED") && (
              <button
                type="button"
                onClick={() => onSubmitReview(story)}
                title="Gửi ban biên tập xét duyệt"
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium transition cursor-pointer flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Gửi duyệt</span>
              </button>
            )}


            {/* Edit */}
            <button
              type="button"
              onClick={() => onEdit(story)}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-medium transition cursor-pointer"
            >
              Chỉnh sửa
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete(story)}
              title="Xóa tác phẩm"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
