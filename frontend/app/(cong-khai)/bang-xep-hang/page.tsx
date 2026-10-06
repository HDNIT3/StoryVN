"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { usePublicStories } from "@/lib/hooks/queries/usePublicStoryQuery";
import type { PublicStoryItem } from "@/types/public-story";

type RankingType = "views" | "likes" | "ratings" | "follows";

const RANKING_TABS: { id: RankingType; label: string; icon: string; sortBy: "viewCount" | "likeCount" | "ratingAverage" | "followCount"; desc: string }[] = [
  { id: "views", label: "Top Lượt Xem", icon: "👁️", sortBy: "viewCount", desc: "Các tác phẩm thu hút lượng độc giả đông đảo nhất" },
  { id: "likes", label: "Top Yêu Thích", icon: "❤️", sortBy: "likeCount", desc: "Tác phẩm nhận được nhiều lượt thả tim và tình cảm từ độc giả" },
  { id: "ratings", label: "Top Đánh Giá", icon: "⭐", sortBy: "ratingAverage", desc: "Những bộ truyện đạt điểm số trung bình cao nhất từ cộng đồng" },
  { id: "follows", label: "Top Theo Dõi", icon: "🔖", sortBy: "followCount", desc: "Truyện được người đọc lưu vào tủ nhiều nhất" },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return (n || 0).toString();
}

function getStoryAuthorName(story: PublicStoryItem): string {
  if (story.author?.penName) return story.author.penName;
  if (story.author?.displayName) return story.author.displayName;
  return "Tác giả ẩn danh";
}

function getGenreNames(story: PublicStoryItem): string[] {
  return (story.genreIds || []).map((g) => (typeof g === "string" ? g : g.name));
}

function getMetricValue(story: PublicStoryItem, type: RankingType) {
  if (type === "views") return `${formatNumber(story.stats?.viewCount || 0)} lượt xem`;
  if (type === "likes") return `${formatNumber(story.stats?.likeCount || 0)} lượt thích`;
  if (type === "ratings") return `${(story.stats?.ratingAverage || 0).toFixed(1)} / 5 sao (${story.stats?.ratingCount || 0} đánh giá)`;
  return `${formatNumber(story.stats?.followCount || 0)} theo dõi`;
}

