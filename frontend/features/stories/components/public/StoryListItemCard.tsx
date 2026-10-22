import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { FilteredStoryItem } from "@/features/stories";
import { BookIcon, WordsIcon, EyeIcon, ClockIcon, BookmarkIcon } from "./StoryIcons";
import { formatDateTime, formatRelativeTime, formatNumber } from "./StoryDateUtils";

interface StoryListItemCardProps {
  story: FilteredStoryItem;
}

export const StoryListItemCard: React.FC<StoryListItemCardProps> = ({ story }) => {
  const primaryGenre =
    story.genres && story.genres.length > 0
      ? story.genres[0].name
      : "Chưa phân loại";
  const isCompleted = story.progressState === "COMPLETED";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 transition-colors hover:border-zinc-300 flex flex-col sm:flex-row gap-4 sm:gap-5">
      {/* Bìa truyện */}
      <div className="relative w-28 h-38 sm:w-32 sm:h-44 shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60 shadow-2xs self-center sm:self-start">
        <span className="absolute top-2 left-2 z-10 bg-zinc-900/90 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
          Mới
        </span>

        {story.coverUrl ? (
          <Image
            src={story.coverUrl}
            alt={story.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 112px, 128px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-white flex flex-col items-center justify-center p-2 text-center">
            <BookIcon className="w-8 h-8 text-zinc-400 mb-1" />
            <span className="text-[10px] line-clamp-2 font-medium">
              {story.title}
            </span>
          </div>
        )}
      </div>

      {/* Nội dung truyện ở giữa */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Tiêu đề */}
          <Link
            href={`/truyen/${story.slug}`}
            className="text-base sm:text-lg font-bold text-zinc-900 hover:text-emerald-700 transition-colors line-clamp-2 leading-snug mb-2 font-sans"
          >
            {story.title}
          </Link>

          {/* Metadata hàng 1 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 mb-1.5">
            <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-medium">
              {primaryGenre}
            </span>
            <span>
              Tác giả:{" "}
              <span className="text-zinc-900 font-medium">
                {story.author?.name || "Đại Hiệp Mèo"}
              </span>
            </span>
          </div>

          {/* Cập nhật gần nhất */}
          <div className="text-[11px] sm:text-xs text-zinc-400 mb-2.5">
            Cập nhật gần nhất: {formatDateTime(story.updatedAt)}
          </div>

          {/* Mô tả tóm tắt */}
          <p className="text-xs sm:text-sm text-zinc-600 line-clamp-2 leading-relaxed mb-3">
            {story.description || "Tác phẩm chưa có mô tả tóm tắt."}
          </p>
        </div>

        {/* Tag thể loại phía dưới */}
        <div className="flex flex-wrap items-center gap-1.5">
          {story.genres?.map((g) => (
            <span
              key={g._id}
              className="bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 text-[11px] px-2.5 py-0.5 rounded-md transition-colors"
            >
              {g.name}
            </span>
          ))}
        </div>
      </div>

      {/* Cột thống kê & Nút thao tác bên phải */}
      <div className="sm:w-36 shrink-0 flex flex-col justify-between sm:items-end border-t sm:border-t-0 sm:border-l sm:border-zinc-100 pt-3 sm:pt-0 sm:pl-4 text-xs">
        <div className="space-y-1.5 text-zinc-600 sm:text-right w-full">
          <div className="flex sm:justify-end items-center gap-1.5 text-zinc-700">
            <BookIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium">{story.stats?.chapterCount ?? 0} chương</span>
          </div>
          <div className="flex sm:justify-end items-center gap-1.5 text-zinc-500">
            <WordsIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formatNumber(story.stats?.wordCount)} từ</span>
          </div>
          <div className="flex sm:justify-end items-center gap-1.5 text-zinc-500">
            <EyeIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formatNumber(story.stats?.viewCount)} lượt đọc</span>
          </div>
          <div className="flex sm:justify-end items-center gap-1.5 text-zinc-500">
            <ClockIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formatRelativeTime(story.updatedAt)}</span>
          </div>
          <div className="pt-0.5 sm:text-right font-medium text-emerald-800 text-[11px]">
            {isCompleted ? "Hoàn thành" : "Đang ra"}
          </div>
        </div>

        {/* Nút Đọc ngay & Bookmark */}
        <div className="flex items-center gap-2 mt-3 sm:mt-auto">
          <Link
            href={`/truyen/${story.slug}`}
            className="px-3.5 py-1.5 bg-[#0d5c46] hover:bg-[#084232] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            Đọc ngay
          </Link>
          <button
            type="button"
            title="Lưu truyện"
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <BookmarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
