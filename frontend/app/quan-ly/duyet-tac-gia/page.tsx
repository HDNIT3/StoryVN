"use client";

import React, { useState } from "react";
import type { AuthorRequestItem } from "@/types/author";
import {
  useAdminAuthorRequests,
  useReviewAuthorRequest,
} from "@/lib/hooks/queries/useAdminQuery";

import {
  AuthorRequestStats,
  FilterStatus,
} from "@/components/admin/author-requests/AuthorRequestStats";
import { AuthorRequestFilterBar } from "@/components/admin/author-requests/AuthorRequestFilterBar";
import { AuthorRequestTable } from "@/components/admin/author-requests/AuthorRequestTable";
import { AuthorRequestDetailModal } from "@/components/admin/author-requests/AuthorRequestDetailModal";
import { AuthorRequestReviewModal } from "@/components/admin/author-requests/AuthorRequestReviewModal";
import { AuthorRequestPagination } from "@/components/admin/author-requests/AuthorRequestPagination";

interface ReviewModalState {
  open: boolean;
  request: AuthorRequestItem | null;
  action: "APPROVED" | "REJECTED" | null;
  adminNote: string;
}

export default function DuyetTacGiaPage() {
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal chi tiết
  const [detailRequest, setDetailRequest] = useState<AuthorRequestItem | null>(null);

  // Modal duyệt / từ chối
  const [reviewModal, setReviewModal] = useState<ReviewModalState>({
    open: false,
    request: null,
    action: null,
    adminNote: "",
  });

  // Query lấy danh sách yêu cầu với TanStack Query
  const { data, isLoading, isPlaceholderData, refetch } = useAdminAuthorRequests({
    page,
    limit: 10,
    status: filter !== "ALL" ? filter : undefined,
    search: search.trim() || undefined,
  });

  // Mutation duyệt/từ chối
  const reviewMutation = useReviewAuthorRequest();

  const items = data?.items ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalItems = data?.pagination?.totalItems ?? 0;

  // Xử lý đổi filter hoặc search -> reset về trang 1
  const handleFilterChange = (newFilter: FilterStatus) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  // Xử lý mở modal xét duyệt
  const handleOpenReview = (request: AuthorRequestItem, action: "APPROVED" | "REJECTED") => {
    setReviewModal({
      open: true,
      request,
      action,
      adminNote: "",
    });
  };

  const handleCloseReview = () => {
    setReviewModal({
      open: false,
      request: null,
      action: null,
      adminNote: "",
    });
  };

  // Gửi API xét duyệt
  const handleSubmitReview = async () => {
    if (!reviewModal.request || !reviewModal.action) return;
    try {
      await reviewMutation.mutateAsync({
        id: reviewModal.request._id,
        status: reviewModal.action,
        adminNote: reviewModal.adminNote,
      });
      handleCloseReview();
      if (detailRequest?._id === reviewModal.request._id) {
        setDetailRequest(null);
      }
    } catch {
      // Error handled by mutation onError
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Duyệt yêu cầu nâng cấp Tác giả
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Xét duyệt hồ sơ và đơn đăng ký trở thành tác giả truyện trên StoryVN
        </p>
      </div>

      {/* Thẻ thống kê & chọn bộ lọc */}
      <AuthorRequestStats
        currentFilter={filter}
        onFilterChange={handleFilterChange}
        totalItems={totalItems}
      />

      {/* Thanh tìm kiếm & Làm mới */}
      <AuthorRequestFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        totalItems={totalItems}
        onRefresh={() => refetch()}
      />

      {/* Bảng dữ liệu danh sách */}
      <AuthorRequestTable
        items={items}
        isLoading={isLoading}
        onViewDetail={setDetailRequest}
        onOpenReview={handleOpenReview}
      />

      {/* Phân trang */}
      <AuthorRequestPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Modal xem chi tiết */}
      <AuthorRequestDetailModal
        request={detailRequest}
        onClose={() => setDetailRequest(null)}
        onOpenReview={handleOpenReview}
      />

      {/* Modal xác nhận duyệt / từ chối */}
      <AuthorRequestReviewModal
        open={reviewModal.open}
        request={reviewModal.request}
        action={reviewModal.action}
        adminNote={reviewModal.adminNote}
        isLoading={reviewMutation.isPending}
        onAdminNoteChange={(val) => setReviewModal((prev) => ({ ...prev, adminNote: val }))}
        onClose={handleCloseReview}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}

