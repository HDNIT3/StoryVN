"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { TopViewStoryItem } from "@/features/stories";

function formatNumber(num?: number): string {
  if (!num) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
}

function FlameIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 23c-4.97 0-9-3.95-9-8.83 0-3.66 2.05-6.38 4.67-8.9.72-.7 1.48-1.42 2.22-2.18.39-.4.99-.48 1.46-.19.48.29.68.86.47 1.38-.4 1-.45 1.83-.17 2.47.45 1.03 1.63 1.76 2.87 2.53 1.25.78 2.53 1.57 3.33 2.82C18.66 13.56 19 14.89 19 16.17 19 20.05 15.86 23 12 23zm-1.07-16.71c-.72.76-1.46 1.47-2.16 2.16C6.46 10.74 5 12.87 5 15.17 5 18.94 8.14 21 12 21c3.15 0 5.09-1.74 5.09-3.83 0-.96-.28-1.95-1-3.08-.66-1.03-1.72-1.69-2.9-2.42-1.3-.81-2.73-1.7-3.26-2.91-.49-1.12-.4-2.44.15-3.83-.05.06-.1.11-.15.16z" />
    </svg>
  );
}

function EyeIcon({ className = "h-4 w-4" }: { className?: string }) {
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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

function SparkleIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.7a4 4 0 0 0 2.4 2.4L22 12l-5.7 1.9a4 4 0 0 0-2.4 2.4L12 22l-1.9-5.7a4 4 0 0 0-2.4-2.4L2 12l5.7-1.9a4 4 0 0 0 2.4-2.4L12 2z" />
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

function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-50 to-indigo-50 px-2.5 py-1 text-xs font-bold text-sky-600 ring-1 ring-sky-100">
      <SparkleIcon className="h-3 w-3" />
      Mới ra mắt
    </span>
  );
}

const PODIUM_STYLES = [
  "bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-50 text-amber-700 ring-1 ring-amber-200 shadow-[0_12px_30px_-14px_rgba(251,191,36,0.95)]",
  "bg-gradient-to-br from-slate-100 via-white to-slate-50 text-slate-600 ring-1 ring-slate-200 shadow-[0_12px_30px_-16px_rgba(148,163,184,0.9)]",
  "bg-gradient-to-br from-orange-200 via-amber-100 to-orange-50 text-orange-700 ring-1 ring-orange-200 shadow-[0_12px_30px_-14px_rgba(251,146,60,0.9)]",
];

interface HomeTopViewsSectionProps {
  topStories: TopViewStoryItem[];
  isLoading: boolean;
}

