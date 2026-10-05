"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StoryItem, StoryStatus, StoryVisibility } from "@/types/story";
import { MOCK_STORIES } from "@/lib/mock/stories.mock";
import { StoryStatsCards } from "@/components/author/stories/StoryStatsCards";
import { StoryFilterBar } from "@/components/author/stories/StoryFilterBar";
import { StoryCardItem } from "@/components/author/stories/StoryCardItem";
import { toast } from "@/lib/toast";

export default function QuanLyTacPhamPage() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryItem[]>(MOCK_STORIES);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StoryStatus>("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | StoryVisibility>("ALL");
  const [sortBy, setSortBy] = useState<"updatedAt" | "viewCount" | "chapterCount">("updatedAt");

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      ALL: stories.length,
      PUBLISHED: stories.filter((s) => s.status === "PUBLISHED").length,
      PENDING_REVIEW: stories.filter((s) => s.status === "PENDING_REVIEW").length,
      DRAFT: stories.filter((s) => s.status === "DRAFT").length,
      REJECTED: stories.filter((s) => s.status === "REJECTED").length,
    };
  }, [stories]);

  // Filtered stories
  const filteredStories = useMemo(() => {
    return stories
      .filter((story) => {
        // Search filter
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchTitle = story.title.toLowerCase().includes(q);
          const matchSlug = story.slug.toLowerCase().includes(q);
          const matchGenre = story.genres.some((g) => g.toLowerCase().includes(q));
          if (!matchTitle && !matchSlug && !matchGenre) return false;
        }

        // Status filter
        if (statusFilter !== "ALL" && story.status !== statusFilter) {
          return false;
        }

        // Visibility filter
        if (visibilityFilter !== "ALL" && story.visibility !== visibilityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "viewCount") {
          return (b.stats.viewCount || 0) - (a.stats.viewCount || 0);
        }
        if (sortBy === "chapterCount") {
          return (b.stats.chapterCount || 0) - (a.stats.chapterCount || 0);
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [stories, search, statusFilter, visibilityFilter, sortBy]);

  // Handlers
  const handleOpenCreateModal = () => {
    router.push("/tac-gia/tac-pham/them-moi");
  };

  const handleOpenEditModal = (story: StoryItem) => {
    router.push(`/tac-gia/tac-pham/${story.id}/chinh-sua`);
  };


  const handleDeleteStory = (story: StoryItem) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tác phẩm "${story.title}" không?`)) {
      setStories((prev) => prev.filter((s) => s.id !== story.id));
      toast.info(`Đã xóa tác phẩm "${story.title}"`);
    }
  };

  const handleSubmitReview = (story: StoryItem) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id === story.id
          ? {
              ...s,
              status: "PENDING_REVIEW",
              rejectReason: undefined,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
    toast.success(`Đã gửi tác phẩm "${story.title}" tới ban biên tập để xét duyệt!`);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setVisibilityFilter("ALL");
    setSortBy("updatedAt");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-4 select-none">
        <Link href="/" className="hover:text-zinc-700 transition">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/ho-so" className="hover:text-zinc-700 transition">
          Tác giả
        </Link>
        <span>/</span>
        <span className="text-zinc-800 font-medium">Quản lý tác phẩm</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Quản lý tác phẩm
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Không gian sáng tác, theo dõi tương tác độc giả và quản lý danh sách tiểu thuyết của bạn.
          </p>
        </div>

        <Link
          href="/tac-gia/dang-ky"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-lg transition font-medium"
        >
          <svg className="w-3.5 h-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Xem hồ sơ tác giả</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Overview Statistics Cards */}
      <StoryStatsCards stories={stories} />

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

      {/* Story List */}
      {filteredStories.length > 0 ? (
        <div className="space-y-4">
          {filteredStories.map((story) => (
            <StoryCardItem
              key={story.id}
              story={story}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteStory}
              onSubmitReview={handleSubmitReview}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-zinc-200/80 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 mb-3">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            Không tìm thấy tác phẩm phù hợp
          </h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm">
            Không có truyện nào thỏa mãn từ khóa tìm kiếm hoặc bộ lọc hiện tại của bạn.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              + Thêm tác phẩm mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
