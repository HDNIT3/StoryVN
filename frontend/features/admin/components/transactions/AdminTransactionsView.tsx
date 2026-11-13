"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAdminTransactions } from "@/features/admin/queries/useAdminTransactionQueries";
import { useAdminDashboardOverview } from "@/features/admin/queries/useAdminDashboardQueries";
import { AdminStatCard } from "@/features/admin/components/common/AdminStatCard";
import { AdminAreaChart, AdminDonutChart, type AreaChartDataPoint, type DonutSegment } from "../charts";
import type { AdminTransactionItem, TransactionStatus } from "@/features/payments";
import { TransactionFilterBar } from "./TransactionFilterBar";
import { TransactionTable } from "./TransactionTable";
import { TransactionDetailModal } from "./TransactionDetailModal";

export function AdminTransactionsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [selectedTx, setSelectedTx] = useState<AdminTransactionItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  const { data, isLoading, refetch } = useAdminTransactions({
    page,
    limit: 10,
    search: search.trim() || undefined,
    status: status || undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: dashboardData } = useAdminDashboardOverview(14);

  const items = data?.items || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const stats = data?.stats || {
    totalRevenue: 0,
    totalTransactions: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalCoinSold: 0,
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val: TransactionStatus | "") => {
    setStatus(val);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  const handleViewDetail = (tx: AdminTransactionItem) => {
    setSelectedTx(tx);
    setModalOpen(true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* ─── Header trang ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quản lý Giao Dịch Nạp Xu
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              VNPay Sandbox
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi, đối soát và quản lý tất cả các giao dịch thanh toán gói Xu trên hệ thống StoryVN.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Nút Ẩn/Hiện Biểu Đồ */}
          <button
            type="button"
            onClick={() => setShowCharts(!showCharts)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{showCharts ? "Ẩn biểu đồ" : "Xem biểu đồ"}</span>
          </button>

          {/* Nút Làm mới dữ liệu */}
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ─── Khối Biểu Đồ Thống Kê Giao Dịch Thực Tế ──────────────── */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminAreaChart
              title="Biểu Đồ Doanh Thu Giao Dịch (14 ngày qua)"
              subtitle="Số liệu thanh toán thực tế đã đối soát thành công qua VNPay"
              data={(dashboardData?.charts.timeline || []).map((t) => ({
                label: t.label,
                value: t.revenue,
                secondaryValue: t.transactions,
                tooltipTitle: `Ngày ${t.date}`,
              }))}
              height={220}
              valuePrefix="₫"
              secondaryLabel="Số giao dịch"
              colorScheme="emerald"
              formatValue={(val) => {
                if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
                if (val >= 1_000) return (val / 1_000).toFixed(0) + "k";
                return val.toLocaleString("vi-VN");
              }}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminDonutChart
              title="Tỷ Lệ Trạng Thái Giao Dịch"
              subtitle="Cơ cấu các lệnh nạp xu theo trạng thái"
              data={[
                { id: "success", name: "Thành công", value: stats.successCount, color: "#10b981" },
                { id: "pending", name: "Chờ xác nhận", value: stats.pendingCount, color: "#3b82f6" },
                { id: "failed", name: "Thất bại / Hủy", value: stats.failedCount, color: "#f43f5e" },
              ]}
              size={170}
              thickness={24}
              centerLabel="Tổng lệnh"
              centerValue={stats.totalTransactions}
            />
          </div>
        </div>
      )}

      {/* ─── 4 Thẻ Thống Kê Nhanh (KPIs) ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng doanh thu */}
        <AdminStatCard
          label="Tổng Doanh Thu"
          value={formatCurrency(stats.totalRevenue)}
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="border-emerald-200 text-emerald-800"
        />

        {/* Giao dịch thành công */}
        <AdminStatCard
          label="Đã Thanh Toán (Thành công)"
          value={stats.successCount}
          icon={
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="border-indigo-200 text-indigo-800"
          badge={
            <div className="flex items-center gap-1 font-bold text-amber-600 text-xs">
              <Image src="/icon/coin.svg" alt="Xu" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
              <span>{stats.totalCoinSold.toLocaleString("vi-VN")} Xu</span>
            </div>
          }
        />

        {/* Đang chờ xử lý */}
        <AdminStatCard
          label="Đang Chờ Xác Nhận"
          value={stats.pendingCount}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="border-blue-200 text-blue-800"
          hasAlert={stats.pendingCount > 0}
          onClick={() => handleStatusChange(status === "PENDING" ? "" : "PENDING")}
          isActive={status === "PENDING"}
        />

        {/* Giao dịch thất bại / hủy */}
        <AdminStatCard
          label="Thất Bại / Đã Hủy"
          value={stats.failedCount}
          icon={
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="border-rose-200 text-rose-800"
          onClick={() => handleStatusChange(status === "FAILED" ? "" : "FAILED")}
          isActive={status === "FAILED"}
        />
      </div>

      {/* ─── Thanh Lọc & Tìm Kiếm ─────────────────────────────────── */}
      <TransactionFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
        onReset={handleReset}
      />

      {/* ─── Bảng Dữ Liệu Giao Dịch ───────────────────────────────── */}
      <TransactionTable
        items={items}
        isLoading={isLoading}
        onViewDetail={handleViewDetail}
      />

      {/* ─── Phân Trang ───────────────────────────────────────────── */}
      {meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
          <span>
            Hiển thị <strong className="text-slate-800">{items.length}</strong> /{" "}
            <strong className="text-slate-800">{meta.total}</strong> giao dịch (Trang{" "}
            <strong className="text-slate-800">{meta.page}</strong> / {meta.totalPages})
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Trước
            </button>

            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                        page === p
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Sau →
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal Chi Tiết Giao Dịch ─────────────────────────────── */}
      <TransactionDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={selectedTx}
      />
    </div>
  );
}

