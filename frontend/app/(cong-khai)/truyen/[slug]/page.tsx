"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  usePublicStoryDetail,
  usePublicStories,
  useTopStoriesByViews,
  useToggleLike,
  useToggleFollow,
  useRateStory,
} from "@/lib/hooks/queries/usePublicStoryQuery";
import publicStoryService from "@/lib/services/public-story.service";
import { historyService } from "@/lib/services/history.service";
import type { PublicStoryDetail } from "@/types/public-story";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return (n || 0).toString();
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" });
}

function getProgressLabel(state?: string) {
  if (state === "COMPLETED") return { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (state === "ON_HOLD") return { label: "Tạm ngưng", color: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: "Đang ra", color: "bg-sky-100 text-sky-700 border-sky-200" };
}

function getOriginLabel(origin?: string) {
  if (origin === "TRANSLATED") return "Dịch";
  if (origin === "CONVERT") return "Convert";
  return "Sáng tác";
}

function getAgeRatingColor(rating?: string) {
  if (rating === "18+") return "bg-red-100 text-red-700 border-red-200";
  if (rating === "16+") return "bg-orange-100 text-orange-700 border-orange-200";
  if (rating === "13+") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-green-100 text-green-700 border-green-200";
}

// ── Star Rating Component ────────────────────────────────────────────────────

const SCORE_LABELS: Record<number, string> = {
  1: "1 sao - Rất tệ",
  2: "2 sao - Không hay",
  3: "3 sao - Bình thường",
  4: "4 sao - Rất hay",
  5: "5 sao - Tuyệt phẩm!",
};

function StarRating({
  value,
  onChange,
  onHover,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (score: number) => void;
  onHover?: (score: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5";
  const active = hovered || value;

  const handleMouseEnter = (star: number) => {
    if (readonly) return;
    setHovered(star);
    onHover?.(star);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHovered(0);
    onHover?.(0);
  };

  return (
    <div className={`flex gap-1 items-center ${readonly ? "" : "cursor-pointer"}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          disabled={readonly}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          onClick={() => !readonly && onChange?.(star)}
          className={`transition-transform duration-150 ${readonly ? "cursor-default" : "hover:scale-115 cursor-pointer"} focus:outline-hidden`}
          title={`${star} sao`}
        >
          <svg
            className={`${sizeClass} transition-colors ${
              star <= active ? "text-amber-400 fill-amber-400" : "text-zinc-200 fill-zinc-200 hover:text-amber-200"
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ── Stat Badge ──────────────────────────────────────────────────────────────

function StatBadge({
  icon,
  value,
  label,
  color = "zinc",
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-2.5 sm:p-3 bg-zinc-50 hover:bg-zinc-100/80 rounded-xl border border-zinc-200/60 shadow-2xs min-w-[72px] sm:min-w-[80px] transition-colors">
      <div className={`text-${color}-500`}>{icon}</div>
      <span className="text-sm font-bold text-zinc-900">{value}</span>
      <span className="text-[10px] text-zinc-500 font-medium">{label}</span>
    </div>
  );
}

// ── Action Buttons ──────────────────────────────────────────────────────────

function ActionButtons({ story }: { story: PublicStoryDetail }) {
  const { _id } = story;
  const likeMutation = useToggleLike(_id);
  const followMutation = useToggleFollow(_id);
  const rateMutation = useRateStory(_id);

  const [liked, setLiked] = useState(story.interaction?.liked ?? false);
  const [followed, setFollowed] = useState(story.interaction?.followed ?? false);
  const [myRating, setMyRating] = useState(story.interaction?.myRating ?? 0);
  const [showRating, setShowRating] = useState(false);
  const [hoverScore, setHoverScore] = useState(0);
  const ratingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLiked(story.interaction?.liked ?? false);
    setFollowed(story.interaction?.followed ?? false);
    setMyRating(story.interaction?.myRating ?? 0);
  }, [story.interaction]);

  // Click outside listener for rating popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        setShowRating(false);
      }
    }
    if (showRating) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRating]);

  const handleLike = async () => {
    try {
      const res = await likeMutation.mutateAsync();
      setLiked(res.data.liked);
    } catch {}
  };

  const handleFollow = async () => {
    try {
      const res = await followMutation.mutateAsync();
      setFollowed(res.data.followed);
    } catch {}
  };

  const handleRate = async (score: number) => {
    try {
      await rateMutation.mutateAsync(score);
      setMyRating(score);
      setShowRating(false);
    } catch {}
  };

  const currentScoreText = hoverScore
    ? SCORE_LABELS[hoverScore]
    : myRating
    ? `Đã chọn: ${SCORE_LABELS[myRating]}`
    : "Bấm vào sao để chấm điểm";

  return (
    <div className="flex flex-wrap gap-2.5 mt-5 items-center justify-center sm:justify-start">
      {/* Follow */}
      <button
        onClick={handleFollow}
        disabled={followMutation.isPending}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer shadow-xs ${
          followed
            ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
            : "bg-white text-zinc-700 border-zinc-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50"
        }`}
      >
        <svg className="w-4 h-4" fill={followed ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {followed ? "Đang theo dõi" : "Theo dõi"}
      </button>

      {/* Like */}
      <button
        onClick={handleLike}
        disabled={likeMutation.isPending}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer shadow-xs ${
          liked
            ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600 shadow-rose-100"
            : "bg-white text-zinc-700 border-zinc-300 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50/50"
        }`}
      >
        <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {liked ? "Đã thích" : "Yêu thích"}
      </button>

      {/* Rating */}
      <div className="relative" ref={ratingRef}>
        <button
          onClick={() => setShowRating((p) => !p)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer shadow-xs ${
            myRating
              ? "bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 shadow-amber-50"
              : "bg-white text-zinc-700 border-zinc-300 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50"
          }`}
        >
          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          {myRating ? `Đã đánh giá (${myRating}★)` : "Đánh giá"}
        </button>

        {showRating && (
          <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 z-50 min-w-[260px] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                Chấm điểm truyện
              </span>
              <button
                type="button"
                onClick={() => setShowRating(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center my-2">
              <StarRating
                value={myRating}
                onChange={handleRate}
                onHover={setHoverScore}
                size="lg"
              />
            </div>

            <p className="text-xs font-medium text-amber-600 text-center h-5 mt-1 transition-all">
              {currentScoreText}
            </p>

            {rateMutation.isPending && (
              <p className="text-[11px] text-zinc-400 mt-2 text-center animate-pulse">
                Đang lưu đánh giá...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cột Truyện Cùng Thể Loại (Right Sidebar) ──────────────────────────────────

function RelatedStoriesColumn({
  currentStoryId,
  genreId,
  genreName,
  genreSlug,
}: {
  currentStoryId: string;
  genreId?: string;
  genreName?: string;
  genreSlug?: string;
}) {
  const { data: genreStoriesData, isLoading: isGenreLoading } = usePublicStories(
    genreId ? { genre: genreId, limit: 10 } : undefined
  );
  const { data: topStoriesData, isLoading: isTopLoading } = useTopStoriesByViews(6);

  // Lọc bỏ truyện hiện tại khỏi danh sách cùng thể loại
  const relatedStories = useMemo(() => {
    const list = genreStoriesData?.items || [];
    return list.filter((s) => s._id !== currentStoryId).slice(0, 6);
  }, [genreStoriesData, currentStoryId]);

  // Fallback sang top xem nhiều nếu thể loại này chưa có thêm truyện
  const fallbackStories = useMemo(() => {
    const list = topStoriesData || [];
    return list.filter((s) => s._id !== currentStoryId).slice(0, 6);
  }, [topStoriesData, currentStoryId]);

  const hasRelated = relatedStories.length > 0;
  const displayStories = hasRelated ? relatedStories : fallbackStories;
  const isLoading = genreId ? isGenreLoading : isTopLoading;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-1.5">
            <span>📚</span>
            {hasRelated ? "Truyện cùng thể loại" : "Gợi ý truyện nổi bật"}
          </h3>
        </div>
        {genreSlug && (
          <Link
            href={`/the-loai?genre=${encodeURIComponent(genreSlug)}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5"
          >
            <span>Xem thêm</span>
            <span>→</span>
          </Link>
        )}
      </div>

      {/* Tag thể loại nếu có */}
      {genreName && hasRelated && (
        <div className="mb-3.5">
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full inline-block">
            Thể loại: {genreName}
          </span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-14 h-20 bg-zinc-200 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-zinc-200 rounded w-4/5" />
                <div className="h-3 bg-zinc-200 rounded w-1/2" />
                <div className="h-3 bg-zinc-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Story list */}
      {!isLoading && displayStories.length > 0 && (
        <div className="divide-y divide-zinc-100">
          {displayStories.map((item) => {
            const author =
              item.author?.penName ||
              item.author?.displayName ||
              (typeof item.authorId === "object" ? item.authorId?.displayName : null) ||
              "Tác giả ẩn danh";

            return (
              <Link
                key={item._id}
                href={`/truyen/${item.slug || item._id}`}
                className="group flex gap-3 py-3 first:pt-0 last:pb-0 hover:bg-zinc-50/80 -mx-2 px-2 rounded-2xl transition-colors"
              >
                {/* Cover thumbnail */}
                <div className="relative w-14 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200/80 shadow-2xs group-hover:shadow-md transition-shadow">
                  {item.coverUrl ? (
                    <Image
                      src={item.coverUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs text-indigo-400 font-bold">
                      {item.title.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                      {author}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      ★ {(item.stats?.ratingAverage || 5).toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      👁 {formatNumber(item.stats?.viewCount || 0)}
                    </span>
                    <span>
                      {item.stats?.chapterCount || 0} ch.
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty fallback */}
      {!isLoading && displayStories.length === 0 && (
        <div className="text-center py-6">
          <p className="text-xs text-zinc-400 italic">Chưa có truyện khác cùng thể loại.</p>
          <Link
            href="/the-loai"
            className="inline-block mt-3 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition"
          >
            Khám phá thể loại khác →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main Story Detail Page ──────────────────────────────────────────────────

export default function StoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";

  const { data: story, isLoading, isError } = usePublicStoryDetail(slug);

  // Ghi view sau 5 giây ở trang và lưu lịch sử đọc
  const viewRecorded = useRef(false);
  useEffect(() => {
    if (!story?._id) return;

    // Lưu vào lịch sử đọc
    historyService.recordHistory({
      _id: story._id,
      slug: story.slug || story._id,
      title: story.title,
      coverUrl: story.coverUrl,
      authorName: story.author?.penName || story.author?.displayName || "Tác giả ẩn danh",
      progressState: story.progressState,
      chapterCount: story.stats?.chapterCount || 0,
    });

    if (viewRecorded.current) return;
    const timer = setTimeout(async () => {
      await publicStoryService.recordView(story._id);
      viewRecorded.current = true;
    }, 5000);
    return () => clearTimeout(timer);
  }, [story]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-200 p-8 flex gap-8">
              <div className="w-44 h-64 bg-zinc-200 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-zinc-200 rounded w-2/3" />
                <div className="h-4 bg-zinc-200 rounded w-1/3" />
                <div className="flex gap-2">
                  <div className="h-6 bg-zinc-200 rounded w-20" />
                  <div className="h-6 bg-zinc-200 rounded w-20" />
                </div>
                <div className="h-10 bg-zinc-200 rounded w-full mt-4" />
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-zinc-200 p-8 space-y-3">
              <div className="h-5 bg-zinc-200 rounded w-1/4" />
              <div className="h-4 bg-zinc-200 rounded w-full" />
              <div className="h-4 bg-zinc-200 rounded w-5/6" />
              <div className="h-4 bg-zinc-200 rounded w-2/3" />
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 h-64" />
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 h-80" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !story) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-zinc-800">Không tìm thấy truyện</h1>
        <p className="text-sm text-zinc-500 mt-1">Truyện này có thể đã bị xóa hoặc chưa được xuất bản.</p>
        <Link href="/" className="inline-flex mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
          ← Trang chủ
        </Link>
      </div>
    );
  }

  const rawGenres = story.genreIds || [];
  const genres = rawGenres.map((g: any) =>
    typeof g === "string" ? { _id: g, name: g, slug: g } : g
  );
  const primaryGenre = genres[0] as { _id?: string; name?: string; slug?: string } | undefined;

  const tags = (story.tagIds || []).map((t: any) =>
    typeof t === "string" ? { _id: t, name: t, slug: t } : t
  );
  const author = story.author;
  const authorName = author?.penName || author?.displayName || "Tác giả ẩn danh";
  const progress = getProgressLabel(story.progressState);

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-12">
      {/* ── Background blur ambient effect ────────────────────────────────────── */}
      {story.coverUrl && (
        <div className="absolute inset-0 h-80 overflow-hidden pointer-events-none">
          <Image
            src={story.coverUrl}
            alt=""
            fill
            className="object-cover opacity-10 blur-3xl scale-125"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-50/70 to-zinc-50" />
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
          <Link href="/" className="hover:text-indigo-600 transition">Trang chủ</Link>
          <span>/</span>
          {primaryGenre && (
            <>
              <Link
                href={`/the-loai?genre=${encodeURIComponent(primaryGenre.slug || primaryGenre._id || "")}`}
                className="hover:text-indigo-600 transition"
              >
                {primaryGenre.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-zinc-600 truncate max-w-sm sm:max-w-md">{story.title}</span>
        </div>

        {/* ── 2-Column Split: Trái (Nội dung & Ảnh) | Phải (Cột truyện cùng thể loại & Thông tin) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ════════════════════════════════════════════════════════════════════
              CỘT TRÁI (lg:col-span-8): Ảnh bìa, Thông tin truyện, Giới thiệu
             ════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-6">
            {/* ── Main Story Card (Ảnh bên trái, Thông tin & Nút bên phải) ── */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                {/* Ảnh bìa truyện */}
                <div className="relative w-40 sm:w-48 shrink-0 self-start mx-auto sm:mx-0">
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-xl bg-zinc-100 border border-zinc-200/80">
                    {story.coverUrl ? (
                      <Image
                        src={story.coverUrl}
                        alt={story.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 160px, 192px"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nội dung thông tin cơ bản bên cạnh ảnh */}
                <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col justify-between">
                  <div>
                    {/* Tiêu đề truyện */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 leading-tight">
                      {story.title}
                    </h1>

                    {/* Tác giả */}
                    <p className="text-sm text-zinc-500 mt-1.5">
                      Tác giả:{" "}
                      <Link
                        href={`/the-loai?search=${encodeURIComponent(authorName)}`}
                        className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        {authorName}
                      </Link>
                    </p>

                    {/* Badges / Thẻ phân loại */}
                    <div className="flex flex-wrap gap-2 mt-3.5 justify-center sm:justify-start">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${progress.color}`}>
                        {progress.label}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getAgeRatingColor(story.ageRating)}`}>
                        {story.ageRating || "ALL"}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600">
                        {getOriginLabel(story.originType)}
                      </span>
                      {genres.slice(0, 3).map((g: any) => (
                        <Link
                          key={g.slug || g._id}
                          href={`/the-loai?genre=${encodeURIComponent(g.slug || g._id)}`}
                          className="text-xs font-medium px-2.5 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>

                    {/* Thống kê (Lượt xem, Lượt thích, Theo dõi, Số chương, Đánh giá) */}
                    <div className="flex flex-wrap gap-2.5 mt-4 justify-center sm:justify-start">
                      <StatBadge
                        icon={<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>}
                        value={formatNumber(story.stats?.viewCount || 0)}
                        label="Lượt xem"
                        color="sky"
                      />
                      <StatBadge
                        icon={<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>}
                        value={formatNumber(story.stats?.likeCount || 0)}
                        label="Lượt thích"
                        color="rose"
                      />
                      <StatBadge
                        icon={<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>}
                        value={formatNumber(story.stats?.followCount || 0)}
                        label="Theo dõi"
                        color="indigo"
                      />
                      <StatBadge
                        icon={<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>}
                        value={formatNumber(story.stats?.chapterCount || 0)}
                        label="Chương"
                        color="purple"
                      />
                      <div className="flex flex-col items-center gap-1 p-2.5 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 shadow-2xs min-w-[72px] sm:min-w-[80px]">
                        <StarRating value={Math.round(story.stats?.ratingAverage || 0)} readonly size="sm" />
                        <span className="text-sm font-bold text-zinc-900">
                          {(story.stats?.ratingAverage || 0).toFixed(1)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">{formatNumber(story.stats?.ratingCount || 0)} đánh giá</span>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <ActionButtons story={story} />
                </div>
              </div>
            </div>

            {/* ── Khung Giới Thiệu Truyện ── */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 pb-3.5 border-b border-zinc-100">
                <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Giới thiệu truyện
                </h2>
              </div>

              {story.description ? (
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed whitespace-pre-line">
                  {story.description}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 italic">Chưa có nội dung mô tả cho truyện này.</p>
              )}

              {/* Lời tác giả */}
              {story.authorNote && (
                <div className="bg-indigo-50/70 rounded-2xl border border-indigo-100/80 p-4 sm:p-5 mt-4">
                  <h3 className="text-xs sm:text-sm font-bold text-indigo-900 mb-1.5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Lời nhắn của tác giả
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-800 leading-relaxed whitespace-pre-line">
                    {story.authorNote}
                  </p>
                </div>
              )}

              {/* Từ khóa tags */}
              {tags.length > 0 && (
                <div className="pt-4 border-t border-zinc-100">
                  <h3 className="text-xs font-bold text-zinc-700 mb-3">Từ khóa liên quan</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: any) => (
                      <Link
                        key={tag.slug || tag._id}
                        href={`/the-loai?search=${encodeURIComponent(tag.name)}`}
                        className="text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200/80 px-3 py-1 rounded-full transition"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              CỘT PHẢI (lg:col-span-4): Thông tin, Tác giả, CỘT TRUYỆN CÙNG THỂ LOẠI
             ════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-6">
            {/* Box Thông tin chi tiết */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-100">
                <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
                <h3 className="text-sm sm:text-base font-bold text-zinc-900">Thông tin truyện</h3>
              </div>

              <dl className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-zinc-500">Thể loại</dt>
                  <dd className="font-medium text-zinc-800 text-right max-w-[65%]">
                    {genres.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {genres.map((g: any, idx: number) => (
                          <React.Fragment key={g.slug || g._id || idx}>
                            <Link
                              href={`/the-loai?genre=${encodeURIComponent(g.slug || g._id)}`}
                              className="text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                              {g.name}
                            </Link>
                            {idx < genres.length - 1 && <span className="text-zinc-400">, </span>}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-zinc-500">Trạng thái</dt>
                  <dd className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${progress.color}`}>
                    {progress.label}
                  </dd>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-zinc-500">Độ tuổi</dt>
                  <dd className="font-semibold text-zinc-700">{story.ageRating || "ALL"}</dd>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-zinc-500">Nguồn gốc</dt>
                  <dd className="font-medium text-zinc-700">{getOriginLabel(story.originType)}</dd>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-zinc-500">Đăng ngày</dt>
                  <dd className="font-medium text-zinc-700">{formatDate(story.publishedAt)}</dd>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-zinc-500">Cập nhật</dt>
                  <dd className="font-medium text-zinc-700">{formatDate(story.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            {/* Box Tác giả */}
            {author && (
              <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-5 sm:p-6">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-100">
                  <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900">Tác giả</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-200 shrink-0 border border-zinc-200 shadow-2xs">
                    {author.avatarUrl ? (
                      <Image src={author.avatarUrl} alt={authorName} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="absolute inset-0 bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900 truncate">{authorName}</p>
                    <p className="text-xs text-zinc-500 truncate">@{author.username}</p>
                  </div>
                  <Link
                    href={`/the-loai?search=${encodeURIComponent(authorName)}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline shrink-0"
                  >
                    Xem truyện →
                  </Link>
                </div>
              </div>
            )}

            {/* ── CỘT TRUYỆN CÙNG THỂ LOẠI ── */}
            <RelatedStoriesColumn
              currentStoryId={story._id}
              genreId={primaryGenre?._id}
              genreName={primaryGenre?.name}
              genreSlug={primaryGenre?.slug}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
