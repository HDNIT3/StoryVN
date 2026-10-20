"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { storyService } from "@/lib/services/story.service";
import { queryKeys } from "@/lib/query-keys";
import { HeroStoryBanner } from "@/components/home/HeroStoryBanner";

/* ─────────────────────────────────────────────────────────────
   Helpers & Icons
   ───────────────────────────────────────────────────────────── */

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

function ClockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
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

/* ─────────────────────────────────────────────────────────────
   Small shared pieces
   ───────────────────────────────────────────────────────────── */

function SectionKicker({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-600 shadow-[0_10px_30px_-22px_rgba(14,165,233,0.9)] backdrop-blur-xl">
      {icon}
      {children}
    </span>
  );
}

function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-50 to-indigo-50 px-2.5 py-1 text-[11px] font-bold text-sky-600 ring-1 ring-sky-100">
      <SparkleIcon className="h-3 w-3" />
      Mới ra mắt
    </span>
  );
}

function UpcomingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 ring-1 ring-amber-100">
      <ClockIcon className="h-3 w-3" />
      Sắp cập nhật
    </span>
  );
}

const PODIUM_STYLES = [
  "bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-50 text-amber-700 ring-1 ring-amber-200 shadow-[0_12px_30px_-14px_rgba(251,191,36,0.95)]",
  "bg-gradient-to-br from-slate-100 via-white to-slate-50 text-slate-600 ring-1 ring-slate-200 shadow-[0_12px_30px_-16px_rgba(148,163,184,0.9)]",
  "bg-gradient-to-br from-orange-200 via-amber-100 to-orange-50 text-orange-700 ring-1 ring-orange-200 shadow-[0_12px_30px_-14px_rgba(251,146,60,0.9)]",
];

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { data: topStories = [], isLoading } = useQuery({
    queryKey: queryKeys.stories.topViews(10),
    queryFn: async () => {
      const res = await storyService.getTopViews(10);
      return res.data || [];
    },
  });

  const { data: latestUpdatedData, isLoading: isLoadingLatest } = useQuery({
    queryKey: queryKeys.stories.latestUpdated({ limit: 12 }),
    queryFn: async () => {
      const res = await storyService.getLatestUpdated({ limit: 12 });
      return res.data;
    },
  });

  const latestStories = latestUpdatedData?.items || [];

  const hasPodium = topStories.length >= 3;
  const remainingStories = hasPodium ? topStories.slice(3) : topStories;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white">
      {/* ─── Luminous mesh background ─────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[920px] overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[440px] w-[760px] -translate-x-1/2 rounded-full bg-sky-200/40 opacity-70 blur-3xl" />
        <div className="absolute top-24 -left-32 h-[380px] w-[380px] rounded-full bg-indigo-200/35 opacity-60 blur-3xl" />
        <div className="absolute top-64 -right-32 h-[420px] w-[420px] rounded-full bg-fuchsia-200/25 opacity-60 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-white/0 via-white/40 to-white" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-12 px-4 py-6 sm:space-y-16 sm:px-6 sm:py-10 lg:px-8">
        {/* ═══════════════════════════════════════════════════════
            HERO — Truyện mới nhất nổi bật
        ═══════════════════════════════════════════════════════ */}
        <section aria-label="Tiêu điểm nổi bật">
          <HeroStoryBanner />
        </section>

        {/* ═══════════════════════════════════════════════════════
            BẢNG XẾP HẠNG — Top truyện nhiều lượt xem
        ═══════════════════════════════════════════════════════ */}
        <section aria-labelledby="leaderboard-heading" className="relative">
          {/* Quầng sáng nền phía sau bảng xếp hạng */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-10 -z-10 h-[280px] rounded-[3rem] bg-gradient-to-r from-sky-200/30 via-indigo-200/25 to-fuchsia-200/20 opacity-70 blur-3xl"
          />

          <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2.5">
              <SectionKicker icon={<FlameIcon className="h-3.5 w-3.5" />}>
                Bảng xếp hạng
              </SectionKicker>
              <h2
                id="leaderboard-heading"
                className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
              >
                Top truyện nhiều lượt xem nhất
              </h2>
              <p className="max-w-[65ch] text-sm leading-relaxed text-slate-500">
                Những tác phẩm thu hút độc giả hàng đầu đang được đọc nhiều nhất
                trên StoryVN.
              </p>
            </div>

            <Link
              href="/truyen"
              className="shimmer-hover inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/30 sm:self-auto sm:text-sm"
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
              <h3 className="text-base font-bold text-slate-800">
                Chưa có truyện nào trong danh sách
              </h3>
              <p className="mx-auto mt-1 mb-5 max-w-md text-sm text-slate-500">
                Các tác phẩm mới được xuất bản sẽ xuất hiện tại đây khi có lượt
                đọc.
              </p>
              <Link
                href="/truyen"
                className="inline-flex rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5"
              >
                Xem danh sách truyện
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Top 3 — Bento cards phát sáng */}
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
                        {/* Halo màu phía sau thẻ */}
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
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-100">
                              <EyeIcon className="h-3.5 w-3.5 text-sky-400" />
                              <span className="tabular-nums">
                                {formatNumber(story.viewCount)} lượt đọc
                              </span>
                            </span>
                          ) : (
                            <NewBadge />
                          )}
                        </div>

                        <div className="relative flex items-center gap-4">
                          {/* Ảnh bìa + quầng sáng màu */}
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
                            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-sky-600 sm:text-base">
                              {story.title}
                            </h3>
                            <p className="mt-1.5 line-clamp-1 text-xs text-slate-500">
                              Tác giả{" "}
                              <span className="font-semibold text-slate-700">
                                {story.author}
                              </span>
                            </p>
                            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              Xem truyện
                              <ArrowUpRightIcon className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Các vị trí còn lại — danh sách sạch */}
              {remainingStories.length > 0 && (
                <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-2 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-3">
                  <h3 className="px-3 pt-2 pb-3 text-sm font-bold text-slate-800 sm:text-base">
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
                            <h4 className="line-clamp-1 text-xs font-semibold leading-tight text-slate-900 transition-colors group-hover:text-sky-600 sm:text-sm">
                              {story.title}
                            </h4>
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              Tác giả{" "}
                              <span className="font-medium text-slate-600">
                                {story.author}
                              </span>
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            {story.viewCount > 0 ? (
                              <>
                                <div className="flex items-center justify-end gap-1.5 text-xs font-semibold tabular-nums text-slate-700">
                                  <EyeIcon className="h-3.5 w-3.5 text-sky-400" />
                                  {formatNumber(story.viewCount)}
                                </div>
                                <span className="hidden text-[11px] text-slate-400 sm:inline">
                                  lượt đọc
                                </span>
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

        {/* ═══════════════════════════════════════════════════════
            MỚI CẬP NHẬT — Modern clean list
        ═══════════════════════════════════════════════════════ */}
        <section aria-labelledby="latest-chapters-heading" className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2.5">
              <SectionKicker icon={<ClockIcon className="h-3.5 w-3.5" />}>
                Mới nhất
              </SectionKicker>
              <h2
                id="latest-chapters-heading"
                className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl"
              >
                Mới cập nhật
              </h2>
              <p className="max-w-[65ch] text-sm text-slate-500">
                Những chương truyện vừa lên kệ, cập nhật liên tục mỗi ngày.
              </p>
            </div>

            <Link
              href="/truyen"
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)] transition-colors hover:border-sky-200 hover:text-sky-600 sm:self-auto sm:text-sm"
            >
              Xem tất cả
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoadingLatest ? (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_20px_60px_-45px_rgba(14,165,233,0.4)]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-4 px-4 py-4 sm:px-6">
                  <div className="h-3 w-20 rounded bg-slate-100" />
                  <div className="h-3.5 flex-1 rounded bg-slate-100" />
                  <div className="hidden h-3.5 w-40 rounded bg-slate-100 sm:block" />
                  <div className="h-3 w-16 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : latestStories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-500 ring-1 ring-sky-100">
                <ClockIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Chưa có chương truyện nào mới cập nhật.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_20px_60px_-45px_rgba(14,165,233,0.4)]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      <th scope="col" className="hidden px-5 py-3 font-bold sm:table-cell">
                        Thể loại
                      </th>
                      <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                        Truyện
                      </th>
                      <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                        Chương mới
                      </th>
                      <th scope="col" className="hidden px-5 py-3 font-bold md:table-cell">
                        Tác giả
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-bold sm:px-5">
                        Cập nhật
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {latestStories.map((item) => {
                      const dateObj = item.updatedAt
                        ? new Date(item.updatedAt)
                        : new Date();
                      const dateStr = !isNaN(dateObj.getTime())
                        ? `${String(dateObj.getDate()).padStart(2, "0")}/${String(
                            dateObj.getMonth() + 1
                          ).padStart(2, "0")} ${String(dateObj.getHours()).padStart(
                            2,
                            "0"
                          )}:${String(dateObj.getMinutes()).padStart(2, "0")}`
                        : "—";

                      const chapterLink = item.latestChapterNumber
                        ? `/truyen/${item.slug}/chuong/${item.latestChapterNumber}`
                        : `/truyen/${item.slug}`;

                      return (
                        <tr
                          key={item._id}
                          className="group transition-colors hover:bg-sky-50/60"
                        >
                          <td className="hidden px-5 py-3.5 sm:table-cell">
                            <span className="inline-flex max-w-[7.5rem] truncate rounded-full border border-sky-100 bg-sky-50/70 px-2.5 py-1 text-[11px] font-semibold text-sky-600">
                              {item.genre || "Chưa phân loại"}
                            </span>
                          </td>

                          <td className="max-w-[10rem] px-4 py-3.5 sm:max-w-xs sm:px-5">
                            <Link
                              href={`/truyen/${item.slug}`}
                              className="block truncate font-semibold text-slate-900 transition-colors group-hover:text-sky-600"
                              title={item.title}
                            >
                              {item.title}
                            </Link>
                          </td>

                          <td className="max-w-[8rem] px-4 py-3.5 text-slate-500 sm:max-w-sm sm:px-5">
                            {item.latestChapter ? (
                              <Link
                                href={chapterLink}
                                className="block truncate transition-colors hover:text-sky-600"
                                title={item.latestChapter}
                              >
                                {item.latestChapter}
                              </Link>
                            ) : (
                              <UpcomingBadge />
                            )}
                          </td>

                          <td className="hidden max-w-[9rem] truncate px-5 py-3.5 font-medium text-slate-500 md:table-cell">
                            {item.author}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs tabular-nums text-slate-400 sm:px-5">
                            {dateStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
