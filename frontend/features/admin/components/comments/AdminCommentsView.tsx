"use client";

import React, { useState } from "react";
import {
  useAdminComments,
  useAdminCommentCounts,
  useUpdateCommentStatus,
  useDeleteCommentPermanent,
} from "../../queries/useAdminCommentQueries";
import type {
  AdminCommentItem,
  AdminCommentStatus,
  QueryAdminCommentsParams,
} from "../../types/comment.types";
import { CommentStatsCards } from "./CommentStatsCards";
import { CommentFilterBar, type CommentFilterTab } from "./CommentFilterBar";
import { CommentTable } from "./CommentTable";
import { CommentDetailModal } from "./CommentDetailModal";
import { AdminBarChart, AdminDonutChart } from "../charts";

export function AdminCommentsView() {
  const [tab, setTab] = useState<CommentFilterTab>("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [page, setPage] = useState(1);
  const [selectedComment, setSelectedComment] = useState<AdminCommentItem | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  const queryParams: QueryAdminCommentsParams = {
    page,
    limit: 15,
    sort,
  };

  if (tab !== "ALL") {
    queryParams.status = tab;
  }
  if (search.trim()) {
    queryParams.search = search.trim();
  }

  const {
    data: commentsData,
    isLoading,
    isRefetching,
    refetch: refetchComments,
  } = useAdminComments(queryParams);

  const {
    data: counts,
    isLoading: isLoadingCounts,
    refetch: refetchCounts,
  } = useAdminCommentCounts();

  const updateStatusMutation = useUpdateCommentStatus();
  const deleteMutation = useDeleteCommentPermanent();

  const comments = commentsData?.items ?? [];
  const pagination = commentsData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const handleRefresh = async () => {
    await Promise.all([refetchComments(), refetchCounts()]);
  };

  const handleTabChange = (newTab: CommentFilterTab) => {
    setTab(newTab);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleSortChange = (val: "NEWEST" | "OLDEST") => {
    setSort(val);
    setPage(1);
  };

  const handleUpdateStatus = (commentId: string, status: AdminCommentStatus) => {
    updateStatusMutation.mutate(
      { commentId, status },
      {
        onSuccess: (updated) => {
          if (selectedComment && selectedComment._id === commentId && updated?.data) {
            setSelectedComment(updated.data);
          }
        },
      }
    );
  };

  const handleDeletePermanent = (commentId: string) => {
    deleteMutation.mutate(commentId, {
      onSuccess: () => {
        if (selectedComment && selectedComment._id === commentId) {
          setSelectedComment(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quản lý bình luận
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kiểm duyệt, theo dõi và quản lý toàn bộ các bình luận trên hệ thống
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

      {/* Stats Cards */}
      <CommentStatsCards counts={counts} isLoading={isLoadingCounts} />

      {/* Khối biểu đồ phân tích bình luận */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminDonutChart
              title="Tỷ Lệ Trạng Thái Bình Luận"
              subtitle="Cơ cấu các bình luận hiển thị, bị ẩn hoặc đã xóa"
              data={[
                { id: "visible", name: "Đang hiển thị", value: counts?.visible ?? 0, color: "#10b981" },
                { id: "hidden", name: "Đang bị ẩn", value: counts?.hidden ?? 0, color: "#f59e0b" },
                { id: "deleted", name: "Đã xóa", value: counts?.deleted ?? 0, color: "#f43f5e" },
              ]}
              size={170}
              thickness={24}
              centerLabel="Tổng bình luận"
              centerValue={counts?.total ?? 0}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminBarChart
              title="Số Lượng Bình Luận"
              subtitle="Thống kê trực quan số lượng bình luận theo kiểm duyệt"
              data={[
                { label: "Hiển thị", value: counts?.visible ?? 0, color: "#10b981" },
                { label: "Bị ẩn", value: counts?.hidden ?? 0, color: "#f59e0b" },
                { label: "Đã xóa", value: counts?.deleted ?? 0, color: "#f43f5e" },
              ]}
              height={200}
              primaryLegend="Số lượng"
            />
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <CommentFilterBar
        currentTab={tab}
        onTabChange={handleTabChange}
        counts={counts}
        search={search}
        onSearchChange={handleSearchChange}
        sort={sort}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefetching}
      />

      {/* Table */}
      <CommentTable
        comments={comments}
        isLoading={isLoading}
        onViewDetail={(item) => setSelectedComment(item)}
        onUpdateStatus={handleUpdateStatus}
        onDeletePermanent={handleDeletePermanent}
        isUpdating={updateStatusMutation.isPending || deleteMutation.isPending}
      />

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 text-xs sm:text-sm text-slate-500">
          <p>
            Hiển thị trang <span className="font-bold text-slate-800">{page}</span> /{" "}
            <span className="font-bold text-slate-800">{totalPages}</span> (Tổng{" "}
            <span className="font-bold text-slate-800">{pagination.totalItems}</span> bản ghi)
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Trang trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <CommentDetailModal
        comment={selectedComment}
        isOpen={Boolean(selectedComment)}
        onClose={() => setSelectedComment(null)}
        onUpdateStatus={handleUpdateStatus}
        onDeletePermanent={handleDeletePermanent}
        isUpdating={updateStatusMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}

