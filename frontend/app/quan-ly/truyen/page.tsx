"use client";

import React, { useState } from "react";
import type { AdminStoryItem, StoryStatus, StoryVisibility } from "@/types/story";
import {
  useAdminStories,
  useAdminStoryCounts,
  useApproveStory,
  useRejectStory,
  useUnpublishStory,
  useHideStory,
  useUnhideStory,
} from "@/lib/hooks/queries/useAdminStoryQuery";

import {
  StoryStats,
  type StoryFilterTab,
} from "@/components/admin/stories/StoryStats";
import { StoryFilterBar } from "@/components/admin/stories/StoryFilterBar";
import { StoryTable } from "@/components/admin/stories/StoryTable";
import { StoryDetailModal } from "@/components/admin/stories/StoryDetailModal";
import {
  StoryActionModal,
  type StoryActionType,
} from "@/components/admin/stories/StoryActionModal";
import { StoryPagination } from "@/components/admin/stories/StoryPagination";

export default function QuanLyTruyenPage() {
  const [tab, setTab] = useState<StoryFilterTab>("PENDING_REVIEW");
  const [search, setSearch] = useState("");
  const [genreId, setGenreId] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);

  // Modal Chi tiết tác phẩm
  const [detailStory, setDetailStory] = useState<AdminStoryItem | null>(null);

  // Modal Xử lý lý do (Từ chối, Gỡ duyệt, Ẩn public)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    actionType: StoryActionType | null;
    story: AdminStoryItem | null;
  }>({
    isOpen: false,
    actionType: null,
    story: null,
  });

  // Query thống kê đếm số lượng Tab badge
  const { data: counts, refetch: refetchCounts } = useAdminStoryCounts();

  // Xác định query filter theo tab
  const statusFilter: StoryStatus | undefined =
    tab === "ALL" || tab === "HIDDEN" ? undefined : (tab as StoryStatus);
  const visibilityFilter: StoryVisibility | undefined =
    tab === "HIDDEN" ? "PRIVATE" : undefined;

  // Query danh sách tác phẩm
  const {
    data: storiesData,
    isLoading,
    isRefetching,
    refetch: refetchStories,
  } = useAdminStories({
    page,
    limit: 10,
    status: statusFilter,
    visibility: visibilityFilter,
    genreId: genreId || undefined,
    search: search.trim() || undefined,
    sortBy,
    sortOrder: "desc",
  });

  // Các mutations hành động
  const approveMutation = useApproveStory();
  const rejectMutation = useRejectStory();
  const unpublishMutation = useUnpublishStory();
  const hideMutation = useHideStory();
  const unhideMutation = useUnhideStory();

  const stories = storiesData?.items ?? [];
  const pagination = storiesData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  // Đổi tab
  const handleTabChange = (newTab: StoryFilterTab) => {
    setTab(newTab);
    setPage(1);
  };

  // Đổi tìm kiếm
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  // Đổi thể loại
  const handleGenreChange = (newGenreId: string) => {
    setGenreId(newGenreId);
    setPage(1);
  };

  // Làm mới dữ liệu
  const handleRefresh = async () => {
    await Promise.all([refetchStories(), refetchCounts()]);
  };

  // Mở modal hành động (REJECT, UNPUBLISH, HIDE)
  const handleOpenActionModal = (
    actionType: StoryActionType,
    story: AdminStoryItem
  ) => {
    setActionModal({
      isOpen: true,
      actionType,
      story,
    });
  };

  // Thực thi hành động từ chối / gỡ duyệt / ẩn
  const handleSubmitAction = async (reason: string) => {
    if (!actionModal.story || !actionModal.actionType) return;
    const storyId = actionModal.story._id;

    if (actionModal.actionType === "REJECT") {
      await rejectMutation.mutateAsync({ id: storyId, reason });
    } else if (actionModal.actionType === "UNPUBLISH") {
      await unpublishMutation.mutateAsync({ id: storyId, reason });
    } else if (actionModal.actionType === "HIDE") {
      await hideMutation.mutateAsync({ id: storyId, reason });
    }

    if (detailStory?._id === storyId) {
      setDetailStory(null);
    }
  };

  // Phê duyệt tác phẩm
  const handleApprove = async (story: AdminStoryItem) => {
    await approveMutation.mutateAsync(story._id);
    if (detailStory?._id === story._id) {
      setDetailStory(null);
    }
  };

  // Mở lại hiển thị công khai tác phẩm
  const handleUnhide = async (story: AdminStoryItem) => {
    await unhideMutation.mutateAsync(story._id);
    if (detailStory?._id === story._id) {
      setDetailStory(null);
    }
  };

  const isActionSubmitting =
    rejectMutation.isPending ||
    unpublishMutation.isPending ||
    hideMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Quản lý Truyện
            {counts && counts.pending > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {counts.pending} tác phẩm cần duyệt
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm duyệt tác phẩm mới, theo dõi trạng thái xuất bản, gỡ duyệt và quản lý hiển thị công khai.
          </p>
        </div>
      </div>

      {/* Tabs thống kê tương tác */}
      <StoryStats
        currentFilter={tab}
        onFilterChange={handleTabChange}
        counts={counts}
      />

      {/* Thanh tìm kiếm & Lọc thể loại & Sắp xếp */}
      <StoryFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        selectedGenreId={genreId}
        onGenreChange={handleGenreChange}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onRefresh={handleRefresh}
        isRefreshing={isRefetching}
      />

      {/* Bảng danh sách truyện */}
      <StoryTable
        stories={stories}
        isLoading={isLoading}
        onViewDetail={setDetailStory}
        onApprove={handleApprove}
        onReject={(story) => handleOpenActionModal("REJECT", story)}
        onUnpublish={(story) => handleOpenActionModal("UNPUBLISH", story)}
        onHide={(story) => handleOpenActionModal("HIDE", story)}
        onUnhide={handleUnhide}
      />

      {/* Phân trang */}
      <StoryPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Modal chi tiết tác phẩm */}
      <StoryDetailModal
        story={detailStory}
        isOpen={!!detailStory}
        onClose={() => setDetailStory(null)}
        onApprove={handleApprove}
        onReject={(story) => handleOpenActionModal("REJECT", story)}
        onUnpublish={(story) => handleOpenActionModal("UNPUBLISH", story)}
        onHide={(story) => handleOpenActionModal("HIDE", story)}
        onUnhide={handleUnhide}
      />

      {/* Modal nhập lý do Từ chối / Gỡ duyệt / Ẩn */}
      <StoryActionModal
        isOpen={actionModal.isOpen}
        actionType={actionModal.actionType}
        story={actionModal.story}
        onClose={() =>
          setActionModal({ isOpen: false, actionType: null, story: null })
        }
        onSubmit={handleSubmitAction}
        isSubmitting={isActionSubmitting}
      />
    </div>
  );
}
