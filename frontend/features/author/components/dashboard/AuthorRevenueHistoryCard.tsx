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
    <div className="bg-white rounded-md border border-zinc-200 p-3.5 hover:border-zinc-300 hover:bg-zinc-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Reader & Transaction detail */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {/* Reader Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 relative">
          {item.reader?.avatarUrl ? (
            <Image
              src={item.reader.avatarUrl}
              alt={readerName}
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-sky-50 text-sky-700 font-bold text-xs">
              {readerInitial}
            </div>
          )}
        </div>

        {/* Reader name, chapter & story */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-zinc-900 truncate">
              {readerName}
            </span>
            {item.reader?.username && (
              <span className="text-zinc-400 font-normal">
                @{item.reader.username}
              </span>
            )}
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500">đã mở khóa</span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Link
              href={chapterLink}
              target="_blank"
              className="text-xs sm:text-sm font-semibold text-sky-600 hover:text-sky-700 hover:underline line-clamp-1 inline-flex items-center gap-1"
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
            <div className="mt-0.5 text-xs text-zinc-500 flex items-center gap-1.5">
              <span>Thuộc truyện:</span>
              <Link
                href={`/truyen/${item.story.slug || item.story._id}`}
                target="_blank"
                className="font-medium text-zinc-700 hover:text-sky-700 truncate hover:underline"
              >
                {item.story.title}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Amount and Timestamp */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-zinc-100 pt-2 sm:pt-0 shrink-0">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">
          <span className="text-xs sm:text-sm font-bold tracking-tight">
            +{item.coinPrice.toLocaleString("vi-VN")}
          </span>
          <span className="text-[10px] font-semibold uppercase">xu</span>
        </span>

        <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1 sm:mt-1.5">
          <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatDate(item.unlockedAt)}</span>
        </div>
      </div>
    </div>
  );
}
