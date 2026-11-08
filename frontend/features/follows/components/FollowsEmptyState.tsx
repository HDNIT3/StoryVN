"use client";

import React from "react";
import Link from "next/link";
import type { FollowBookshelfTab } from "../types";

interface FollowsEmptyStateProps {
  activeTab: FollowBookshelfTab;
  isFiltering: boolean;
  onlyUnread?: boolean;
  onResetFilters: () => void;
  onShowAllUpdates?: () => void;
}

export function FollowsEmptyState({
  activeTab,
  isFiltering,
  onlyUnread = false,
  onResetFilters,
  onShowAllUpdates,
}: FollowsEmptyStateProps) {
  const isStory = activeTab === "STORY";
  const isUpdates = activeTab === "UPDATES";

  if (isUpdates) {
    return (
      <div className="bg-transparent border border-dashed border-zinc-200 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
          <svg
            className="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>

        <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-900">
          {isFiltering
            ? "Không tìm thấy truyện phù hợp trong Chương mới"
            : onlyUnread
            ? "Bạn đã xem hết tất cả chương mới!"
            : "Chưa có cập nhật chương mới"}
        </h3>

        <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 max-w-md leading-relaxed">
          {isFiltering
            ? "Thử thay đổi từ khóa tìm kiếm hoặc chuyển sang chế độ xem tất cả cập nhật."
            : onlyUnread
            ? "Toàn bộ chương mới của các truyện bạn đang theo dõi đều đã được đọc hoặc đánh dấu đã xem."
            : "Hãy theo dõi các truyện bạn yêu thích để theo dõi nhanh những chương mới phát hành tại đây."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {isFiltering ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          ) : onlyUnread && onShowAllUpdates ? (
            <button
              type="button"
              onClick={onShowAllUpdates}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Xem tất cả cập nhật
            </button>
          ) : (
            <Link
              href="/truyen"
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-2xs"
            >
              Khám phá truyện hay ngay
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent border border-dashed border-zinc-200 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
        {isStory ? (
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        ) : (
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )}
      </div>

      <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-900">
        {isFiltering
          ? isStory
            ? "Không tìm thấy truyện phù hợp trong tủ"
            : "Không tìm thấy tác giả theo dõi phù hợp"
          : isStory
          ? "Tủ truyện của bạn đang trống"
          : "Bạn chưa theo dõi tác giả nào"}
      </h3>

      <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 max-w-md leading-relaxed">
        {isFiltering
          ? "Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc để xem lại toàn bộ danh sách."
          : isStory
          ? "Bấm nút 'Theo dõi' ở bất kỳ truyện nào để nhận thông báo chương mới và dễ dàng quay lại đọc bất cứ lúc nào."
          : "Theo dõi các tác giả yêu thích để cập nhật nhanh nhất các tác phẩm mới nhất của họ."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        {isFiltering ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        ) : isStory ? (
          <Link
            href="/truyen"
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            Khám phá truyện hay ngay
          </Link>
        ) : (
          <Link
            href="/tac-gia"
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            Khám phá tác giả StoryVN
          </Link>
        )}
      </div>
    </div>
  );
}
