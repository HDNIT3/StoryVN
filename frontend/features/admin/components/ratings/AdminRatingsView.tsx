"use client";

import React, { useState } from "react";
import {
  useAdminRatings,
  useAdminRatingCounts,
  useUpdateRatingStatus,
  useDeleteRatingPermanent,
} from "../../queries/useAdminRatingQueries";
import { useAdminDashboardOverview } from "../../queries/useAdminDashboardQueries";
import type {
  AdminRatingItem,
  AdminRatingStatus,
  QueryAdminRatingsParams,
} from "../../types/rating.types";
import { RatingStatsCards } from "./RatingStatsCards";
import { RatingFilterBar, type RatingFilterTab } from "./RatingFilterBar";
import { RatingTable } from "./RatingTable";
import { RatingDetailModal } from "./RatingDetailModal";
import { AdminBarChart, AdminDonutChart } from "../charts";

export function AdminRatingsView() {
  const [tab, setTab] = useState<RatingFilterTab>("ALL");
  const [selectedStar, setSelectedStar] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"NEWEST" | "OLDEST" | "HIGHEST" | "LOWEST">("NEWEST");
  const [page, setPage] = useState(1);
  const [selectedRating, setSelectedRating] = useState<AdminRatingItem | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  const queryParams: QueryAdminRatingsParams = {
    page,
    limit: 15,
    sort,
  };

  if (tab !== "ALL") {
    queryParams.status = tab;
  }
  if (selectedStar) {
    queryParams.rating = selectedStar;
  }
  if (search.trim()) {
    queryParams.search = search.trim();
  }

  const {
    data: ratingsData,
    isLoading,
    isRefetching,
    refetch: refetchRatings,
  } = useAdminRatings(queryParams);

  const {
    data: counts,
    isLoading: isLoadingCounts,
    refetch: refetchCounts,
  } = useAdminRatingCounts();

  const { data: dashboardData } = useAdminDashboardOverview(14);

  const updateStatusMutation = useUpdateRatingStatus();
  const deleteMutation = useDeleteRatingPermanent();

  const ratings = ratingsData?.items ?? [];
  const pagination = ratingsData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const handleRefresh = async () => {
    await Promise.all([refetchRatings(), refetchCounts()]);
  };

  const handleTabChange = (newTab: RatingFilterTab) => {
    setTab(newTab);
    setPage(1);
  };

  const handleStarChange = (star?: number) => {
    setSelectedStar(star);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleSortChange = (val: "NEWEST" | "OLDEST" | "HIGHEST" | "LOWEST") => {
    setSort(val);
    setPage(1);
  };

  const handleUpdateStatus = (ratingId: string, status: AdminRatingStatus) => {
    updateStatusMutation.mutate(
      { ratingId, status },
      {
        onSuccess: (updated) => {
          if (selectedRating && selectedRating._id === ratingId && updated?.data) {
            setSelectedRating(updated.data);
          }
        },
      }
    );
  };

  const handleDeletePermanent = (ratingId: string) => {
    deleteMutation.mutate(ratingId, {
      onSuccess: () => {
        if (selectedRating && selectedRating._id === ratingId) {
          setSelectedRating(null);
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
            Quản lý đánh giá truyện
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi và kiểm duyệt các đánh giá sao và nhận xét của độc giả trên hệ thống
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
      <RatingStatsCards counts={counts} isLoading={isLoadingCounts} />

      {/* Khối biểu đồ phân bố sao đánh giá */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminBarChart
              title="Phân Bổ Thang Điểm Đánh Giá (1 - 5 Sao)"
              subtitle="Số lượng lượt đánh giá từ độc giả theo số sao"
              data={[
                { label: "5 Sao ★", value: dashboardData?.charts.ratings?.[5] ?? 0, color: "#10b981" },
                { label: "4 Sao ★", value: dashboardData?.charts.ratings?.[4] ?? 0, color: "#06b6d4" },
                { label: "3 Sao ★", value: dashboardData?.charts.ratings?.[3] ?? 0, color: "#f59e0b" },
                { label: "2 Sao ★", value: dashboardData?.charts.ratings?.[2] ?? 0, color: "#fb923c" },
                { label: "1 Sao ★", value: dashboardData?.charts.ratings?.[1] ?? 0, color: "#f43f5e" },
              ]}
              height={200}
              primaryLegend="Số lượt đánh giá"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminDonutChart
              title="Cơ Cấu Kiểm Duyệt Đánh Giá"
              subtitle="Trạng thái hiển thị và kiểm duyệt phản hồi"
              data={[
                { id: "visible", name: "Đang hiển thị", value: counts?.visible ?? 0, color: "#10b981" },
                { id: "hidden", name: "Đang bị ẩn", value: counts?.hidden ?? 0, color: "#f59e0b" },
                { id: "deleted", name: "Đã xóa", value: counts?.deleted ?? 0, color: "#f43f5e" },
              ]}
              size={170}
              thickness={24}
              centerLabel="Tổng đánh giá"
              centerValue={counts?.total ?? 0}
            />
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <RatingFilterBar
        currentTab={tab}
        onTabChange={handleTabChange}
        counts={counts}
        selectedStar={selectedStar}
        onStarChange={handleStarChange}
        search={search}
        onSearchChange={handleSearchChange}
        sort={sort}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefetching}
      />

      {/* Table */}
      <RatingTable
        ratings={ratings}
        isLoading={isLoading}
        onViewDetail={(item) => setSelectedRating(item)}
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
      <RatingDetailModal
        rating={selectedRating}
        isOpen={Boolean(selectedRating)}
        onClose={() => setSelectedRating(null)}
        onUpdateStatus={handleUpdateStatus}
        onDeletePermanent={handleDeletePermanent}
        isUpdating={updateStatusMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}

