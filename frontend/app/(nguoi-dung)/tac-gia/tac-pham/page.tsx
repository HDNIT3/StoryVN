"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMyStories, useUpdateStory } from "@/lib/hooks/queries/useStoryQuery";
import { StoryItem, StoryStatus, StoryVisibility } from "@/types/story";
import { StoryStatsCards } from "@/components/author/stories/StoryStatsCards";
import { StoryFilterBar } from "@/components/author/stories/StoryFilterBar";
import { StoryCardItem } from "@/components/author/stories/StoryCardItem";

export default function QuanLyTacPhamPage() {
  const router = useRouter();

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StoryStatus>("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | StoryVisibility>("ALL");
  const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt" | "title" | "viewCount" | "chapterCount">("updatedAt");

  // Fetch stories using TanStack Query Hook
  const {
    data: storiesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useMyStories({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: search.trim() || undefined,
    sortBy,
  });

  // Fetch all stories for status counts overview
  const { data: allStoriesData } = useMyStories({ limit: 100 });

  const stories = storiesData?.items || [];
  const allStories = allStoriesData?.items || [];

  // Filter visibility client-side if needed
  const filteredStories = useMemo(() => {
    if (visibilityFilter === "ALL") return stories;
    return stories.filter((s) => s.visibility === visibilityFilter);
  }, [stories, visibilityFilter]);

  // Compute status counts from all stories
  const statusCounts = useMemo(() => {
    return {
      ALL: allStories.length,
      PUBLISHED: allStories.filter((s) => s.status === "PUBLISHED").length,
      PENDING_REVIEW: allStories.filter((s) => s.status === "PENDING_REVIEW").length,
      DRAFT: allStories.filter((s) => s.status === "DRAFT").length,
      REJECTED: allStories.filter((s) => s.status === "REJECTED").length,
    };
  }, [allStories]);

  // Mutation for submitting review from list
  const updateStoryMutation = useUpdateStory();

  // Handlers
  const handleOpenCreateModal = () => {
    router.push("/tac-gia/tac-pham/them-moi");
  };

  const handleOpenEditModal = (story: StoryItem) => {
    const slug = story.slug || story._id || story.id;
    if (slug) {
      router.push(`/tac-gia/tac-pham/chinh-sua/${slug}`);
    }
  };

  const handleSubmitReview = (story: StoryItem) => {
    const id = story._id || story.id;
    if (id) {
      updateStoryMutation.mutate({ id, payload: {}, action: "SUBMIT" });
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setVisibilityFilter("ALL");
    setSortBy("updatedAt");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">


      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            Quản lý tác phẩm
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Không gian sáng tác, theo dõi tương tác độc giả và quản lý danh sách tiểu thuyết của bạn.
          </p>
        </div>

        <Link
          href="/tac-gia/dang-ky"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-md transition font-medium"
        >
          <svg className="w-3.5 h-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Hồ sơ tác giả</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Overview Statistics Cards */}
      <StoryStatsCards stories={allStories} />

      {/* Filter and Search Bar */}
      <StoryFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        visibilityFilter={visibilityFilter}
        onVisibilityFilterChange={setVisibilityFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        statusCounts={statusCounts}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {/* Story List / States */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-zinc-200 p-5 flex flex-col md:flex-row gap-5 animate-pulse"
            >
              <div className="w-full md:w-32 h-44 bg-zinc-200 rounded-md shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-zinc-200 rounded w-1/4" />
                <div className="h-6 bg-zinc-200 rounded w-1/2" />
                <div className="h-3 bg-zinc-200 rounded w-3/4" />
                <div className="h-3 bg-zinc-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
          <p className="text-sm font-semibold text-red-600">
            {(error as any)?.message || "Không thể tải danh sách tác phẩm"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : filteredStories.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {filteredStories.map((story) => (
            <StoryCardItem
              key={story._id || story.id}
              story={story}
              onEdit={handleOpenEditModal}
              onSubmitReview={handleSubmitReview}
              isSubmittingReview={updateStoryMutation.isPending}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-lg border border-zinc-200 p-10 sm:p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900">
            Không tìm thấy tác phẩm phù hợp
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm">
            {allStories.length === 0
              ? "Bạn chưa có tác phẩm nào. Hãy bắt đầu sáng tác tác phẩm đầu tiên của bạn!"
              : "Không có truyện nào thỏa mãn từ khóa tìm kiếm hoặc bộ lọc hiện tại của bạn."}
          </p>
          <div className="mt-4 flex items-center gap-2.5">
            {allStories.length > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-xs font-semibold transition cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              + Thêm tác phẩm mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
