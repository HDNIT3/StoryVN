"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { storyService } from "@/lib/services/story.service";
import { queryKeys } from "@/lib/query-keys";
import type { TopViewStoryItem } from "@/types/story";

function formatNumber(num?: number): string {
  if (!num) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
}

function FlameIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-4.97 0-9-3.95-9-8.83 0-3.66 2.05-6.38 4.67-8.9.72-.7 1.48-1.42 2.22-2.18.39-.4.99-.48 1.46-.19.48.29.68.86.47 1.38-.4 1-.45 1.83-.17 2.47.45 1.03 1.63 1.76 2.87 2.53 1.25.78 2.53 1.57 3.33 2.82C18.66 13.56 19 14.89 19 16.17 19 20.05 15.86 23 12 23zm-1.07-16.71c-.72.76-1.46 1.47-2.16 2.16C6.46 10.74 5 12.87 5 15.17 5 18.94 8.14 21 12 21c3.15 0 5.09-1.74 5.09-3.83 0-.96-.28-1.95-1-3.08-.66-1.03-1.72-1.69-2.9-2.42-1.3-.81-2.73-1.7-3.26-2.91-.49-1.12-.4-2.44.15-3.83-.05.06-.1.11-.15.16z" />
    </svg>
  );
}

function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export default function HomePage() {
  const { data: topStories = [], isLoading } = useQuery({
    queryKey: queryKeys.stories.topViews(10),
    queryFn: async () => {
      const res = await storyService.getTopViews(10);
      return res.data || [];
    },
  });

  return (
    <div className="min-h-screen bg-[#fafaf8] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-zinc-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
              <FlameIcon className="w-4 h-4 text-amber-600" />
              <span>BẢNG XẾP HẠNG</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0f3d33]">
              Top Truyện Nhiều Lượt Xem Nhất
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Những tác phẩm thu hút độc giả hàng đầu đang được đọc nhiều nhất trên StoryVN.
            </p>
          </div>

          <Link
            href="/truyen"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0d5c46] hover:bg-[#084232] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            <span>Khám phá tất cả truyện</span>
            <span>→</span>
          </Link>
        </div>

        {/* Content Section */}
        {isLoading ? (
          // Skeleton loading
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-zinc-200/80 p-4 flex gap-4 animate-pulse"
              >
                <div className="w-20 h-28 bg-zinc-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 bg-zinc-200 rounded w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                  <div className="h-3 bg-zinc-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : topStories.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center shadow-xs">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center">
              <BookIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 mb-1">
              Chưa có truyện nào trong danh sách
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto mb-5">
              Các tác phẩm mới được xuất bản sẽ xuất hiện tại đây khi có lượt đọc.
            </p>
            <Link
              href="/truyen"
              className="inline-flex px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm rounded-xl font-medium transition-colors"
            >
              Xem danh sách truyện
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Cards Nổi Bật Đặc Biệt (nếu có từ 3 truyện trở lên) */}
            {topStories.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {topStories.slice(0, 3).map((story, index) => {
                  const rank = index + 1;
                  const rankColors =
                    rank === 1
                      ? "from-amber-500 to-amber-600 text-white ring-4 ring-amber-100"
                      : rank === 2
                      ? "from-slate-400 to-slate-500 text-white ring-4 ring-slate-100"
                      : "from-amber-700 to-amber-800 text-white ring-4 ring-amber-100";

                  return (
                    <Link
                      key={story._id}
                      href={`/truyen/${story.slug}`}
                      className="group relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                    >
                      {/* Huy hiệu thứ hạng Top 1, 2, 3 */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <span
                          className={`w-8 h-8 rounded-xl bg-gradient-to-br ${rankColors} flex items-center justify-center font-bold text-sm shadow-xs`}
                        >
                          #{rank}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                          <EyeIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formatNumber(story.viewCount)} lượt đọc</span>
                        </span>
                      </div>

                      <div className="flex gap-4 items-center">
                        {/* Ảnh bìa */}
                        <div className="relative w-20 h-28 shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60 shadow-2xs">
                          {story.coverUrl ? (
                            <Image
                              src={story.coverUrl}
                              alt={story.title}
                              fill
                              unoptimized
                              sizes="80px"
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 text-zinc-400 flex items-center justify-center">
                              <BookIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Thông tin */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug mb-1 font-sans">
                            {story.title}
                          </h3>
                          <p className="text-xs text-zinc-500 line-clamp-1 mb-2">
                            Tác giả: <span className="text-zinc-700 font-medium">{story.author}</span>
                          </p>
                          <span className="inline-block text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            Đọc ngay →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Danh sách các vị trí tiếp theo (hoặc tất cả nếu < 3) */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-7 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-4 pb-3 border-b border-zinc-100">
                {topStories.length >= 3 ? "Các Vị Trí Tiếp Theo" : "Danh Sách Xếp Hạng"}
              </h2>

              <div className="divide-y divide-zinc-100">
                {(topStories.length >= 3 ? topStories.slice(3) : topStories).map((story, idx) => {
                  const rank = topStories.length >= 3 ? idx + 4 : idx + 1;

                  return (
                    <Link
                      key={story._id}
                      href={`/truyen/${story.slug}`}
                      className="group flex items-center gap-3 sm:gap-4 py-3.5 px-2 rounded-xl hover:bg-zinc-50/80 transition-colors"
                    >
                      {/* Thứ hạng */}
                      <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0">
                        {rank}
                      </span>

                      {/* Bìa truyện */}
                      <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200/60 shadow-2xs">
                        {story.coverUrl ? (
                          <Image
                            src={story.coverUrl}
                            alt={story.title}
                            fill
                            unoptimized
                            sizes="48px"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 text-zinc-400 flex items-center justify-center">
                            <BookIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Tên truyện & tác giả */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-tight">
                          {story.title}
                        </h4>
                        <p className="text-xs text-zinc-500 line-clamp-1 mt-1">
                          Tác giả: <span className="text-zinc-700">{story.author}</span>
                        </p>
                      </div>

                      {/* Lượt xem */}
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                          <EyeIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formatNumber(story.viewCount)}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 hidden sm:inline">lượt đọc</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
