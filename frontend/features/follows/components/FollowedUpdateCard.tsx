"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils/format";
import { useMarkFollowedUpdatesRead } from "../queries/useFollowsQueries";
import type { FollowedStoryUpdateItem } from "../types";

interface FollowedUpdateCardProps {
  item: FollowedStoryUpdateItem;
}

export function FollowedUpdateCard({ item }: FollowedUpdateCardProps) {
  const { mutate: markSeen, isPending } = useMarkFollowedUpdatesRead();
  const { story, latestChapter, recentNewChapters } = item;

  const isCompleted = story.progressState === "COMPLETED";
  const authorPenName =
    story.author?.penName || story.author?.displayName || "Tác giả StoryVN";
  const authorUsername = story.author?.username;

  const ctaLabel =
    item.unreadChapterCount > 1
      ? `Đọc từ Chương ${item.targetChapterNumber}`
      : item.unreadChapterCount === 1
      ? `Đọc Chương ${item.targetChapterNumber}`
      : `Đọc Chương ${latestChapter.chapterNumber}`;

  return (
    <article
      className={`group rounded-2xl border bg-white p-4 sm:p-5 transition-all duration-200 ${
        item.hasUnread
          ? "border-emerald-200/90 shadow-xs ring-1 ring-emerald-500/10 hover:border-emerald-300"
          : "border-zinc-200/90 shadow-2xs hover:border-zinc-300"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Bìa truyện */}
        <Link
          href={`/truyen/${story.slug}`}
          className="relative w-20 h-28 sm:w-22 sm:h-30 shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-2xs group-hover:opacity-95 transition-opacity self-start"
          title={story.title}
        >
          {story.coverUrl ? (
            <Image
              src={story.coverUrl}
              alt={story.title}
              fill
              unoptimized
              sizes="88px"
              className="object-cover"
            />
          ) : (
            <span className="w-full h-full bg-zinc-800 text-white flex items-center justify-center font-serif text-xl font-bold">
              {story.title.charAt(0).toUpperCase()}
            </span>
          )}

          <span
            className={`absolute bottom-0 inset-x-0 py-0.5 text-center text-[10px] font-bold tracking-wider uppercase text-white ${
              isCompleted
                ? "bg-emerald-600/90"
                : "bg-zinc-900/85 backdrop-blur-xs"
            }`}
          >
            {isCompleted ? "Hoàn thành" : "Đang ra"}
          </span>
        </Link>

        {/* Nội dung cập nhật */}
        <div className="min-w-0 flex-1 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            {/* Dòng tiêu đề & trạng thái mới */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/truyen/${story.slug}`}
                    className="font-serif text-base sm:text-lg font-bold text-zinc-900 hover:text-emerald-700 transition-colors line-clamp-1 leading-snug tracking-tight"
                  >
                    {story.title}
                  </Link>

                  {item.hasUnread ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80 shrink-0 tabular-nums">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      {item.unreadChapterCount} chương mới
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-500 shrink-0">
                      Đã cập nhật
                    </span>
                  )}
                </div>

                {/* Tác giả + tiến độ đọc */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <span>Tác giả:</span>
                    {authorUsername ? (
                      <Link
                        href={`/tac-gia/${authorUsername}`}
                        className="font-medium text-zinc-800 hover:text-emerald-700 hover:underline transition-colors truncate max-w-[160px]"
                      >
                        {authorPenName}
                      </Link>
                    ) : (
                      <span className="font-medium text-zinc-700 truncate max-w-[160px]">
                        {authorPenName}
                      </span>
                    )}
                  </span>

                  <span className="text-zinc-300 hidden sm:inline">•</span>

                  <span className="text-zinc-500 tabular-nums">
                    {item.lastReadChapterNumber !== null
                      ? `Đã đọc đến Chương ${item.lastReadChapterNumber}`
                      : "Chưa đọc chương nào"}
                  </span>

                  <span className="text-zinc-300 hidden sm:inline">•</span>

                  <span className="text-zinc-400">
                    Cập nhật {formatRelativeTime(latestChapter.releasedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Chương mới nhất */}
            <div className="rounded-xl bg-zinc-50/90 border border-zinc-100 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 shrink-0">
                  Mới nhất
                </span>
                <Link
                  href={`/truyen/${story.slug}/chuong/${latestChapter.chapterNumber}`}
                  className="font-semibold text-zinc-800 hover:text-emerald-700 transition-colors truncate"
                >
                  Chương {latestChapter.chapterNumber}: {latestChapter.title}
                </Link>
              </div>
              <span className="text-[11px] text-zinc-400 tabular-nums shrink-0">
                {formatRelativeTime(latestChapter.releasedAt)}
              </span>
            </div>

            {/* Các chương gần đây */}
            {recentNewChapters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {recentNewChapters.map((chap) => (
                  <Link
                    key={chap._id}
                    href={`/truyen/${story.slug}/chuong/${chap.chapterNumber}`}
                    title={`Chương ${chap.chapterNumber}: ${chap.title}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-colors max-w-[230px] ${
                      chap.isUnread
                        ? "border-emerald-200 bg-emerald-50/80 text-emerald-900 font-semibold hover:bg-emerald-100"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {chap.isUnread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    )}
                    <span className="truncate">
                      Ch. {chap.chapterNumber}: {chap.title}
                    </span>
                    {chap.isRead && (
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        (Đã đọc)
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Hành động */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100">
            <Link
              href={`/truyen/${story.slug}`}
              className="text-xs font-semibold text-zinc-500 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
            >
              <span>Trang truyện</span>
              <span>→</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {item.hasUnread && (
                <button
                  type="button"
                  onClick={() => markSeen(story._id)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Đang lưu..." : "Đánh dấu đã xem"}
                </button>
              )}

              <Link
                href={`/truyen/${story.slug}/chuong/${item.targetChapterNumber}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <span>{ctaLabel}</span>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

