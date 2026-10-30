"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatNumber, formatRelativeTime } from "@/lib/utils/format";
import { useToggleFollow } from "../queries/useFollowsQueries";
import type { FollowedAuthorItem } from "../types";

interface FollowedAuthorCardProps {
  author: FollowedAuthorItem;
}

export function FollowedAuthorCard({ author }: FollowedAuthorCardProps) {
  const { mutate: toggleFollow, isPending } = useToggleFollow();
  const [showConfirm, setShowConfirm] = useState(false);

  // Chỉ hiển thị những truyện của tác giả mà chính người dùng đang theo dõi
  const followedStories = author.followedStories ?? [];
  const followedStoryCount = author.followedStoryCount ?? followedStories.length;

  const handleUnfollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmUnfollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollow({
      targetType: "AUTHOR",
      targetId: author._id,
    });
    setShowConfirm(false);
  };

  const handleCancelUnfollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all duration-200 overflow-hidden flex flex-col">
      {/* ─── PHẦN 1: THÔNG TIN TÁC GIẢ Ở TRÊN ─────────────────────────── */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-zinc-50/70 via-white to-emerald-50/20 border-b border-zinc-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Avatar + Tên + Bút danh */}
          <div className="flex items-start gap-3.5 min-w-0">
            <Link
              href={`/tac-gia/${author.username}`}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-zinc-100 border-2 border-white shadow-xs shrink-0 group"
              title={author.penName}
            >
              {author.avatarUrl ? (
                <Image
                  src={author.avatarUrl}
                  alt={author.penName}
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-xl font-serif">
                  {author.penName?.charAt(0)?.toUpperCase() || "T"}
                </div>
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/tac-gia/${author.username}`}
                  className="font-serif text-base sm:text-lg font-bold text-zinc-900 hover:text-emerald-700 transition-colors truncate"
                >
                  {author.penName}
                </Link>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  Tác giả
                </span>
              </div>

              <div className="text-xs text-zinc-400 mt-0.5 truncate">
                @{author.username}
                {author.followedAt && (
                  <span className="ml-2">
                    • Theo dõi từ {formatRelativeTime(author.followedAt)}
                  </span>
                )}
              </div>

              {/* Thống kê tác giả */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 mt-2">
                <span className="inline-flex items-center gap-1">
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {author.storyCount}
                  </span>
                  <span>tác phẩm</span>
                </span>
                <span aria-hidden className="w-1 h-1 rounded-full bg-zinc-300" />
                <span className="inline-flex items-center gap-1">
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {formatNumber(author.followerCount)}
                  </span>
                  <span>người theo dõi</span>
                </span>
                <span aria-hidden className="w-1 h-1 rounded-full bg-zinc-300" />
                <span className="inline-flex items-center gap-1">
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {formatNumber(author.totalViews)}
                  </span>
                  <span>lượt đọc</span>
                </span>
              </div>
            </div>
          </div>

          {/* Nút hành động cho tác giả */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {showConfirm ? (
              <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
                <span className="text-[11px] text-zinc-600 px-1">Bỏ theo dõi?</span>
                <button
                  type="button"
                  onClick={handleConfirmUnfollow}
                  disabled={isPending}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "..." : "Có"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelUnfollow}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Không
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUnfollowClick}
                disabled={isPending}
                title="Đang theo dõi tác giả này (Bấm để hủy)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5 text-emerald-700 group-hover:text-rose-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <polyline points="16 11 18 13 22 9" />
                </svg>
                <span>Đang theo dõi</span>
              </button>
            )}

            <Link
              href={`/tac-gia/${author.username}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>Trang tác giả</span>
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Tiểu sử tác giả (nếu có) */}
        {author.biography && (
          <p className="mt-3 text-xs sm:text-[13px] text-zinc-600 italic line-clamp-2 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-zinc-100">
            &ldquo;{author.biography}&rdquo;
          </p>
        )}
      </div>

      {/* ─── PHẦN 2: TRUYỆN CỦA TÁC GIẢ MÀ BẠN ĐANG THEO DÕI ─────────── */}
      {followedStories.length > 0 && (
        <div className="px-4 sm:px-5 py-4 border-t border-zinc-100">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Truyện bạn theo dõi của tác giả
            </span>
            <span className="text-xs font-semibold tabular-nums text-zinc-400">
              ({followedStoryCount})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {followedStories.map((story) => {
              const isCompleted = story.progressState === "COMPLETED";
              return (
                <Link
                  key={story._id}
                  href={`/truyen/${story.slug}`}
                  title={story.title}
                  className="group/story flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-2.5 py-2 hover:bg-white hover:border-zinc-300 transition-colors"
                >
                  <div className="relative w-9 h-12 shrink-0 overflow-hidden rounded-md bg-zinc-200">
                    {story.coverUrl ? (
                      <Image
                        src={story.coverUrl}
                        alt={story.title}
                        fill
                        unoptimized
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-700 text-white flex items-center justify-center font-serif text-xs font-bold">
                        {story.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-sm font-semibold text-zinc-900 line-clamp-1 leading-snug group-hover/story:text-emerald-700 transition-colors">
                      {story.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
                      {story.stats?.chapterCount || 0} chương
                      <span aria-hidden className="mx-1.5 text-zinc-300">
                        •
                      </span>
                      {isCompleted ? "Hoàn thành" : "Đang ra"}
                    </p>
                  </div>

                  <svg
                    className="w-3.5 h-3.5 shrink-0 text-zinc-300 group-hover/story:text-zinc-500 transition-colors"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
