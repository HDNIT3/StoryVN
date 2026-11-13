"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import {
  useAdminCoinPackages,
  useCreateCoinPackage,
  useUpdateCoinPackage,
  useToggleCoinPackageStatus,
  useDeleteCoinPackage,
  useSeedCoinPackages,
} from "@/features/coin-packages/queries/useCoinPackageQueries";
import type {
  CoinPackageItem,
  CreateCoinPackagePayload,
  UpdateCoinPackagePayload,
} from "@/features/coin-packages/types";
import { AdminStatCard } from "@/features/admin/components/common/AdminStatCard";
import { AdminBarChart } from "../charts";
import { CoinPackageFilterBar } from "./CoinPackageFilterBar";
import { CoinPackageTable } from "./CoinPackageTable";
import { CoinPackageFormModal } from "./CoinPackageFormModal";
import { CoinPackageDeleteModal } from "./CoinPackageDeleteModal";

export function AdminCoinPackagesView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [featuredFilter, setFeaturedFilter] = useState<"ALL" | "FEATURED" | "NORMAL">("ALL");
  const [showCharts, setShowCharts] = useState(false);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<CoinPackageItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pkgToDelete, setPkgToDelete] = useState<CoinPackageItem | null>(null);

  // Status toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isActiveParam =
    statusFilter === "ACTIVE" ? true : statusFilter === "INACTIVE" ? false : undefined;
  const isFeaturedParam =
    featuredFilter === "FEATURED" ? true : featuredFilter === "NORMAL" ? false : undefined;

  // Query dữ liệu bảng chính
  const { data, isLoading } = useAdminCoinPackages({
    page,
    limit: 10,
    search: search.trim() || undefined,
    isActive: isActiveParam,
    isFeatured: isFeaturedParam,
    sortBy: "sortOrder",
    sortOrder: "asc",
  });

  // Query tất cả gói để tính StatCards
  const { data: allData } = useAdminCoinPackages({
    all: true,
  });

  const createMutation = useCreateCoinPackage();
  const updateMutation = useUpdateCoinPackage();
  const toggleStatusMutation = useToggleCoinPackageStatus();
  const deleteMutation = useDeleteCoinPackage();
  const seedMutation = useSeedCoinPackages();

  const items = data?.items ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const allItems = allData?.items ?? items;

  const totalPackages = allItems.length;
  const activeCount = allItems.filter((p) => p.isActive).length;
  const featuredCount = allItems.filter((p) => p.isFeatured).length;
  const inactiveCount = allItems.filter((p) => !p.isActive).length;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (status: "ALL" | "ACTIVE" | "INACTIVE") => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleFeaturedFilterChange = (featured: "ALL" | "FEATURED" | "NORMAL") => {
    setFeaturedFilter(featured);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setFeaturedFilter("ALL");
    setPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedPkg(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (pkg: CoinPackageItem) => {
    setSelectedPkg(pkg);
    setFormModalOpen(true);
  };

  const handleOpenDelete = (pkg: CoinPackageItem) => {
    setPkgToDelete(pkg);
    setDeleteModalOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setTogglingId(id);
      await toggleStatusMutation.mutateAsync(id);
    } finally {
      setTogglingId(null);
    }
  };

  const handleFormSubmit = async (formData: CreateCoinPackagePayload | UpdateCoinPackagePayload) => {
    if (selectedPkg) {
      await updateMutation.mutateAsync({
        id: selectedPkg._id,
        payload: formData,
      });
    } else {
      await createMutation.mutateAsync(formData as CreateCoinPackagePayload);
    }
    setFormModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!pkgToDelete) return;
    await deleteMutation.mutateAsync(pkgToDelete._id);
    setDeleteModalOpen(false);
    setPkgToDelete(null);
  };

  const handleSeed = async () => {
    if (confirm("Khởi tạo danh sách các gói nạp mẫu mặc định?")) {
      await seedMutation.mutateAsync();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="text-amber-500">🪙</span> Quản lý gói nạp Xu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cấu hình danh sách các gói nạp Xu, số Xu cơ bản, Xu khuyến mãi và bảng giá VND.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCharts(!showCharts)}
            className="text-xs px-3.5 py-2 font-semibold text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 border-indigo-200"
          >
            {showCharts ? "Ẩn biểu đồ" : "Biểu đồ so sánh"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleSeed}
            disabled={seedMutation.isPending}
            className="text-xs px-3.5 py-2 font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
            title="Tạo nhanh 6 gói nạp chuẩn mẫu nếu chưa có"
          >
            {seedMutation.isPending ? "Đang tạo..." : "⚡ Nạp mẫu"}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleOpenCreate}
            className="text-xs px-4 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm gói nạp</span>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AdminStatCard
          label="Tổng số gói nạp"
          value={totalPackages}
          color="border-indigo-100 text-indigo-700"
          icon={
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <AdminStatCard
          label="Đang kích hoạt"
          value={activeCount}
          color="border-emerald-100 text-emerald-700"
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <AdminStatCard
          label="Gói nổi bật (Hot)"
          value={featuredCount}
          color="border-amber-100 text-amber-700"
          icon={
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />

        <AdminStatCard
          label="Đang ẩn"
          value={inactiveCount}
          color="border-slate-200 text-slate-600"
          icon={
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          }
        />
      </div>

      {/* Biểu đồ so sánh mệnh giá & Xu thưởng các gói */}
      {showCharts && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs animate-in fade-in duration-300">
          <AdminBarChart
            title="So Sánh Lượng Xu Cơ Bản & Xu Khuyến Mãi Các Gói"
            subtitle="Tỷ lệ khuyến mãi kích cầu theo từng mức giá gói nạp"
            data={allItems.map((p) => ({
              label: p.name,
              value: p.coinAmount,
              secondaryValue: p.bonusCoin,
              tooltipTitle: `${p.name} - Giá: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.price)}`,
            }))}
            height={220}
            barColor="#6366f1"
            secondaryBarColor="#f59e0b"
            primaryLegend="Xu cơ bản"
            secondaryLegend="Xu thưởng"
            valueSuffix=" Xu"
          />
        </div>
      )}

      {/* Filter Bar */}
      <CoinPackageFilterBar
        search={search}
        statusFilter={statusFilter}
        featuredFilter={featuredFilter}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onFeaturedFilterChange={handleFeaturedFilterChange}
        onReset={handleResetFilters}
      />

      {/* Data Table */}
      <CoinPackageTable
        items={items}
        isLoading={isLoading}
        page={page}
        limit={10}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onToggleStatus={handleToggleStatus}
        isTogglingId={togglingId}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-2 text-xs text-slate-500">
          <div>
            Trang <span className="font-semibold text-slate-800">{page}</span> /{" "}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              ← Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const isCurrent = p === page;
                return (
                  <React.Fragment key={p}>
                    {prev && p - prev > 1 && (
                      <span className="px-1 text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              Sau →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CoinPackageFormModal
        open={formModalOpen}
        pkg={selectedPkg}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <CoinPackageDeleteModal
        open={deleteModalOpen}
        pkg={pkgToDelete}
        isLoading={deleteMutation.isPending}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default AdminCoinPackagesView;
