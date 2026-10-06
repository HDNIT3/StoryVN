"use client";

import React, { useState } from "react";
import type { AdminStoryItem } from "@/types/story";
import {
  useAdminStories,
  useAdminStoryStats,
  useReviewStory,
} from "@/lib/hooks/queries/useAdminStoryQuery";
import {
  StoryReviewStats,
  type StoryFilterStatus,
} from "@/components/admin/story-review/StoryReviewStats";
import { StoryReviewFilterBar } from "@/components/admin/story-review/StoryReviewFilterBar";
import { StoryReviewTable } from "@/components/admin/story-review/StoryReviewTable";
import { StoryReviewDetailModal } from "@/components/admin/story-review/StoryReviewDetailModal";
import { StoryReviewConfirmModal } from "@/components/admin/story-review/StoryReviewConfirmModal";
import { StoryReviewPagination } from "@/components/admin/story-review/StoryReviewPagination";

interface ReviewModalState {
  open: boolean;
  story: AdminStoryItem | null;
  action: "APPROVED" | "REJECTED" | null;
  rejectReason: string;
}

export default function QuanLyTruyenPage() {
  const [filter, setFilter] = useState<StoryFilterStatus>("PENDING_REVIEW");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal xem chi tiết tác phẩm (Luồng 2)
  const [detailStory, setDetailStory] = useState<AdminStoryItem | null>(null);

  // Modal xác nhận duyệt / từ chối (Luồng 3 & 3.1)
  const [reviewModal, setReviewModal] = useState<ReviewModalState>({
    open: false,
    story: null,
    action: null,
    rejectReason: "",
  });

  // Query thống kê số lượng
  const { data: stats, isLoading: isStatsLoading } = useAdminStoryStats();

  // Query lấy danh sách tác phẩm theo bộ lọc
  const statusParam =
    filter === "APPEALED"
      ? "PENDING_REVIEW"
      : filter;

  const hasAppealParam = filter === "APPEALED" ? true : undefined;

  const { data, isLoading, refetch } = useAdminStories({
    page,
    limit: 10,
    status: statusParam,
    hasAppeal: hasAppealParam,
    search: search.trim() || undefined,
  });

  // Mutation Phê duyệt / Từ chối
  const reviewMutation = useReviewStory();

  const items = data?.items ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalItems = data?.pagination?.totalItems ?? 0;

  // Xử lý đổi bộ lọc
  const handleFilterChange = (newFilter: StoryFilterStatus) => {
    setFilter(newFilter);
    setPage(1);
  };

  // Xử lý tìm kiếm
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  // Mở modal duyệt / từ chối
  const handleOpenReview = (
    story: AdminStoryItem,
    action: "APPROVED" | "REJECTED"
  ) => {
    setReviewModal({
      open: true,
      story,
      action,
      rejectReason: "",
    });
  };

  const handleCloseReview = () => {
    setReviewModal({
      open: false,
      story: null,
      action: null,
      rejectReason: "",
    });
  };

  // Gửi quyết định phê duyệt / từ chối lên backend
  const handleSubmitReview = async () => {
    if (!reviewModal.story || !reviewModal.action) return;

    try {
      await reviewMutation.mutateAsync({
        id: reviewModal.story._id,
        action: reviewModal.action,
        rejectReason: reviewModal.rejectReason,
      });

      handleCloseReview();

      // Đóng modal chi tiết nếu đang mở truyện này
      if (detailStory?._id === reviewModal.story._id) {
        setDetailStory(null);
      }
    } catch {
      // Lỗi đã được xử lý hiển thị toast trong useReviewStory mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Kiểm duyệt & Quản lý Tác phẩm
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Thẩm định nội dung, văn án, thể loại và ảnh bìa truyện do tác giả gửi lên trước khi xuất bản công khai
        </p>
      </div>

      {/* Thẻ thống kê & Bộ lọc trạng thái */}
      <StoryReviewStats
        currentFilter={filter}
        onFilterChange={handleFilterChange}
        stats={stats}
        isLoading={isStatsLoading}
      />

      {/* Thanh tìm kiếm & Làm mới */}
      <StoryReviewFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        totalItems={totalItems}
        onRefresh={() => refetch()}
      />

      {/* Bảng danh sách tác phẩm */}
      <StoryReviewTable
        items={items}
        isLoading={isLoading}
        onViewDetail={setDetailStory}
        onOpenReview={handleOpenReview}
      />

      {/* Phân trang */}
      <StoryReviewPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Modal thẩm định chi tiết tác phẩm (Luồng 2) */}
      <StoryReviewDetailModal
        story={detailStory}
        onClose={() => setDetailStory(null)}
        onOpenReview={handleOpenReview}
      />

      {/* Modal xác nhận Phê duyệt hoặc Từ chối kèm lý do (Luồng 3 & 3.1) */}
      <StoryReviewConfirmModal
        open={reviewModal.open}
        story={reviewModal.story}
        action={reviewModal.action}
        rejectReason={reviewModal.rejectReason}
        isLoading={reviewMutation.isPending}
        onRejectReasonChange={(val) =>
          setReviewModal((prev) => ({ ...prev, rejectReason: val }))
        }
        onClose={handleCloseReview}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}
