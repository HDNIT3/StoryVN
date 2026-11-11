"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { AuthorRevenueHistoryItem } from "../../types";

interface AuthorRevenueHistoryCardProps {
  item: AuthorRevenueHistoryItem;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Mới đây";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Mới đây";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export function AuthorRevenueHistoryCard({ item }: AuthorRevenueHistoryCardProps) {
  const readerName = item.reader?.displayName || item.reader?.username || "Độc giả";
  const readerInitial = readerName.charAt(0).toUpperCase();

  const storySlug = item.story?.slug || item.story?._id;
  const chapterNumber = item.chapter?.chapterNumber;
  const chapterLink = storySlug && chapterNumber !== undefined
    ? `/truyen/${storySlug}/chuong-${chapterNumber}`
    : storySlug
    ? `/truyen/${storySlug}`
    : "#";

  return (
    <div className="group bg-white rounded-xl border border-slate-200/80 p-4 hover:border-slate-300 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
      {/* Reader & Transaction detail */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Reader Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 ring-2 ring-slate-200/70 shrink-0 relative">
          {item.reader?.avatarUrl ? (
            <Image
              src={item.reader.avatarUrl}
              alt={readerName}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-sky-600 text-white font-bold text-sm">
              {readerInitial}
            </div>
          )}
        </div>

        {/* Reader name, chapter & story */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-800 hover:text-slate-900 truncate">
              {readerName}
            </span>
            {item.reader?.username && (
              <span className="text-slate-400 font-normal">
                @{item.reader.username}
              </span>
            )}
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">đã mở khóa</span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Link
              href={chapterLink}
              target="_blank"
              className="text-sm font-bold text-sky-700 hover:text-sky-800 hover:underline line-clamp-1 inline-flex items-center gap-1"
            >
              <span>
                Chương {item.chapter?.chapterNumber || "?"}
                {item.chapter?.title ? `: ${item.chapter.title}` : ""}
              </span>
              <svg className="w-3.5 h-3.5 opacity-60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>

          {item.story && (
            <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
              <span>Thuộc truyện:</span>
              <Link
                href={`/truyen/${item.story.slug || item.story._id}`}
                target="_blank"
                className="font-medium text-slate-700 hover:text-amber-700 truncate hover:underline"
              >
                {item.story.title}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Amount and Timestamp */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700">
          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
          <span className="text-sm font-extrabold tracking-tight">
            +{item.coinPrice.toLocaleString("vi-VN")}
          </span>
          <span className="text-[11px] font-bold uppercase">Xu</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 sm:mt-1.5">
          <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatDate(item.unlockedAt)}</span>
        </div>
      </div>
    </div>
  );
}

