"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ChapterStatus } from "@/features/chapters";
import {
  type AdminChapterItem,
  useAdminChapters,
  useAdminChapterCounts,
  useApproveChapter,
  useRejectChapter,
  useUnpublishChapter,
  useHideChapter,
  useUnhideChapter,
  useResetPendingChapter,
  useAdminStories,
  ChapterStats,
  type ChapterFilterTab,
  ChapterFilterBar,
  ChapterTable,
  ChapterDetailModal,
  ChapterActionModal,
  type ChapterActionType,
  StoryPagination,
  AdminBarChart,
  AdminDonutChart,
} from "@/features/admin";

export const AdminChaptersView: React.FC = () => {
  const searchParams = useSearchParams();

  // Nhận storyId từ URL query param nếu có
  const initialStoryId = searchParams.get("storyId") || "";
  const initialTab = (searchParams.get("tab") as ChapterFilterTab) || "PENDING_REVIEW";

  const [tab, setTab] = useState<ChapterFilterTab>(initialTab);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(initialStoryId);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showCharts, setShowCharts] = useState(false);

  // Modal Chi tiết chương
  const [detailChapter, setDetailChapter] = useState<AdminChapterItem | null>(null);

  // Modal Xử lý lý do (Từ chối, Gỡ duyệt)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    actionType: ChapterActionType | null;
    chapter: AdminChapterItem | null;
  }>({
    isOpen: false,
    actionType: null,
    chapter: null,
  });

  // Query thống kê đếm số lượng Tab badge
  const { data: counts, refetch: refetchCounts } = useAdminChapterCounts(
    selectedStoryId || undefined
  );

  // Query danh sách truyện để nạp dropdown bộ lọc
  const { data: storiesData } = useAdminStories({
    page: 1,
    limit: 100,
    sortBy: "title",
    sortOrder: "asc",
  });
  const storyOptions =
    storiesData?.items?.map((s) => ({
      _id: s._id,
      title: s.title,
    })) || [];

  // Xác định query filter theo tab
  const statusFilter: ChapterStatus | undefined =
    tab === "ALL" ? undefined : (tab as ChapterStatus);

  // Query danh sách chương
  const {
    data: chaptersData,
    isLoading,
    isRefetching,
    refetch: refetchChapters,
  } = useAdminChapters({
    page,
    limit: 10,
    storyId: selectedStoryId || undefined,
    status: statusFilter,
    search: search.trim() || undefined,
    sortBy: sortBy as any,
    sortOrder,
  });

  // Các mutations hành động
  const approveMutation = useApproveChapter();
  const rejectMutation = useRejectChapter();
  const unpublishMutation = useUnpublishChapter();
  const hideMutation = useHideChapter();
  const unhideMutation = useUnhideChapter();
  const resetPendingMutation = useResetPendingChapter();

  const chapters = chaptersData?.items ?? [];
  const pagination = chaptersData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  // Xử lý đổi Tab
  const handleTabChange = (newTab: ChapterFilterTab) => {
    setTab(newTab);
    setPage(1);
  };

  // Xử lý đổi tìm kiếm
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  // Xử lý chọn truyện
  const handleStoryChange = (storyId: string) => {
    setSelectedStoryId(storyId);
    setPage(1);
  };

  // Xử lý sắp xếp
  const handleSortByChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setPage(1);
  };

  const handleSortOrderToggle = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  // Làm mới dữ liệu
  const handleRefresh = () => {
    refetchChapters();
    refetchCounts();
  };

  // Thao tác phê duyệt ngay
  const handleApprove = async (chapter: AdminChapterItem) => {
    await approveMutation.mutateAsync(chapter._id);
    if (detailChapter?._id === chapter._id) {
      setDetailChapter(null);
    }
  };

  // Thao tác chuyển chương bị từ chối quay lại chờ duyệt
  const handleResetPending = async (chapter: AdminChapterItem) => {
    await resetPendingMutation.mutateAsync(chapter._id);
    if (detailChapter?._id === chapter._id) {
      setDetailChapter(null);
    }
  };

  // Thao tác mở modal từ chối
  const handleOpenReject = (chapter: AdminChapterItem) => {
    setActionModal({
      isOpen: true,
      actionType: "REJECT",
      chapter,
    });
  };

  // Thao tác mở modal gỡ duyệt
  const handleOpenUnpublish = (chapter: AdminChapterItem) => {
    setActionModal({
      isOpen: true,
      actionType: "UNPUBLISH",
      chapter,
    });
  };

  // Thao tác mở modal ẩn chương
  const handleOpenHide = (chapter: AdminChapterItem) => {
    setActionModal({
      isOpen: true,
      actionType: "HIDE",
      chapter,
    });
  };

  // Thao tác mở lại chương bị ẩn
  const handleUnhide = async (chapter: AdminChapterItem) => {
    await unhideMutation.mutateAsync(chapter._id);
    if (detailChapter?._id === chapter._id) {
      setDetailChapter(null);
    }
  };

  // Xác nhận xử lý từ modal
  const handleActionSubmit = async (reason: string) => {
    if (!actionModal.chapter || !actionModal.actionType) return;
    const { actionType, chapter } = actionModal;

    if (actionType === "REJECT") {
      await rejectMutation.mutateAsync({ id: chapter._id, reason });
    } else if (actionType === "UNPUBLISH") {
      await unpublishMutation.mutateAsync({ id: chapter._id, reason });
    } else if (actionType === "HIDE") {
      await hideMutation.mutateAsync({ id: chapter._id, reason });
    }

    setActionModal({ isOpen: false, actionType: null, chapter: null });
    if (detailChapter?._id === chapter._id) {
      setDetailChapter(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Kiểm duyệt & Quản lý Chương</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Duyệt chương mới do tác giả đăng tải, kiểm tra nội dung và quản lý trạng thái xuất bản
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

      {/* Thống kê theo Tab trạng thái */}
      <ChapterStats
        currentFilter={tab}
        onFilterChange={handleTabChange}
        counts={counts}
      />

      {/* Khối biểu đồ phân tích chương */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminBarChart
              title="Phân Bổ Trạng Thái Chương"
              subtitle="Số lượng chương theo tiến trình xuất bản & kiểm duyệt"
              data={[
                { label: "Xuất bản", value: counts?.published ?? 0, color: "#10b981" },
                { label: "Chờ duyệt", value: counts?.pending ?? 0, color: "#f59e0b" },
                { label: "Từ chối", value: counts?.rejected ?? 0, color: "#f43f5e" },
                { label: "Bản nháp", value: counts?.draft ?? 0, color: "#94a3b8" },
              ]}
              height={200}
              primaryLegend="Số lượng chương"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminDonutChart
              title="Cơ Cấu Kiểm Duyệt Chương"
              subtitle="Tỷ lệ phần trăm các chương trên hệ thống"
              data={[
                { id: "published", name: "Đã xuất bản", value: counts?.published ?? 0, color: "#10b981" },
                { id: "pending", name: "Chờ duyệt", value: counts?.pending ?? 0, color: "#f59e0b" },
                { id: "rejected", name: "Bị từ chối", value: counts?.rejected ?? 0, color: "#f43f5e" },
                { id: "draft", name: "Bản nháp", value: counts?.draft ?? 0, color: "#94a3b8" },
              ]}
              size={170}
              thickness={24}
              centerLabel="Tổng chương"
              centerValue={counts?.all || 0}
            />
          </div>
        </div>
      )}

      {/* Thanh lọc, tìm kiếm, sắp xếp */}
      <ChapterFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        selectedStoryId={selectedStoryId}
        onStoryChange={handleStoryChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortOrder={sortOrder}
        onSortOrderToggle={handleSortOrderToggle}
        storyOptions={storyOptions}
        onRefresh={handleRefresh}
        isRefreshing={isRefetching}
      />

      {/* Bảng danh sách chương */}
      <ChapterTable
        chapters={chapters}
        isLoading={isLoading}
        onViewDetail={(c) => setDetailChapter(c)}
        onApprove={handleApprove}
        onReject={handleOpenReject}
        onUnpublish={handleOpenUnpublish}
        onHide={handleOpenHide}
        onUnhide={handleUnhide}
        onResetPending={handleResetPending}
      />

      {/* Phân trang */}
      <StoryPagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />

      {/* Modal Xem nội dung chi tiết & Đọc thử chương */}
      <ChapterDetailModal
        chapter={detailChapter}
        isOpen={Boolean(detailChapter)}
        onClose={() => setDetailChapter(null)}
        onApprove={handleApprove}
        onReject={handleOpenReject}
        onUnpublish={handleOpenUnpublish}
        onHide={handleOpenHide}
        onUnhide={handleUnhide}
        onResetPending={handleResetPending}
      />

      {/* Modal Nhập lý do (Từ chối, Gỡ duyệt) */}
      <ChapterActionModal
        isOpen={actionModal.isOpen}
        actionType={actionModal.actionType}
        chapter={actionModal.chapter}
        onClose={() =>
          setActionModal({ isOpen: false, actionType: null, chapter: null })
        }
        onSubmit={handleActionSubmit}
        isSubmitting={rejectMutation.isPending || unpublishMutation.isPending}
      />
    </div>
  );
};
