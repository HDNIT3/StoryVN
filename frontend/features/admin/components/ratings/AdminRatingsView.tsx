"use client";

import React, { useState } from "react";
import {
  useAdminRatings,
  useAdminRatingCounts,
  useUpdateRatingStatus,
  useDeleteRatingPermanent,
} from "../../queries/useAdminRatingQueries";
import type {
  AdminRatingItem,
  AdminRatingStatus,
  QueryAdminRatingsParams,
} from "../../types/rating.types";
import { RatingStatsCards } from "./RatingStatsCards";
import { RatingFilterBar, type RatingFilterTab } from "./RatingFilterBar";
import { RatingTable } from "./RatingTable";
import { RatingDetailModal } from "./RatingDetailModal";

export function AdminRatingsView() {
  const [tab, setTab] = useState<RatingFilterTab>("ALL");
  const [selectedStar, setSelectedStar] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"NEWEST" | "OLDEST" | "HIGHEST" | "LOWEST">("NEWEST");
  const [page, setPage] = useState(1);
  const [selectedRating, setSelectedRating] = useState<AdminRatingItem | null>(null);

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
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Quản lý đánh giá truyện
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Theo dõi và kiểm duyệt các đánh giá sao và nhận xét của độc giả trên hệ thống
        </p>
      </div>

      {/* Stats Cards */}
      <RatingStatsCards counts={counts} isLoading={isLoadingCounts} />

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