export function HomeTopViewsSection({ topStories, isLoading }: HomeTopViewsSectionProps) {
  const hasPodium = topStories.length >= 3;
  const remainingStories = hasPodium ? topStories.slice(3) : topStories;

  return (
    <section id="bang-xep-hang" aria-labelledby="leaderboard-heading" className="relative scroll-mt-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-10 -z-10 h-[280px] rounded-[3rem] bg-gradient-to-r from-sky-200/30 via-indigo-200/25 to-fuchsia-200/20 opacity-70 blur-3xl"
      />

      <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-600">
            Bảng xếp hạng
          </p>
          <h2
            id="leaderboard-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900"
          >
            Top truyện nhiều lượt xem nhất
          </h2>
          <p className="max-w-[65ch] text-sm sm:text-base leading-relaxed text-slate-500 italic">
            Những tác phẩm thu hút độc giả hàng đầu đang được đọc nhiều nhất trên StoryVN.
          </p>
        </div>

        <Link
          href="/truyen"
          className="shimmer-hover inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/30 sm:self-auto sm:text-base"
        >
          <span>Khám phá tất cả truyện</span>
          <ArrowUpRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex animate-pulse gap-4 rounded-3xl border border-white/70 bg-white/70 p-5 backdrop-blur-xl"
            >
              <div className="h-28 w-20 shrink-0 rounded-2xl bg-sky-100/80" />
              <div className="flex-1 space-y-2.5 py-1">
                <div className="h-4 w-3/4 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
                <div className="h-3 w-1/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : topStories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-12 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-500 ring-1 ring-sky-100">
            <BookIcon className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Chưa có truyện nào trong danh sách</h3>
          <p className="mx-auto mt-1 mb-5 max-w-md text-base text-slate-500">
            Các tác phẩm mới được xuất bản sẽ xuất hiện tại đây khi có lượt đọc.
          </p>
          <Link
            href="/truyen"
            className="inline-flex rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5"
          >
            Xem danh sách truyện
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {hasPodium && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-5">
              {topStories.slice(0, 3).map((story, index) => {
                const rank = index + 1;

                return (
                  <Link
                    key={story._id}
                    href={`/truyen/${story.slug}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_14px_44px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_24px_60px_-26px_rgba(14,165,233,0.42)]"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-16 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-sky-200/60 to-indigo-200/40 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                    />

                    <div className="relative flex items-start justify-between gap-3 pb-4">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums ${PODIUM_STYLES[index] ?? PODIUM_STYLES[2]}`}
                      >
                        #{rank}
                      </span>

                      {story.viewCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                          <EyeIcon className="h-4 w-4 text-sky-400" />
                          <span className="tabular-nums">
                            {formatNumber(story.viewCount)} lượt đọc
                          </span>
                        </span>
                      ) : (
                        <NewBadge />
                      )}
                    </div>

                    <div className="relative flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-sky-300/50 to-indigo-300/40 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative h-28 w-20 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.45)]">
                          {story.coverUrl ? (
                            <Image
                              src={story.coverUrl}
                              alt={story.title}
                              fill
                              unoptimized
                              sizes="80px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-400">
                              <BookIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-sky-600 sm:text-lg">
                          {story.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-1 text-sm text-slate-500">
                          Tác giả <span className="font-semibold text-slate-700">{story.author}</span>
                        </p>
                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-sky-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          Xem truyện
                          <ArrowUpRightIcon className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {remainingStories.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-2 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-3">
              <h3 className="px-3 pt-2 pb-3 text-base font-bold text-slate-800 sm:text-lg">
                {hasPodium ? "Các vị trí tiếp theo" : "Danh sách xếp hạng"}
              </h3>

              <div className="divide-y divide-slate-100">
                {remainingStories.map((story, idx) => {
                  const rank = hasPodium ? idx + 4 : idx + 1;

                  return (
                    <Link
                      key={story._id}
                      href={`/truyen/${story.slug}`}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-sky-50/60 sm:gap-4"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs font-bold tabular-nums text-slate-500 ring-1 ring-slate-100 transition-colors group-hover:bg-white group-hover:text-sky-600 group-hover:ring-sky-100">
                        {rank}
                      </span>

                      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-50 ring-1 ring-white shadow-[0_8px_20px_-14px_rgba(15,23,42,0.5)]">
                        {story.coverUrl ? (
                          <Image
                            src={story.coverUrl}
                            alt={story.title}
                            fill
                            unoptimized
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-400">
                            <BookIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-1 text-sm font-semibold leading-tight text-slate-900 transition-colors group-hover:text-sky-600 sm:text-base">
                          {story.title}
                        </h4>
                        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                          Tác giả <span className="font-medium text-slate-600">{story.author}</span>
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        {story.viewCount > 0 ? (
                          <>
                            <div className="flex items-center justify-end gap-1.5 text-sm font-semibold tabular-nums text-slate-700">
                              <EyeIcon className="h-3.5 w-3.5 text-sky-400" />
                              {formatNumber(story.viewCount)}
                            </div>
                            <span className="hidden text-sm text-slate-400 sm:inline">lượt đọc</span>
                          </>
                        ) : (
                          <NewBadge />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
