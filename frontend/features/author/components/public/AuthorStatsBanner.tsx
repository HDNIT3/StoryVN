import React from "react";
import Image from "next/image";

interface AuthorStatsBannerProps {
  stats?: {
    totalAuthors?: number;
    totalStories?: number;
    totalChapters?: number;
  };
  isLoading: boolean;
  formatNumber: (num?: number) => string;
}

export function AuthorStatsBanner({
  stats,
  isLoading,
  formatNumber,
}: AuthorStatsBannerProps) {
  return (
    <section className="relative rounded-3xl border border-amber-200/80 dark:border-zinc-800 bg-[#fffdf9] dark:bg-zinc-900/95 shadow-sm p-6 sm:p-8 lg:p-10 transition-colors">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
        {/* Left Col: Illustration + Title + Description */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6 flex-1">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-amber-50 dark:bg-zinc-800 border border-amber-200/70 dark:border-zinc-700 shrink-0 shadow-sm">
            <Image
              src="/image/tac-gia-quill.jpg"
              alt="Tác giả StoryVN - Cộng đồng sáng tác"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs sm:text-[13px] font-bold tracking-widest text-[#991b1b] dark:text-rose-400 uppercase">
              CỘNG ĐỒNG SÁNG TÁC
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 font-serif tracking-tight">
              Tác giả StoryVN
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed pt-1">
              Khám phá những cây bút đang góp phần làm đầy kệ sách StoryVN bằng
              tác phẩm mới, chương mới và những giọng kể riêng.
            </p>
          </div>
        </div>

        {/* Right Col: 3 Stats Boxes */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full sm:w-auto shrink-0">
          <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-amber-200/80 dark:border-zinc-700/80 shadow-sm min-w-[95px] sm:min-w-[120px] text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#991b1b] dark:text-rose-400 font-serif">
              {isLoading ? "..." : formatNumber(stats?.totalAuthors || 0)}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
              Tác giả
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              đã đăng truyện
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-amber-200/80 dark:border-zinc-700/80 shadow-sm min-w-[95px] sm:min-w-[120px] text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#991b1b] dark:text-rose-400 font-serif">
              {isLoading ? "..." : formatNumber(stats?.totalStories || 0)}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
              Tác phẩm
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              đang lưu giữ
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-amber-200/80 dark:border-zinc-700/80 shadow-sm min-w-[95px] sm:min-w-[120px] text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#991b1b] dark:text-rose-400 font-serif">
              {isLoading ? "..." : formatNumber(stats?.totalChapters || 0)}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
              Chương
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              đã xuất bản
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
