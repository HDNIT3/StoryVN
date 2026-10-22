import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { TopViewStoryItem } from "@/features/stories";
import { BookIcon } from "./StoryIcons";
import { formatNumber } from "./StoryDateUtils";

interface TopViewsWidgetProps {
  items?: TopViewStoryItem[];
  isLoading: boolean;
}

export const TopViewsWidget: React.FC<TopViewsWidgetProps> = ({ items, isLoading }) => {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs sticky top-24">
      {/* Header Widget */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900">
          Truyện nổi bật
        </h2>
        <Link
          href="/bang-xep-hang"
          className="text-xs text-zinc-500 hover:text-emerald-700 transition-colors"
        >
          Xem tất cả
        </Link>
      </div>

      {/* Danh sách 6 truyện nổi bật */}
      {isLoading ? (
        <div className="space-y-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 bg-zinc-200 rounded shrink-0" />
              <div className="w-10 h-14 bg-zinc-200 rounded shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-3 bg-zinc-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          {items?.slice(0, 6).map((item, index) => {
            const rank = index + 1;
            const rankBadgeStyle =
              rank === 1
                ? "bg-amber-100 text-amber-800 font-bold"
                : rank === 2
                ? "bg-orange-100 text-orange-800 font-bold"
                : rank === 3
                ? "bg-yellow-100 text-yellow-800 font-bold"
                : "bg-zinc-100 text-zinc-600 font-medium";

            return (
              <Link
                key={item._id}
                href={`/truyen/${item.slug}`}
                className="group flex items-center gap-3 p-1 rounded-xl hover:bg-zinc-50/80 transition-colors"
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 ${rankBadgeStyle}`}
                >
                  {rank}
                </span>

                <div className="relative w-10 h-14 rounded overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200/60 shadow-2xs">
                  {item.coverUrl ? (
                    <Image
                      src={item.coverUrl}
                      alt={item.title}
                      fill
                      unoptimized
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 text-zinc-400 flex items-center justify-center">
                      <BookIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mt-1">
                    {item.author} • {formatNumber(item.viewCount)} lượt đọc
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