// ── Podium Card cho Top 1, 2, 3 ─────────────────────────────────────────────
function PodiumCard({
  story,
  rank,
  type,
}: {
  story: PublicStoryItem;
  rank: 1 | 2 | 3;
  type: RankingType;
}) {
  const author = getStoryAuthorName(story);
  const metricText = getMetricValue(story, type);

  const rankStyles = {
    1: {
      border: "border-amber-300 ring-4 ring-amber-400/20",
      badgeBg: "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-md",
      badgeText: "👑 QUÁN QUÂN #1",
      crown: "👑",
      cardBg: "bg-gradient-to-b from-amber-50/60 to-white",
      height: "sm:order-2 sm:-translate-y-4",
    },
    2: {
      border: "border-slate-300 ring-2 ring-slate-200",
      badgeBg: "bg-gradient-to-r from-slate-300 to-zinc-400 text-zinc-900 shadow-sm",
      badgeText: "🥈 Á QUÂN #2",
      crown: "🥈",
      cardBg: "bg-gradient-to-b from-slate-50/60 to-white",
      height: "sm:order-1",
    },
    3: {
      border: "border-amber-700/30 ring-2 ring-amber-800/10",
      badgeBg: "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm",
      badgeText: "🥉 HẠNG BA #3",
      crown: "🥉",
      cardBg: "bg-gradient-to-b from-orange-50/40 to-white",
      height: "sm:order-3",
    },
  }[rank];

  return (
    <div
      className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl border ${rankStyles.border} ${rankStyles.cardBg} ${rankStyles.height} shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      {/* Rank Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${rankStyles.badgeBg}`}>
          {rankStyles.badgeText}
        </span>
        <span className="text-xl sm:text-2xl">{rankStyles.crown}</span>
      </div>

      {/* Cover & Title */}
      <div className="flex sm:flex-col items-center sm:items-center gap-3.5 sm:gap-3 text-left sm:text-center">
        <Link
          href={`/truyen/${story.slug || story._id}`}
          className="relative w-20 sm:w-28 aspect-[2/3] rounded-2xl overflow-hidden shadow-md shrink-0 border border-zinc-200/80 group block"
        >
          {story.coverUrl ? (
            <Image
              src={story.coverUrl}
              alt={story.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="112px"
            />
          ) : (
            <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-3xl">
              📖
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1 sm:w-full">
          <Link
            href={`/truyen/${story.slug || story._id}`}
            className="text-sm sm:text-base font-bold text-zinc-900 hover:text-indigo-600 line-clamp-2 transition-colors"
          >
            {story.title}
          </Link>
          <p className="text-xs text-zinc-500 mt-1 truncate">
            {author}
          </p>
          <p className="text-xs font-bold text-indigo-600 mt-1.5 flex items-center sm:justify-center gap-1">
            <span>🔥</span>
            <span>{metricText}</span>
          </p>
        </div>
      </div>

      {/* Action CTA */}
      <div className="mt-4 pt-3 border-t border-zinc-100/80">
        <Link
          href={`/truyen/${story.slug || story._id}`}
          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition text-center block shadow-xs"
        >
          Đọc ngay →
        </Link>
      </div>
    </div>
  );
}

// ── Leaderboard Table Row cho #4 -> #20 ─────────────────────────────────────
function LeaderboardRow({
  story,
  rank,
  type,
}: {
  story: PublicStoryItem;
  rank: number;
  type: RankingType;
}) {
  const author = getStoryAuthorName(story);
  const genres = getGenreNames(story);
  const metricText = getMetricValue(story, type);

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
      {/* Rank Number */}
      <div className="w-8 sm:w-10 shrink-0 text-center font-black text-sm sm:text-base text-zinc-500">
        #{rank}
      </div>

      {/* Cover */}
      <Link
        href={`/truyen/${story.slug || story._id}`}
        className="relative w-12 sm:w-14 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200/80 block"
      >
        {story.coverUrl ? (
          <Image
            src={story.coverUrl}
            alt={story.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">📖</div>
        )}
      </Link>

      {/* Story Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/truyen/${story.slug || story._id}`}
          className="text-xs sm:text-sm font-bold text-zinc-900 hover:text-indigo-600 transition-colors line-clamp-1"
        >
          {story.title}
        </Link>
        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
          Tác giả: <span className="font-medium text-zinc-700">{author}</span>
        </p>
        <div className="hidden sm:flex items-center gap-1.5 mt-1.5">
          {genres.slice(0, 2).map((g) => (
            <span key={g} className="text-[10px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full font-medium">
              {g}
            </span>
          ))}
          <span className="text-[10px] text-zinc-400">
            • {formatNumber(story.stats?.chapterCount || 0)} chương
          </span>
        </div>
      </div>

      {/* Metric badge */}
      <div className="text-right shrink-0">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
          {metricText}
        </span>
      </div>

      {/* Action button */}
      <div className="hidden md:block shrink-0 pl-2">
        <Link
          href={`/truyen/${story.slug || story._id}`}
          className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-indigo-600 hover:text-white text-zinc-700 text-xs font-semibold transition"
        >
          Đọc truyện
        </Link>
      </div>
    </div>
  );
}

function BangXepHangContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = (searchParams.get("tab") as RankingType) || "views";

  const selectedTabConfig =
    RANKING_TABS.find((t) => t.id === currentTab) || RANKING_TABS[0];

  const { data: storiesData, isLoading } = usePublicStories({
    sortBy: selectedTabConfig.sortBy,
    limit: 20,
    page: 1,
  });

  const stories = storiesData?.items || [];
  const top1 = stories[0];
  const top2 = stories[1];
  const top3 = stories[2];
  const restStories = stories.slice(3);

  const handleTabChange = (tabId: RankingType) => {
    router.push(`/bang-xep-hang?tab=${tabId}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-16">
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-indigo-950">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-amber-300 font-semibold">
            <span>🏆</span>
            <span>Bảng Vinh Danh StoryVN</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Bảng Xếp Hạng Tiểu Thuyết
          </h1>
          <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {selectedTabConfig.desc}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-6">
        {/* ── Ranking Tabs Bar ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-md p-2.5 sm:p-3 flex items-center justify-between gap-2 overflow-x-auto">
          {RANKING_TABS.map((tab) => {
            const isActive = tab.id === currentTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-300"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Loading Skeleton ─────────────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-zinc-200 rounded-3xl animate-pulse" />
              ))}
            </div>
            <div className="space-y-2">
              {[4, 5, 6, 7].map((i) => (
                <div key={i} className="h-16 bg-zinc-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* ── Content ──────────────────────────────────────────────────────── */}
        {!isLoading && stories.length > 0 && (
          <>
            {/* Top 3 Podium Cards */}
            <div className="pt-2">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span>🎖️</span> Top 3 Tác Phẩm Dẫn Đầu
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 items-end">
                {top2 && <PodiumCard story={top2} rank={2} type={currentTab} />}
                {top1 && <PodiumCard story={top1} rank={1} type={currentTab} />}
                {top3 && <PodiumCard story={top3} rank={3} type={currentTab} />}
              </div>
            </div>

            {/* Rest Leaderboard #4 - #20 */}
            {restStories.length > 0 && (
              <div className="pt-4 space-y-2.5">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>📜</span> Bảng Xếp Hạng Chi Tiết (#4 - #{stories.length})
                </h2>

                <div className="space-y-2.5">
                  {restStories.map((story, index) => (
                    <LeaderboardRow
                      key={story._id}
                      story={story}
                      rank={index + 4}
                      type={currentTab}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && stories.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3 text-3xl">
              📊
            </div>
            <h3 className="text-base font-bold text-zinc-800">Chưa có dữ liệu xếp hạng</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Hệ thống đang thống kê tương tác, vui lòng quay lại sau!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BangXepHangPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center">Đang tải bảng xếp hạng...</div>}>
      <BangXepHangContent />
    </Suspense>
  );
}
