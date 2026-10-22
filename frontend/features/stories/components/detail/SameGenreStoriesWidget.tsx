import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { SameGenreStoryItem, StoryDetailData } from "@/features/stories";

interface SameGenreStoriesWidgetProps {
  sameGenreStories: SameGenreStoryItem[];
  genres?: StoryDetailData["genres"];
}

function formatNumber(num?: number): string {
  if (!num || isNaN(num)) return "0";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString("vi-VN");
}

export const SameGenreStoriesWidget: React.FC<SameGenreStoriesWidgetProps> = ({
  sameGenreStories,
  genres,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 leading-tight">
              Cùng thể loại
            </h3>
            <p className="text-xs text-zinc-500">
              Gợi ý tác phẩm tương tự
            </p>
          </div>
        </div>
      </div>

      {/* Danh sách gợi ý */}
      {sameGenreStories.length > 0 ? (
        <div className="space-y-3.5">
          {sameGenreStories.map((item) => (
            <Link
              key={item._id || item.slug}
              href={`/truyen/${item.slug}`}
              className="group flex gap-3 p-2 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/60 transition-all duration-200"
            >
              <div className="relative w-14 h-19 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/80 shrink-0">
                {item.coverUrl ? (
                  <Image
                    src={item.coverUrl}
                    alt={item.title}
                    fill
                    unoptimized
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">
                    Trống
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="text-sm font-bold text-zinc-800 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 truncate">
                  {item.author?.name || item.author?.username || "Tác giả"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                  <span>{formatNumber(item.stats?.viewCount)} lượt đọc</span>
                  <span>•</span>
                  <span className="text-amber-600 font-medium">★ {item.stats?.ratingAverage ? item.stats.ratingAverage.toFixed(1) : "5.0"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 mx-auto mb-2 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-xs text-zinc-500">
            Chưa có thêm truyện khác cùng thể loại này.
          </p>
        </div>
      )}

      {/* Khám phá thêm thể loại */}
      <div className="mt-6 pt-5 border-t border-zinc-100">
        <div className="text-xs font-bold text-zinc-800 mb-2.5">
          Khám phá thêm thể loại
        </div>
        <div className="flex flex-wrap gap-1.5">
          {genres?.map((g) => (
            <Link
              key={g._id || g.slug}
              href={`/truyen?genre=${g.slug}`}
              className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-800 transition-colors"
            >
              {g.name}
            </Link>
          ))}
          <Link
            href="/truyen"
            className="px-2.5 py-1 rounded-lg text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition-colors"
          >
            Tất cả truyện →
          </Link>
        </div>
      </div>
    </div>
  );
};
