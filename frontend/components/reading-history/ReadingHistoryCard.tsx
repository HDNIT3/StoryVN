"use client";

import Link from "next/link";
import Image from "next/image";
import { formatRelativeTime } from "@/lib/utils/format";
import type { ReadingHistoryStoryItem } from "@/types/reading-history";

/** Lịch sử đọc chỉ hiển thị tối đa 3 chương gần đây cho mỗi bộ truyện từ BE */
const RECENT_CHAPTERS_DISPLAY = 3;

export function ReadingHistoryCard({ item }: { item: ReadingHistoryStoryItem }) {
  const {
    story,
    chaptersReadCount,
    totalChapters,
    readCount,
    progressPercent: progressPercentFromApi,
    currentChapter,
    highestChapterNumber,
    recentChapters,
    lastReadAt,
  } = item;

  // Tiến độ = số chương đã đọc / tổng số chương đã phát hành.
  const progressPercent =
    totalChapters > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((chaptersReadCount / totalChapters) * 100))
        )
      : progressPercentFromApi;

  const isCompleted =
    totalChapters > 0 && chaptersReadCount >= totalChapters;
  const chapterHref = (chapterNumber: number) =>
    `/truyen/${story.slug}/chuong/${chapterNumber}`;

  const continueChapterNumber =
    currentChapter?.chapterNumber ?? highestChapterNumber;
  const continueHref = continueChapterNumber
    ? chapterHref(continueChapterNumber)
    : `/truyen/${story.slug}`;

  return (
    <article className="group relative flex flex-col justify-between bg-white rounded-2xl border border-zinc-200 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all duration-200 p-4 sm:p-5">
      {/* Thân thẻ chính */}
      <div className="flex flex-col gap-3.5">
        <div className="flex gap-4 items-start">
          {/* Bìa truyện dạng sách thanh lịch */}
          <Link
            href={`/truyen/${story.slug}`}
            className="relative w-20 h-28 sm:w-22 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-2xs group-hover:opacity-95 transition-opacity"
            title={story.title}
          >
            {story.coverUrl ? (
              <Image
                src={story.coverUrl}
                alt={story.title}
                fill
                unoptimized
                sizes="(max-width: 640px) 80px, 88px"
                className="object-cover"
              />
            ) : (
              <span className="w-full h-full bg-zinc-800 text-white flex items-center justify-center font-serif text-2xl font-bold">
                {story.title.charAt(0).toUpperCase()}
              </span>
            )}

            {/* Nhãn tiến độ gắn ở đáy ảnh bìa */}
            <span
              className={`absolute bottom-0 inset-x-0 py-1 text-center text-[10px] font-bold tracking-wider uppercase text-white ${
                isCompleted ? "bg-emerald-600" : "bg-zinc-900/85 backdrop-blur-xs"
              }`}
            >
              {isCompleted ? "Đã đọc hết" : `${progressPercent}%`}
            </span>
          </Link>

          {/* Thông tin truyện */}
          <div className="min-w-0 flex-1 flex flex-col justify-between">
            <div>
              {/* Tên truyện (font-serif Merriweather, line-clamp-2, leading-snug) */}
              <Link
                href={`/truyen/${story.slug}`}
                className="font-serif text-base sm:text-lg font-bold text-zinc-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug tracking-tight"
              >
                {story.title}
              </Link>

              {/* Thông số đọc */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 mt-1.5">
                <span className="tabular-nums font-medium">
                  Đã đọc{" "}
                  <strong className="font-semibold text-zinc-800">
                    {chaptersReadCount}
                  </strong>
                  {totalChapters > 0 ? (
                    <>
                      /<strong className="font-semibold text-zinc-800">{totalChapters}</strong>
                    </>
                  ) : null}{" "}
                  chương
                </span>
                <span aria-hidden className="w-1 h-1 rounded-full bg-zinc-300 shrink-0" />
                <span className="tabular-nums font-medium text-zinc-500">
                  {readCount} lượt đọc
                </span>
              </div>
            </div>

            {/* Điểm neo đọc: Chương đang dừng */}
            <div className="mt-3 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 text-xs text-zinc-700 font-medium">
                <svg
                  className="w-3.5 h-3.5 text-sky-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <span className="truncate">
                  {continueChapterNumber ? (
                    <>
                      Đang đọc:{" "}
                      <span className="font-semibold text-zinc-900 tabular-nums">
                        Chương {continueChapterNumber}
                      </span>
                      {currentChapter?.title ? ` - ${currentChapter.title}` : ""}
                    </>
                  ) : (
                    "Bắt đầu đọc truyện"
                  )}
                </span>
              </div>
              <span className="shrink-0 text-[11px] text-zinc-400 tabular-nums">
                {formatRelativeTime(lastReadAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Thanh tiến độ */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">Tiến độ bộ truyện</span>
            <span
              className={`font-semibold tabular-nums ${
                isCompleted ? "text-emerald-600" : "text-zinc-700"
              }`}
            >
              {isCompleted ? "Hoàn thành 100%" : `${progressPercent}%`}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted ? "bg-emerald-500" : "bg-sky-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cố định 3 chương gần nhất do BE xử lý */}
        {recentChapters && recentChapters.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              3 chương đọc gần nhất
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {recentChapters.slice(0, RECENT_CHAPTERS_DISPLAY).map((entry) =>
                entry.chapter ? (
                  <Link
                    key={entry.chapter._id}
                    href={chapterHref(entry.chapter.chapterNumber)}
                    title={
                      entry.chapter.title
                        ? `Chương ${entry.chapter.chapterNumber}: ${entry.chapter.title}`
                        : `Chương ${entry.chapter.chapterNumber}`
                    }
                    className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
                  >
                    <span className="font-semibold text-zinc-900 tabular-nums shrink-0">
                      Ch.{entry.chapter.chapterNumber}
                    </span>
                    {entry.chapter.title && (
                      <span className="truncate max-w-[7rem] sm:max-w-[9rem] text-zinc-400 font-normal">
                        {entry.chapter.title}
                      </span>
                    )}
                  </Link>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chân thẻ: Thông tin truyện + Nút đọc tiếp */}
      <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-zinc-100">
        <Link
          href={`/truyen/${story.slug}`}
          className="text-xs font-semibold text-zinc-500 hover:text-sky-600 transition-colors inline-flex items-center gap-1"
        >
          <span>Thông tin truyện</span>
          <span>→</span>
        </Link>

        <Link
          href={continueHref}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-semibold shadow-2xs transition-colors"
        >
          <span>Đọc tiếp</span>
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
    </article>
  );
}
