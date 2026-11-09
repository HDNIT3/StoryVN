"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMyStories, type StoryItem } from "@/features/stories";
import { useAuthorOverview } from "../../queries/useAuthorQueries";
import {
  DashboardStats,
  MyStoriesPreview,
  ReadStatsChart,
  RevenueChart,
  RecentActivity,
} from "./index";

export function AuthorOverviewView() {
  const router = useRouter();

  // Fetch author stories
  const {
    data: storiesData,
    isLoading: isLoadingStories,
    isError: isErrorStories,
    error: storiesError,
    refetch: refetchStories,
  } = useMyStories({
    limit: 50,
    sortBy: "updatedAt",
  });

  // Fetch real author studio overview stats, charts & recent activity
  const {
    data: overviewData,
    isLoading: isLoadingOverview,
    refetch: refetchOverview,
  } = useAuthorOverview();

  const stories = storiesData?.items || [];
  const isLoading = isLoadingStories && isLoadingOverview;

  // Compute real statistics from backend overview (with fallback to stories list while loading)
  const dashboardStats = useMemo(() => {
    const ovStats = overviewData?.stats;

    const fallbackStories = stories.length;
    const fallbackChapters = stories.reduce(
      (sum, s) => sum + (s.stats?.chapterCount || (s as any).chapterCount || 0),
      0
    );
    const fallbackViews = stories.reduce(
      (sum, s) => sum + (s.stats?.viewCount || (s as any).viewCount || 0),
      0
    );

    const totalStories = ovStats?.totalStories ?? fallbackStories;
    const totalChapters = ovStats?.totalChapters ?? fallbackChapters;
    const totalViews = ovStats?.totalViews ?? fallbackViews;
    const totalCoins = ovStats?.totalCoins ?? 0;

    const storiesGrowth = ovStats
      ? ovStats.storiesThisMonth > 0
        ? `+${ovStats.storiesThisMonth} tháng này`
        : `${ovStats.publishedStories}/${ovStats.totalStories} đã xuất bản`
      : `${fallbackStories} tác phẩm`;

    const chaptersGrowth = ovStats
      ? ovStats.chaptersThisMonth > 0
        ? `+${ovStats.chaptersThisMonth} chương tháng này`
        : `${ovStats.publishedChapters} chương xuất bản`
      : `${fallbackChapters} chương`;

    const viewsGrowth = ovStats
      ? `Hôm nay: +${(ovStats.viewsToday || 0).toLocaleString("vi-VN")} • 7 ngày: +${(ovStats.viewsWeek || 0).toLocaleString("vi-VN")} • Tháng: +${(ovStats.viewsThisMonth || 0).toLocaleString("vi-VN")}`
      : `${fallbackViews.toLocaleString("vi-VN")} lượt đọc`;

    const coinsGrowth = ovStats
      ? ovStats.coinsThisMonth > 0
        ? `+${ovStats.coinsThisMonth.toLocaleString("vi-VN")} xu tháng này`
        : `Số dư ví: ${(ovStats.walletBalance || 0).toLocaleString("vi-VN")} xu`
      : "0 xu tháng này";

    return {
      totalStories,
      totalChapters,
      totalViews,
      totalCoins,
      storiesGrowth,
      chaptersGrowth,
      viewsGrowth,
      coinsGrowth,
    };
  }, [overviewData, stories]);

  const handleManageChapters = (story: StoryItem) => {
    const slug = story.slug || story._id || story.id;
    if (slug) {
      router.push(`/tac-gia/chuong-truyen?story=${slug}`);
    }
  };

  const handleEditStory = (story: StoryItem) => {
    const slug = story.slug || story._id || story.id;
    if (slug) {
      router.push(`/tac-gia/tac-pham/chinh-sua/${slug}`);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-8 max-w-7xl mx-auto space-y-6 sm:space-y-7 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-amber-500/10 via-sky-500/5 to-transparent p-4 sm:p-6 rounded-2xl border border-amber-200/50">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span role="img" aria-label="crown" className="text-xl sm:text-2xl shrink-0">👑</span>
            <span className="truncate">Khu vực tác giả</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Quản lý tác phẩm, theo dõi thống kê và phát triển hành trình sáng tác của bạn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <Link
            href="/tac-gia/tac-pham"
            className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition shadow-xs flex-1 sm:flex-initial"
          >
            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Quản lý tác phẩm</span>
          </Link>
          <Link
            href="/tac-gia/tac-pham/them-moi"
            className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition shadow-xs hover:shadow-md flex-1 sm:flex-initial"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Viết truyện mới</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton or Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 animate-pulse"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="w-1/2 h-3 bg-slate-200 rounded" />
                <div className="w-3/4 h-5 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isErrorStories ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm text-red-600 font-medium">
            {(storiesError as any)?.message || "Không thể tải thống kê tác giả"}
          </p>
          <button
            type="button"
            onClick={() => {
              refetchStories();
              refetchOverview();
            }}
            className="mt-2 text-xs font-semibold text-red-700 underline"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* Dashboard Stats Cards */}
          <DashboardStats
            totalStories={dashboardStats.totalStories}
            totalChapters={dashboardStats.totalChapters}
            totalViews={dashboardStats.totalViews}
            totalCoins={dashboardStats.totalCoins}
            storiesGrowth={dashboardStats.storiesGrowth}
            chaptersGrowth={dashboardStats.chaptersGrowth}
            viewsGrowth={dashboardStats.viewsGrowth}
            coinsGrowth={dashboardStats.coinsGrowth}
          />

          {/* My Stories Preview */}
          <MyStoriesPreview
            stories={stories}
            onManageChapters={handleManageChapters}
            onEdit={handleEditStory}
          />
        </>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ReadStatsChart
          readsChartData={overviewData?.charts?.reads}
          stats={overviewData?.stats}
        />
        <RevenueChart
          revenueChartData={overviewData?.charts?.revenue}
          totalCoins={overviewData?.stats?.totalCoins ?? 0}
          walletBalance={overviewData?.stats?.walletBalance ?? 0}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity
        comments={overviewData?.recentComments}
        notifications={overviewData?.recentNotifications}
        isLoading={isLoadingOverview}
      />
    </div>
  );
}
