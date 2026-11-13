"use client";

import React, { useState } from "react";
import {
  type AuthorRequestItem,
  useAdminAuthorRequests,
  useReviewAuthorRequest,
  AuthorRequestStats,
  type FilterStatus,
  AuthorRequestFilterBar,
  AuthorRequestTable,
  AuthorRequestDetailModal,
  AuthorRequestReviewModal,
  AuthorRequestPagination,
  AdminBarChart,
  AdminDonutChart,
} from "@/features/admin";

interface ReviewModalState {
  open: boolean;
  request: AuthorRequestItem | null;
  action: "APPROVED" | "REJECTED" | null;
  adminNote: string;
}

export const AdminAuthorRequestsView: React.FC = () => {
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCharts, setShowCharts] = useState(false);

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
  const { data, isLoading, refetch } = useAdminAuthorRequests({
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Duyệt yêu cầu nâng cấp Tác giả
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xét duyệt hồ sơ và đơn đăng ký trở thành tác giả truyện trên StoryVN
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

      {/* Thẻ thống kê & chọn bộ lọc */}
      <AuthorRequestStats
        currentFilter={filter}
        onFilterChange={handleFilterChange}
        totalItems={totalItems}
        counts={data?.counts}
      />

      {/* Khối biểu đồ phân tích yêu cầu duyệt */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminDonutChart
              title="Tỷ Lệ Xét Duyệt Tác Giả"
              subtitle="Cơ cấu các hồ sơ đã duyệt, đang chờ và từ chối"
              data={[
                { id: "approved", name: "Đã phê duyệt", value: data?.counts?.approved ?? 0, color: "#10b981" },
                { id: "pending", name: "Chờ xét duyệt", value: data?.counts?.pending ?? 0, color: "#f59e0b" },
                { id: "rejected", name: "Đã từ chối", value: data?.counts?.rejected ?? 0, color: "#f43f5e" },
              ]}
              size={170}
              thickness={24}
              centerLabel="Tổng hồ sơ"
              centerValue={data?.counts?.all ?? totalItems}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminBarChart
              title="Số Lượng Hồ Sơ Theo Trạng Thái"
              subtitle="Thống kê số lượng hồ sơ nộp vào hệ thống"
              data={[
                { label: "Đã duyệt", value: data?.counts?.approved ?? 0, color: "#10b981" },
                { label: "Chờ duyệt", value: data?.counts?.pending ?? 0, color: "#f59e0b" },
                { label: "Bị từ chối", value: data?.counts?.rejected ?? 0, color: "#f43f5e" },
              ]}
              height={200}
              primaryLegend="Số lượng hồ sơ"
            />
          </div>
        </div>
      )}

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
};
