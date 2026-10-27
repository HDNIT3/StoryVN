"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatNumber, formatRelativeTime } from "@/lib/utils/format";
import { useToggleFollow } from "../queries/useFollowsQueries";
import type { FollowedStoryItem } from "../types";

interface FollowedStoryCardProps {
  item: FollowedStoryItem;
}

export function FollowedStoryCard({ item }: FollowedStoryCardProps) {
  const { mutate: toggleFollow, isPending } = useToggleFollow();
  const [showConfirm, setShowConfirm] = useState(false);

  const isCompleted = item.progressState === "COMPLETED";
  const authorPenName =
    item.author?.penName || item.author?.displayName || "Tác giả StoryVN";
  const authorUsername = item.author?.username;

  const handleUnfollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmUnfollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollow({
      targetType: "STORY",
      targetId: item._id,
    });
    setShowConfirm(false);
  };

  const handleCancelUnfollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <article className="group relative flex flex-col justify-between bg-white rounded-2xl border border-zinc-200/90 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all duration-200 p-4 sm:p-5 overflow-hidden">
      {/* Thân thẻ chính */}
      <div className="flex flex-col gap-3.5">
        <div className="flex gap-4 items-start">
          {/* Bìa truyện dạng sách thanh lịch */}
          <Link
            href={`/truyen/${item.slug}`}
            className="relative w-22 h-30 sm:w-24 sm:h-34 shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-2xs group-hover:opacity-95 transition-opacity"
            title={item.title}
          >
            {item.coverUrl ? (
              <Image
                src={item.coverUrl}
                alt={item.title}
                fill
                unoptimized
                sizes="(max-width: 640px) 88px, 96px"
                className="object-cover"
              />
            ) : (
              <span className="w-full h-full bg-zinc-800 text-white flex items-center justify-center font-serif text-2xl font-bold">
                {item.title.charAt(0).toUpperCase()}
              </span>
            )}

            {/* Nhãn tiến độ đáy ảnh bìa */}
            <span
              className={`absolute bottom-0 inset-x-0 py-0.5 text-center text-[10px] font-bold tracking-wider uppercase text-white ${
                isCompleted
                  ? "bg-emerald-600/90"
                  : "bg-zinc-900/85 backdrop-blur-xs"
              }`}
            >
              {isCompleted ? "Hoàn thành" : "Đang ra"}
            </span>
          </Link>

          {/* Thông tin truyện */}
          <div className="min-w-0 flex-1 flex flex-col justify-between">
            <div>
              {/* Tên truyện */}
              <Link
                href={`/truyen/${item.slug}`}
                className="font-serif text-base sm:text-lg font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug tracking-tight"
              >
                {item.title}
              </Link>

              {/* Tác giả */}
              <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                <span>Tác giả:</span>
                {authorUsername ? (
                  <Link
                    href={`/tac-gia/${authorUsername}`}
                    className="font-medium text-zinc-800 hover:text-emerald-700 hover:underline transition-colors truncate max-w-[140px] sm:max-w-[200px]"
                  >
                    {authorPenName}
                  </Link>
                ) : (
                  <span className="font-medium text-zinc-700 truncate max-w-[140px]">
                    {authorPenName}
                  </span>
                )}
              </div>

              {/* Mô tả tóm tắt ngắn */}
              <p className="mt-2 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                {item.description || "Tác phẩm chưa có mô tả tóm tắt nội dung."}
              </p>
            </div>
          </div>
        </div>

        {/* Thông số thống kê */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-zinc-50 border border-zinc-100 text-center text-xs">
          <div>
            <span className="text-[11px] text-zinc-400 block font-normal">Chương</span>
            <span className="font-semibold text-zinc-800 tabular-nums">
              {item.stats?.chapterCount ?? 0}
            </span>
          </div>
          <div className="border-x border-zinc-200/60">
            <span className="text-[11px] text-zinc-400 block font-normal">Lượt đọc</span>
            <span className="font-semibold text-zinc-800 tabular-nums">
              {formatNumber(item.stats?.viewCount)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block font-normal">Đánh giá</span>
            <span className="font-semibold text-amber-600 tabular-nums inline-flex items-center gap-0.5 justify-center">
              <span>★</span>
              <span>
                {item.stats?.ratingAverage > 0
                  ? item.stats.ratingAverage.toFixed(1)
                  : "5.0"}
              </span>
            </span>
          </div>
        </div>

        {/* Thông tin ngày theo dõi */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-zinc-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Theo dõi: {formatRelativeTime(item.followedAt)}</span>
          </span>
          <span className="text-zinc-500 font-medium tabular-nums inline-flex items-center gap-1">
            <svg
              className="w-3 h-3 text-zinc-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {formatNumber(item.stats?.followCount)} theo dõi
          </span>
        </div>
      </div>

      {/* Chân thẻ: Nút Đọc ngay & Nút Bỏ theo dõi */}
      <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-zinc-100">
        <Link
          href={`/truyen/${item.slug}`}
          className="text-xs font-semibold text-zinc-500 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
        >
          <span>Chi tiết</span>
          <span>→</span>
        </Link>

        <div className="flex items-center gap-2">
          {showConfirm ? (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <span className="text-[11px] text-zinc-500">Bỏ theo dõi?</span>
              <button
                type="button"
                onClick={handleConfirmUnfollow}
                disabled={isPending}
                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "..." : "Có"}
              </button>
              <button
                type="button"
                onClick={handleCancelUnfollow}
                className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Không
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUnfollowClick}
              disabled={isPending}
              title="Đang theo dõi (Bấm để hủy theo dõi)"
              className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer group/btn"
              aria-label="Hủy theo dõi truyện"
            >
              {/* Standard Bookmark Icon */}
              <svg
                className="w-4 h-4 fill-current transition-colors"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          )}

          <Link
            href={`/truyen/${item.slug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <span>Đọc truyện</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.4}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
