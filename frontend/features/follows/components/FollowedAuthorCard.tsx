"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authorService, authorKeys, type AuthorStoryItem } from "@/features/author";
import { formatNumber, formatRelativeTime } from "@/lib/utils/format";
import { useToggleFollow } from "../queries/useFollowsQueries";
import type { FollowedAuthorItem } from "../types";

interface FollowedAuthorCardProps {
  author: FollowedAuthorItem;
}

export function FollowedAuthorCard({ author }: FollowedAuthorCardProps) {
  const { mutate: toggleFollow, isPending } = useToggleFollow();
  const [showConfirm, setShowConfirm] = useState(false);

  // Lấy các tác phẩm công khai của tác giả này (nếu tác giả có truyện)
  const shouldFetchStories = Boolean(author.username && author.storyCount > 0);

  const { data: storiesData, isLoading: isLoadingStories } = useQuery({
    queryKey: authorKeys.stories(author.username, { limit: 4 }),
    queryFn: async () => {
      const res = await authorService.getPublicStories(author.username, {
        limit: 4,
        sortBy: "latest",
      });
      return res.data;
    },
    enabled: shouldFetchStories,
    staleTime: 1000 * 60 * 2, // 2 phút
  });

  const stories: AuthorStoryItem[] = storiesData?.items || [];
  const hasStories = stories.length > 0;

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

      {/* ─── PHẦN 2: DANH SÁCH TÁC PHẨM CỦA TÁC GIẢ ──────────────────── */}
      {/* 
        LƯU Ý THEO YÊU CẦU: Nếu tác giả không có truyện thì chỉ cần hiển thị thông tin tác giả 
        và nút link đến page của họ (ở trên). Không render khối truyện nếu storyCount = 0 hoặc rỗng!
      */}
      {shouldFetchStories && (
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Tác phẩm tiêu biểu
              </span>
              {author.storyCount > stories.length && (
                <Link
                  href={`/tac-gia/${author.username}`}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-0.5 hover:underline"
                >
                  <span>Xem tất cả {author.storyCount} truyện</span>
                  <span>→</span>
                </Link>
              )}
            </div>

            {isLoadingStories ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl bg-zinc-50 border border-zinc-100 animate-pulse"
                  />
                ))}
              </div>
            ) : hasStories ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stories.map((story) => {
                  const isCompleted = story.progressState === "COMPLETED";
                  return (
                    <article
                      key={story._id}
                      className="group/story flex gap-3 p-2.5 rounded-xl bg-zinc-50/80 hover:bg-zinc-100/70 border border-zinc-200/70 hover:border-zinc-300 transition-all shadow-2xs"
                    >
                      {/* Bìa truyện */}
                      <Link
                        href={`/truyen/${story.slug}`}
                        className="relative w-16 h-22 shrink-0 rounded-lg overflow-hidden bg-zinc-200 shadow-2xs"
                        title={story.title}
                      >
                        {story.coverUrl ? (
                          <Image
                            src={story.coverUrl}
                            alt={story.title}
                            fill
                            unoptimized
                            sizes="64px"
                            className="object-cover group-hover/story:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-700 text-white flex items-center justify-center text-xs font-serif font-bold">
                            {story.title.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 inset-x-0 text-[9px] font-bold text-center py-0.5 text-white ${
                            isCompleted ? "bg-emerald-600" : "bg-zinc-900/80"
                          }`}
                        >
                          {isCompleted ? "Full" : "Đang ra"}
                        </span>
                      </Link>

                      {/* Chi tiết truyện */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <Link
                            href={`/truyen/${story.slug}`}
                            className="font-serif text-sm font-bold text-zinc-900 group-hover/story:text-emerald-700 transition-colors line-clamp-1 leading-snug"
                          >
                            {story.title}
                          </Link>

                          {story.genres && story.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {story.genres.slice(0, 2).map((g) => (
                                <span
                                  key={g._id}
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-zinc-200 text-zinc-600"
                                >
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1.5">
                            <span>{story.stats?.chapterCount || 0} chương</span>
                            <span>•</span>
                            <span>{formatNumber(story.stats?.viewCount)} đọc</span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <Link
                            href={`/truyen/${story.slug}`}
                            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                          >
                            Đọc ngay →
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
