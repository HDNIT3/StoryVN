"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { storyService } from "@/lib/services/story.service";
import type { FilteredStoryItem } from "@/types/story";

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

function StarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

const PROGRESS_LABELS: Record<string, string> = {
  ONGOING: "Đang ra",
  COMPLETED: "Hoàn thành",
  ON_HOLD: "Tạm ngưng",
};

/* ─────────────────────────────────────────────────────────────
   Hero carousel
   ───────────────────────────────────────────────────────────── */

export function HeroStoryBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Lấy các truyện mới nhất từ backend
  const { data, isLoading } = useQuery({
    queryKey: ["stories", "hero-banner-newest"],
    queryFn: async () => {
      const res = await storyService.getStories({
        sortBy: "published",
        limit: 5,
      });
      return res.data?.items || [];
    },
    staleTime: 1000 * 60 * 5, // 5 phút
  });

  const stories: FilteredStoryItem[] = data || [];
  const total = stories.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Tự động chuyển slide sau mỗi 5 giây (nếu không hover)
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, nextSlide]);

  if (isLoading) {
    return (
      <div className="w-full animate-pulse rounded-[2rem] border border-white/70 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/70 p-6 shadow-[0_20px_60px_-15px_rgba(14,165,233,0.12)] sm:p-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="h-6 w-36 rounded-full bg-sky-100/90" />
            <div className="h-10 w-4/5 rounded-xl bg-sky-100/80" />
            <div className="h-5 w-1/2 rounded-md bg-slate-100" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
            </div>
            <div className="flex gap-3 pt-4">
              <div className="h-11 w-32 rounded-xl bg-sky-200/80" />
              <div className="h-11 w-28 rounded-xl bg-white" />
            </div>
          </div>
          <div className="flex justify-center lg:col-span-5">
            <div className="h-72 w-48 rounded-2xl bg-sky-100/80 sm:h-80 sm:w-56" />
          </div>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return null; // Không có truyện mới thì ẩn banner
  }

  const current = stories[activeIndex] || stories[0];
  const progressText = PROGRESS_LABELS[current.progressState] || "Đang phát hành";
  const authorName = current.author?.name || "Đang cập nhật";
  const genresList = current.genres?.map((g) => g.name).filter(Boolean) || [];
  const viewCount = current.stats?.viewCount ?? 0;
  const chapterCount = current.stats?.chapterCount ?? 0;

  return (
    <div
      className="relative w-full overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/80 p-px shadow-[0_20px_60px_-15px_rgba(14,165,233,0.12)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Truyện mới nhất nổi bật"
    >
      {/* Mesh gradient + lưới chấm siêu mảnh bên trong khung */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]"
      >
        <div className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-sky-300/35 opacity-40 blur-3xl" />
        <div className="absolute top-10 -right-16 h-72 w-72 rounded-full bg-indigo-300/35 opacity-35 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-fuchsia-200/40 opacity-30 blur-3xl" />
        <div className="bg-dot-grid absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
      </div>

      <div className="relative z-10 rounded-[calc(2rem-1px)] bg-white/60 px-5 py-8 backdrop-blur-xl sm:px-9 sm:py-11 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-6 xl:gap-8">
          {/* ─── CỘT TRÁI: THÔNG TIN TRUYỆN ───────────────────── */}
          <div className="space-y-5 lg:col-span-7 xl:col-span-8">
            {/* Kicker + trạng thái */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-bold text-sky-600 shadow-[0_10px_30px_-22px_rgba(14,165,233,0.9)] backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
                </span>
                <span className="uppercase tracking-[0.12em]">Truyện mới xuất bản</span>
              </span>

              <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-xs font-semibold text-indigo-600 backdrop-blur-md">
                {progressText}
              </span>
            </div>

            {/* Tiêu đề */}
            <h2
              className="text-balance text-2xl font-extrabold leading-[1.15] tracking-tight text-slate-900 transition-colors hover:text-sky-600 sm:text-3xl md:text-4xl lg:text-[2.6rem]"
              style={{ textWrap: "balance" }}
            >
              <Link href={`/truyen/${current.slug}`} className="hover:underline underline-offset-4">
                {current.title}
              </Link>
            </h2>

            {/* Tác giả + thể loại */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1 backdrop-blur-md">
                <span className="text-slate-400">Tác giả</span>
                <span className="font-bold text-slate-800">{authorName}</span>
              </div>

              {genresList.slice(0, 3).map((genreName) => (
                <span
                  key={genreName}
                  className="rounded-full border border-slate-200/70 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-600 backdrop-blur-md"
                >
                  {genreName}
                </span>
              ))}
            </div>

            {/* Thống kê — có xử lý dữ liệu 0 */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {viewCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-2.5 py-1 font-semibold tabular-nums text-slate-600 backdrop-blur-md">
                  <EyeIcon className="h-3.5 w-3.5 text-sky-400" />
                  {formatNumber(viewCount)} lượt đọc
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 px-2.5 py-1 font-bold text-sky-600">
                  ✦ Mới ra mắt
                </span>
              )}

              {chapterCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-2.5 py-1 font-semibold tabular-nums text-slate-600 backdrop-blur-md">
                  <BookIcon className="h-3.5 w-3.5 text-indigo-400" />
                  {formatNumber(chapterCount)} chương
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1 font-bold text-amber-600">
                  Sắp cập nhật
                </span>
              )}

              {current.stats?.ratingAverage ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1 font-bold tabular-nums text-amber-600">
                  <StarIcon className="h-3.5 w-3.5" />
                  {current.stats.ratingAverage.toFixed(1)}
                </span>
              ) : null}
            </div>

            {/* Tóm tắt */}
            <p className="max-w-[65ch] text-sm leading-relaxed text-slate-600 sm:text-base line-clamp-3">
              {current.description?.replace(/<[^>]*>?/gm, "") ||
                "Một tác phẩm mới vừa được cập nhật tại StoryVN, mang đến những tình tiết hấp dẫn, mở ra thế giới câu chuyện kỳ thú cho độc giả yêu thích tiểu thuyết trực tuyến."}
            </p>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3 pt-1 sm:pt-2">
              <Link
                href={`/truyen/${current.slug}`}
                className="shimmer-hover inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:text-base"
              >
                <span>Đọc Truyện Ngay</span>
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href={`/truyen/${current.slug}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 backdrop-blur-md transition-colors hover:border-sky-200 hover:text-sky-600"
              >
                Thông tin chi tiết
              </Link>
            </div>
          </div>

          {/* ─── CỘT PHẢI: BÌA TRUYỆN + AMBIENT GLOW ───────────── */}
          <div className="flex justify-center lg:col-span-5 lg:justify-end xl:col-span-4">
            <div className="animate-float-soft relative">
              {/* Ambient glow lấy màu từ chính ảnh bìa */}
              {current.coverUrl && (
                <div
                  aria-hidden="true"
                  className="absolute -inset-6 -z-10 overflow-hidden rounded-[2.5rem] opacity-45 blur-2xl"
                >
                  <Image
                    src={current.coverUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="320px"
                    className="scale-110 object-cover"
                  />
                </div>
              )}
              <div
                aria-hidden="true"
                className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-300/45 via-indigo-300/35 to-fuchsia-300/25 blur-2xl"
              />

              <Link
                href={`/truyen/${current.slug}`}
                className="group relative block focus:outline-hidden"
                tabIndex={-1}
                aria-hidden="true"
              >
                <div className="relative h-64 w-44 rotate-2 overflow-hidden rounded-2xl border-2 border-white bg-white/60 shadow-[0_26px_60px_-20px_rgba(14,165,233,0.55)] ring-1 ring-sky-100/70 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-[1.02] sm:h-76 sm:w-52 md:h-88 md:w-60">
                  {current.coverUrl ? (
                    <Image
                      src={current.coverUrl}
                      alt={current.title}
                      fill
                      unoptimized
                      priority
                      sizes="(max-width: 768px) 200px, 280px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 text-center text-sky-500">
                      <BookIcon className="mb-2 h-12 w-12" />
                      <span className="line-clamp-2 text-sm font-bold text-slate-700">
                        {current.title}
                      </span>
                    </div>
                  )}

                  {/* Gáy sách highlight sáng */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-slate-900/20 via-white/40 to-transparent" />

                  {/* Nhãn kính mờ gradient trên bìa */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-sky-500/30">
                    <FlameIcon className="h-3 w-3" />
                    <span>Mới nhất</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Thanh chuyển truyện dạng floating pill ─────────── */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/70 pt-6 sm:flex-row">
          <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-white/80 bg-white/70 p-1.5 shadow-[0_16px_40px_-32px_rgba(14,165,233,0.9)] backdrop-blur-xl">
            {stories.map((story, idx) => {
              const isSelected = idx === activeIndex;

              return (
                <button
                  key={story._id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Chuyển tới truyện: ${story.title}`}
                  aria-current={isSelected ? "true" : undefined}
                  className={`flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs transition-all duration-200 ${
                    isSelected
                      ? "bg-sky-50 font-bold text-sky-700 shadow-[0_8px_20px_-14px_rgba(14,165,233,0.9)] ring-1 ring-sky-200"
                      : "font-medium text-slate-600 hover:bg-white hover:text-sky-600"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                      isSelected
                        ? "bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-sm shadow-sky-500/40"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="max-w-[120px] truncate sm:max-w-[150px]">
                    {story.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Điều hướng */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Truyện trước"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/90 bg-white/80 text-slate-600 shadow-sm backdrop-blur-md transition-colors hover:border-sky-200 hover:text-sky-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5 px-2">
              {stories.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Trang ${i + 1}`}
                  className={`h-2 cursor-pointer rounded-full transition-[width,background-color] duration-200 ${
                    i === activeIndex
                      ? "w-6 bg-gradient-to-r from-sky-500 to-indigo-500"
                      : "w-2 bg-sky-200 hover:bg-sky-300"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Truyện tiếp theo"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/90 bg-white/80 text-slate-600 shadow-sm backdrop-blur-md transition-colors hover:border-sky-200 hover:text-sky-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
