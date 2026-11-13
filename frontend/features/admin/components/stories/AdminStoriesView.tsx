"use client";

import React, { useState } from "react";
import type { StoryStatus, StoryVisibility } from "@/features/stories";
import {
  type AdminStoryItem,
  useAdminStories,
  useAdminStoryCounts,
  useApproveStory,
  useRejectStory,
  useUnpublishStory,
  useHideStory,
  useUnhideStory,
  StoryStats,
  type StoryFilterTab,
  StoryFilterBar,
  StoryTable,
  StoryDetailModal,
  StoryActionModal,
  type StoryActionType,
  StoryPagination,
  useAdminDashboardOverview,
  AdminBarChart,
  AdminDonutChart,
} from "@/features/admin";

export const AdminStoriesView: React.FC = () => {
  const [tab, setTab] = useState<StoryFilterTab>("PENDING_REVIEW");
  const [search, setSearch] = useState("");
  const [genreId, setGenreId] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [showCharts, setShowCharts] = useState(false);

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
  const { data: dashboardData } = useAdminDashboardOverview(14);

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
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Quản lý Truyện
            {counts && counts.pending > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {counts.pending} tác phẩm cần duyệt
              </span>
            )}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Kiểm duyệt tác phẩm mới, theo dõi trạng thái xuất bản, gỡ duyệt và quản lý hiển thị công khai.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCharts(!showCharts)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>{showCharts ? "Ẩn biểu đồ" : "Biểu đồ phân tích"}</span>
        </button>
      </div>

      {/* Tabs thống kê tương tác */}
      <StoryStats
        currentFilter={tab}
        onFilterChange={handleTabChange}
        counts={counts}
      />

      {/* Khối biểu đồ phân tích khi mở */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminDonutChart
              title="Phân Bổ Thể Loại Tác Phẩm"
              subtitle="Cơ cấu truyện theo các danh mục thể loại"
              data={(dashboardData?.charts.categories || []).map((c) => ({
                id: c.id,
                name: c.name,
                value: c.count,
                percentage: c.percentage,
              }))}
              size={170}
              thickness={24}
              centerLabel="Tổng truyện"
              centerValue={counts?.all || 0}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminBarChart
              title="Trạng Thái Kiểm Duyệt & Xuất Bản"
              subtitle="Số lượng truyện theo từng trạng thái kiểm duyệt"
              data={[
                { label: "Xuất bản", value: counts?.published ?? 0, color: "#10b981" },
                { label: "Chờ duyệt", value: counts?.pending ?? 0, color: "#f59e0b" },
                { label: "Từ chối", value: counts?.rejected ?? 0, color: "#f43f5e" },
                { label: "Bị ẩn", value: counts?.hidden ?? 0, color: "#8b5cf6" },
                { label: "Bản nháp", value: counts?.draft ?? 0, color: "#94a3b8" },
              ]}
              height={200}
              primaryLegend="Số lượng truyện"
            />
          </div>
        </div>
      )}

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
};
