"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ChapterPurchaseHistoryItem } from "../../types";

interface ChapterPurchaseHistoryCardProps {
  item: ChapterPurchaseHistoryItem;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Chưa cập nhật";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function ChapterPurchaseHistoryCard({ item }: ChapterPurchaseHistoryCardProps) {
  const [imgError, setImgError] = useState(false);

  const story = item.story;
  const chapter = item.chapter;

  const readHref =
    story?.slug && chapter?.chapterNumber
      ? `/truyen/${story.slug}/chuong/${chapter.chapterNumber}`
      : story?.slug
      ? `/truyen/${story.slug}`
      : "#";

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-zinc-200/90 bg-white hover:border-zinc-300 hover:shadow-xs transition-all">
      <div className="flex items-start gap-4 min-w-0 flex-1">
        {/* Ảnh bìa truyện */}
        <Link
          href={story?.slug ? `/truyen/${story.slug}` : "#"}
          className="relative w-14 h-20 sm:w-16 sm:h-22 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200/60 shadow-2xs group-hover:opacity-95 transition-opacity"
        >
          {story?.coverUrl && !imgError ? (
            <Image
              src={story.coverUrl}
              alt={story.title || "Ảnh bìa truyện"}
              fill
              sizes="64px"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </Link>

        {/* Thông tin truyện & chương */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={story?.slug ? `/truyen/${story.slug}` : "#"}
              className="font-bold text-sm sm:text-base text-zinc-900 hover:text-emerald-700 transition-colors truncate max-w-full"
            >
              {story?.title || "Truyện không xác định"}
            </Link>
            {story?.authorName && (
              <span className="text-xs text-zinc-400 font-medium">
                • {story.authorName}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/70">
              <svg className="w-3.5 h-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span>
                Chương {chapter?.chapterNumber ?? "?"}
                {chapter?.title ? `: ${chapter.title}` : ""}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 pt-0.5">
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Mua lúc: {formatDate(item.unlockedAt)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Giá Xu & Nút Đọc chương */}
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
        <div className="text-left sm:text-right">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Phí mở khóa
          </p>
          <div className="inline-flex items-center gap-1 mt-0.5">
            <span className="text-sm sm:text-base font-extrabold text-amber-600 tabular-nums">
              -{item.coinPrice.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-bold text-amber-700">Xu</span>
          </div>
        </div>

        <Link
          href={readHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-2xs shrink-0 cursor-pointer"
        >
          <span>Đọc ngay</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

