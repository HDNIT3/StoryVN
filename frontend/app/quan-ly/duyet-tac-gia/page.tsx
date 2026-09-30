"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authorRequestService } from "@/lib/services/author-request.service";
import type { AuthorRequestItem } from "@/types/author";
import { toast } from "@/lib/toast";

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
  isLoading: boolean;
}

export default function DuyetTacGiaPage() {
  const [items, setItems] = useState<AuthorRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal chi tiết
  const [detailRequest, setDetailRequest] = useState<AuthorRequestItem | null>(null);

  // Modal duyệt / từ chối
  const [reviewModal, setReviewModal] = useState<ReviewModalState>({
    open: false,
    request: null,
    action: null,
    adminNote: "",
    isLoading: false,
  });

  // Hàm tải dữ liệu danh sách yêu cầu
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (filter !== "ALL") params.status = filter;
      if (search.trim()) params.search = search.trim();

      const res = await authorRequestService.findAllRequests(params);
      if (res.success) {
        setItems(res.data.items);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.totalItems);
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải danh sách yêu cầu");
    } finally {
      setIsLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Xử lý mở modal xét duyệt
  const handleOpenReview = (request: AuthorRequestItem, action: "APPROVED" | "REJECTED") => {
    setReviewModal({
      open: true,
      request,
      action,
      adminNote: "",
      isLoading: false,
    });
  };

  const handleCloseReview = () => {
    setReviewModal({
      open: false,
      request: null,
      action: null,
      adminNote: "",
      isLoading: false,
    });
  };

  // Gửi API xét duyệt
  const handleSubmitReview = async () => {
    if (!reviewModal.request || !reviewModal.action) return;
    setReviewModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await authorRequestService.reviewRequest(
        reviewModal.request._id,
        {
          status: reviewModal.action,
          adminNote: reviewModal.adminNote.trim() || undefined,
        }
      );
      toast.success(res.message || "Xử lý thành công!");
      handleCloseReview();
      if (detailRequest?._id === reviewModal.request._id) {
        setDetailRequest(null);
      }
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Xử lý thất bại!");
      setReviewModal((prev) => ({ ...prev, isLoading: false }));
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
        onFilterChange={setFilter}
        totalItems={totalItems}
      />

      {/* Thanh tìm kiếm & Làm mới */}
      <AuthorRequestFilterBar
        search={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
        totalItems={totalItems}
        onRefresh={fetchData}
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
        isLoading={reviewModal.isLoading}
        onAdminNoteChange={(val) => setReviewModal((prev) => ({ ...prev, adminNote: val }))}
        onClose={handleCloseReview}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}
