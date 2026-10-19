"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { storyService } from "@/lib/services/story.service";
import type { FilteredStoryItem } from "@/types/story";

function formatNumber(num?: number): string {
  if (!num) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
}

function FlameIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 23c-4.97 0-9-3.95-9-8.83 0-3.66 2.05-6.38 4.67-8.9.72-.7 1.48-1.42 2.22-2.18.39-.4.99-.48 1.46-.19.48.29.68.86.47 1.38-.4 1-.45 1.83-.17 2.47.45 1.03 1.63 1.76 2.87 2.53 1.25.78 2.53 1.57 3.33 2.82C18.66 13.56 19 14.89 19 16.17 19 20.05 15.86 23 12 23zm-1.07-16.71c-.72.76-1.46 1.47-2.16 2.16C6.46 10.74 5 12.87 5 15.17 5 18.94 8.14 21 12 21c3.15 0 5.09-1.74 5.09-3.83 0-.96-.28-1.95-1-3.08-.66-1.03-1.72-1.69-2.9-2.42-1.3-.81-2.73-1.7-3.26-2.91-.49-1.12-.4-2.44.15-3.83-.05.06-.1.11-.15.16z" />
    </svg>
  );
}

function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function StarIcon({ className = "w-4 h-4" }: { className?: string }) {
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
      <div className="w-full rounded-3xl bg-[#FAF7F2] p-6 sm:p-10 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="h-6 bg-zinc-200 rounded-full w-36" />
            <div className="h-10 bg-zinc-200 rounded-xl w-4/5" />
            <div className="h-5 bg-zinc-100 rounded-md w-1/2" />
            <div className="space-y-2 pt-2">
              <div className="h-4 bg-zinc-100 rounded w-full" />
              <div className="h-4 bg-zinc-100 rounded w-5/6" />
            </div>
            <div className="flex gap-3 pt-4">
              <div className="h-11 bg-zinc-200 rounded-xl w-32" />
              <div className="h-11 bg-zinc-100 rounded-xl w-28" />
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-48 sm:w-56 h-72 sm:h-80 bg-zinc-200 rounded-2xl" />
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

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden bg-[#FAF7F2]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Truyện mới nhất nổi bật"
    >
      {/* Main Slide Content */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ========================================================= */}
          {/* CỘT TRÁI: THÔNG TIN TRUYỆN MỚI                           */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-5">
            {/* Tag / Kicker */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#0d5c46] text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Truyện mới xuất bản</span>
              </span>

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white border border-amber-200 text-amber-800 text-xs font-semibold">
                {progressText}
              </span>
            </div>

            {/* Tiêu đề truyện: Phông Serif trang trọng, nhịp ngắt chuẩn */}
            <h2
              className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-bold text-zinc-900 leading-[1.2] tracking-tight hover:text-[#0d5c46] transition-colors text-balance"
              style={{ textWrap: "balance" }}
            >
              <Link href={`/truyen/${current.slug}`} className="hover:underline underline-offset-4">
                {current.title}
              </Link>
            </h2>

            {/* Dải thông tin bổ trợ: Tác giả, Thể loại, Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-zinc-600">
              {/* Tác giả */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Tác giả:</span>
                <span className="font-semibold text-zinc-800">{authorName}</span>
              </div>

              <span className="text-zinc-300 hidden sm:inline">•</span>

              {/* Thể loại */}
              {genresList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {genresList.slice(0, 3).map((genreName) => (
                    <span
                      key={genreName}
                      className="px-2 py-0.5 rounded-md bg-white text-stone-700 text-xs font-medium border border-[#EDE7DF]"
                    >
                      {genreName}
                    </span>
                  ))}
                </div>
              )}

              <span className="text-zinc-300 hidden sm:inline">•</span>

              {/* Lượt xem & Số chương */}
              <div className="flex items-center gap-3 tabular-nums font-medium text-zinc-600">
                <span className="inline-flex items-center gap-1">
                  <EyeIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{formatNumber(current.stats?.viewCount)}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{formatNumber(current.stats?.chapterCount)} chương</span>
                </span>
                {current.stats?.ratingAverage ? (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                    <StarIcon className="w-3.5 h-3.5" />
                    <span>{current.stats.ratingAverage.toFixed(1)}</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Tóm tắt truyện: Kiểm soát độ dài dòng 65ch chuẩn Web Typography */}
            <p className="text-sm sm:text-base text-zinc-600 line-clamp-3 leading-relaxed max-w-[65ch]">
              {current.description?.replace(/<[^>]*>?/gm, "") ||
                "Một tác phẩm mới vừa được cập nhật tại StoryVN, mang đến những tình tiết hấp dẫn, mở ra thế giới câu chuyện kỳ thú cho độc giả yêu thích tiểu thuyết trực tuyến."}
            </p>

            {/* Nút hành động */}
            <div className="flex flex-wrap items-center gap-3 pt-2 sm:pt-3">
              <Link
                href={`/truyen/${current.slug}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0d5c46] hover:bg-[#084232] text-white text-sm sm:text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d5c46]"
              >
                <span>Đọc Truyện Ngay</span>
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href={`/truyen/${current.slug}`}
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-sm font-semibold border border-[#EDE7DF] hover:border-[#DCD2C3] transition-colors"
              >
                Thông tin chi tiết
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CỘT PHẢI: HIỂN THỊ BÌA TRUYỆN 3D                         */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 xl:col-span-4 flex justify-center lg:justify-end">
            <Link
              href={`/truyen/${current.slug}`}
              className="group relative block focus:outline-hidden"
              tabIndex={-1}
              aria-hidden="true"
            >
              {/* Vỏ bìa sách giả lập hiệu ứng đổ bóng & gáy sách 3D */}
              <div className="relative w-44 sm:w-52 md:w-60 h-64 sm:h-76 md:h-88 rounded-2xl overflow-hidden shadow-xl shadow-stone-900/20 border-2 border-white bg-zinc-900">
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
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400 flex flex-col items-center justify-center p-4 text-center">
                    <BookIcon className="w-12 h-12 mb-2 text-zinc-500" />
                    <span className="font-serif text-sm font-bold text-zinc-300 line-clamp-2">
                      {current.title}
                    </span>
                  </div>
                )}

                {/* Gáy sách highlight */}
                <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />

                {/* Huy hiệu nhỏ trên bìa */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-amber-300 border border-amber-300/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <FlameIcon className="w-3 h-3 text-amber-400" />
                  <span>Mới nhất</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* THANH ĐIỀU HƯỚNG CAROUSEL & QUICK THUMBNAILS              */}
        {/* ========================================================= */}
        <div className="mt-8 pt-6 border-t border-[#EDE7DF] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quick story pills for slide switching */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {stories.map((story, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={story._id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Chuyển tới truyện: ${story.title}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? "bg-[#0d5c46] text-white font-semibold"
                      : "bg-white hover:bg-stone-50 text-stone-700 border border-[#EDE7DF] hover:border-[#DCD2C3]"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="max-w-[120px] sm:max-w-[150px] truncate">{story.title}</span>
                </button>
              );
            })}
          </div>

          {/* Previous / Next Arrow Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Truyện trước"
              className="w-9 h-9 rounded-full bg-white hover:bg-stone-50 border border-[#EDE7DF] hover:border-[#DCD2C3] text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Slide Indicator Dots */}
            <div className="flex items-center gap-1.5 px-2">
              {stories.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Trang ${i + 1}`}
                  className={`h-2 rounded-full transition-[width,background-color] duration-200 cursor-pointer ${
                    i === activeIndex ? "w-6 bg-[#0d5c46]" : "w-2 bg-zinc-300 hover:bg-zinc-400"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Truyện tiếp theo"
              className="w-9 h-9 rounded-full bg-white hover:bg-stone-50 border border-[#EDE7DF] hover:border-[#DCD2C3] text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
