"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { TopWordCountStoryItem } from "@/features/stories";

function formatNumber(num?: number): string {
  if (!num) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
}

function WordsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h10M4 18h13" />
    </svg>
  );
}

function BookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ArrowUpRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

interface HomeTopWordCountSectionProps {
  stories: TopWordCountStoryItem[];
  isLoading: boolean;
}

export function HomeTopWordCountSection({ stories, isLoading }: HomeTopWordCountSectionProps) {
  return (
    <section
      id="top-nhieu-chu"
      aria-labelledby="top-word-count-heading"
      className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-36 bg-white"
    >
      <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 2xl:px-16">
        <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-600">
              Top nhiều chữ
            </p>
            <h2
              id="top-word-count-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900"
            >
              Top truyện nhiều chữ nhất
            </h2>
            <p className="max-w-[65ch] text-sm sm:text-base leading-relaxed text-slate-500 italic">
              Tổng hợp những tác phẩm đồ sộ nhất theo tổng số từ của các chương đã xuất bản.
            </p>
          </div>

          <Link
            href="/truyen"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-bold text-slate-900 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)] transition-colors hover:border-emerald-300 hover:text-emerald-700"
          >
            Xem tất cả
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200/70 bg-white p-2 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]"
              >
                <div className="aspect-[3/4] w-full rounded-xl bg-slate-100" />
                <div className="space-y-2 px-1.5 py-3">
                  <div className="h-4 w-4/5 rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-500 ring-1 ring-amber-100">
              <WordsIcon className="h-6 w-6" />
            </div>
            <p className="text-base font-medium text-slate-500">
              Chưa có truyện nào được thống kê số từ.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {stories.map((story, index) => (
              <Link
                key={story._id}
                href={`/truyen/${story.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-2 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_24px_50px_-24px_rgba(16,185,129,0.35)]"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-100">
                  {story.coverUrl ? (
                    <Image
                      src={story.coverUrl}
                      alt={story.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 text-amber-400">
                      <BookIcon className="h-7 w-7" />
                    </div>
                  )}

                  <span
                    className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold tabular-nums ${
                      index < 3
                        ? "bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-50 text-amber-700 ring-1 ring-amber-200"
                        : "bg-white/90 text-slate-600 ring-1 ring-slate-200"
                    }`}
                  >
                    #{index + 1}
                  </span>
                </div>

                <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1.5">
                  <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-lg">
                    {story.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-1 text-sm text-slate-500">
                    Tác giả <span className="font-semibold text-slate-700">{story.author}</span>
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-sm font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1.5 tabular-nums text-amber-600">
                      <WordsIcon className="h-4 w-4" />
                      {formatNumber(story.wordCount)} từ
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums text-emerald-600">
                      <BookIcon className="h-4 w-4" />
                      {formatNumber(story.chapterCount)} chương
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
