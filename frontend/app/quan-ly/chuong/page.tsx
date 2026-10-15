"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { AdminChapterItem, ChapterStatus } from "@/types/chapter";
import {
  useAdminChapters,
  useAdminChapterCounts,
  useApproveChapter,
  useRejectChapter,
  useUnpublishChapter,
} from "@/lib/hooks/queries/useAdminChapterQuery";
import { useAdminStories } from "@/lib/hooks/queries/useAdminStoryQuery";
import {
  ChapterStats,
  type ChapterFilterTab,
} from "@/components/admin/chapters/ChapterStats";
import { ChapterFilterBar } from "@/components/admin/chapters/ChapterFilterBar";
import { ChapterTable } from "@/components/admin/chapters/ChapterTable";
import { ChapterDetailModal } from "@/components/admin/chapters/ChapterDetailModal";
import {
  ChapterActionModal,
  type ChapterActionType,
} from "@/components/admin/chapters/ChapterActionModal";
import { StoryPagination } from "@/components/admin/stories/StoryPagination";

function QuanLyChuongContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Nhận storyId từ URL query param nếu có (ví dụ từ trang Quản lý truyện click sang)
  const initialStoryId = searchParams.get("storyId") || "";
  const initialTab = (searchParams.get("tab") as ChapterFilterTab) || "PENDING_REVIEW";

  const [tab, setTab] = useState<ChapterFilterTab>(initialTab);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(initialStoryId);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

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

  // Xác nhận xử lý từ modal
  const handleActionSubmit = async (reason: string) => {
    if (!actionModal.chapter || !actionModal.actionType) return;
    const { actionType, chapter } = actionModal;

    if (actionType === "REJECT") {
      await rejectMutation.mutateAsync({ id: chapter._id, reason });
    } else if (actionType === "UNPUBLISH") {
      await unpublishMutation.mutateAsync({ id: chapter._id, reason });
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
            <span className="text-xs px-2.5 py-0.5 font-bold rounded-full bg-sky-100 text-sky-700">
              Admin / Manager
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Duyệt chương mới do tác giả đăng tải, kiểm tra nội dung và quản lý trạng thái xuất bản
          </p>
        </div>
      </div>

      {/* Thống kê theo Tab trạng thái */}
      <ChapterStats
        currentFilter={tab}
        onFilterChange={handleTabChange}
        counts={counts}
      />

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
}

export default function QuanLyChuongPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky-500 border-t-transparent" />
          <p className="mt-2 text-sm text-slate-500">Đang tải trang quản lý chương...</p>
        </div>
      }
    >
      <QuanLyChuongContent />
    </Suspense>
  );
}
