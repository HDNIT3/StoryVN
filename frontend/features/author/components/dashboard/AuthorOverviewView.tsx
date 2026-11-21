"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMyStories, type StoryItem } from "@/features/stories";
import { useAuthorOverview } from "../../queries/useAuthorQueries";
import { useDateRange } from "@/components/statistics";
import type { AuthorAnalyticsData } from "../../types/analytics.types";
import { AuthorAnalyticsReport } from "./AuthorAnalyticsReport";
import { MyStoriesPreview } from "./MyStoriesPreview";
import { RecentActivity } from "./RecentActivity";
import { StoryViewsAnalyticsModal } from "../stories/StoryViewsAnalyticsModal";

export function AuthorOverviewView() {
  const router = useRouter();
  const dateRange = useDateRange();
  const [selectedStory, setSelectedStory] = useState<
    AuthorAnalyticsData["stories"][number] | null
  >(null);
  const {
    data: storiesData,
    isLoading: loadingStories,
    isError: storiesError,
    refetch: refetchStories,
  } = useMyStories({ limit: 4, sortBy: "updatedAt" });
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useAuthorOverview(dateRange.range, dateRange.isValid);
  const manage = (story: StoryItem) =>
    router.push(
      `/tac-gia/chuong-truyen?story=${encodeURIComponent(story.slug || story._id || story.id || "")}`,
    );
  const edit = (story: StoryItem) =>
    router.push(
      `/tac-gia/tac-pham/chinh-sua/${encodeURIComponent(story.slug || story._id || story.id || "")}`,
    );

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200/50 bg-linear-to-r from-amber-500/10 via-sky-500/5 to-transparent p-4 sm:flex-row sm:items-center sm:p-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Tổng quan tác giả
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Nắm nhịp sáng tác, hiểu phản hồi độc giả và theo dõi hiệu quả từng
            tác phẩm.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/tac-gia/tac-pham"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Quản lý tác phẩm
          </Link>
          <Link
            href="/tac-gia/tac-pham/them-moi"
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-600"
          >
            + Viết truyện mới
          </Link>
        </div>
      </div>
      <AuthorAnalyticsReport
        dateRange={dateRange}
        onSelectStory={setSelectedStory}
      />
      {loadingStories ? (
        <p role="status" className="text-sm text-slate-500">
          Đang tải tác phẩm gần đây...
        </p>
      ) : storiesError ? (
        <p role="alert" className="text-sm text-red-600">
          Không thể tải tác phẩm gần đây.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => refetchStories()}
          >
            Thử lại
          </button>
        </p>
      ) : (
        <MyStoriesPreview
          stories={storiesData?.items || []}
          onManageChapters={manage}
          onEdit={edit}
        />
      )}
      {dateRange.isValid && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Hoạt động gần đây trong kỳ
            </h2>
            <Link
              href="/tac-gia/doanh-thu"
              className="text-xs font-semibold text-amber-700 hover:underline"
            >
              Xem lịch sử nhận xu →
            </Link>
          </div>
          {isError ? (
            <p role="alert" className="text-sm text-red-600">
              Không thể tải hoạt động.{" "}
              <button
                type="button"
                onClick={() => refetch()}
                className="underline"
              >
                Thử lại
              </button>
            </p>
          ) : (
            <RecentActivity
              comments={overview?.recentComments}
              notifications={overview?.recentNotifications}
              isLoading={isLoading}
            />
          )}
        </section>
      )}
      <StoryViewsAnalyticsModal
        story={selectedStory}
        isOpen={!!selectedStory}
        range={dateRange.range}
        onClose={() => setSelectedStory(null)}
      />
    </div>
  );
}
