"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import { useAdminDashboardOverview } from "../../queries/useAdminDashboardQueries";
import {
  AdminMetricCard,
  AdminAreaChart,
  AdminBarChart,
  AdminDonutChart,
  AdminUrgentQueueCard,
  type AreaChartDataPoint,
  type BarChartItem,
  type DonutSegment,
} from "../charts";

export function AdminDashboardView() {
  const { user } = useAuth();
  const [days, setDays] = useState<number>(14);
  const [revenueTab, setRevenueTab] = useState<"revenue" | "transactions" | "coins">("revenue");

  const { data, isLoading, isRefetching, refetch } = useAdminDashboardOverview(days);

  const kpi = data?.kpi;
  const charts = data?.charts;
  const topStories = data?.topStories || [];
  const recentTransactions = data?.recentTransactions || [];
  const urgentQueue = data?.urgentQueue;

  // Dữ liệu cho biểu đồ Doanh thu (Area Chart)
  const revenueChartData: AreaChartDataPoint[] = (charts?.timeline || []).map((t) => {
    let val = t.revenue;
    let sec = t.transactions;
    if (revenueTab === "transactions") {
      val = t.transactions;
      sec = t.revenue;
    } else if (revenueTab === "coins") {
      val = t.coins;
      sec = t.transactions;
    }
    return {
      label: t.label,
      value: val,
      secondaryValue: sec,
      tooltipTitle: `Ngày ${t.date}`,
    };
  });

  // Sparkline arrays cho các metric cards
  const revenueSparkline = (charts?.timeline || []).map((t) => t.revenue);
  const userSparkline = (charts?.timeline || []).map((t) => t.newUsers);
  const viewsSparkline = (charts?.timeline || []).map((t) => t.views);
  const txSparkline = (charts?.timeline || []).map((t) => t.transactions);

  // Dữ liệu cho biểu đồ người dùng mới theo ngày (Bar Chart)
  const userGrowthChartData: BarChartItem[] = (charts?.timeline || []).map((t) => ({
    label: t.label,
    value: t.newUsers,
    tooltipTitle: `Ngày ${t.date}`,
  }));

  // Dữ liệu cho biểu đồ thể loại (Donut Chart)
  const categorySegments: DonutSegment[] = (charts?.categories || []).map((c) => ({
    id: c.id,
    name: c.name,
    value: c.count,
    percentage: c.percentage,
  }));

  // Dữ liệu cho phân bố kiểm duyệt truyện
  const storyModerationSegments: DonutSegment[] = [
    {
      id: "published",
      name: "Đã xuất bản",
      value: kpi?.stories.published || 0,
      color: "#10b981",
    },
    {
      id: "pending",
      name: "Chờ xét duyệt",
      value: kpi?.stories.pending || 0,
      color: "#f59e0b",
    },
    {
      id: "rejected",
      name: "Bị từ chối",
      value: kpi?.stories.rejected || 0,
      color: "#f43f5e",
    },
    {
      id: "draft",
      name: "Bản nháp",
      value: kpi?.stories.draft || 0,
      color: "#94a3b8",
    },
  ];

  // Helper format VND
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. TOP HEADER & GREETING ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Chào mừng, {user?.displayName || user?.username || "Quản trị viên"}! 👋
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              {user?.role === "ADMIN" ? "QUẢN TRỊ VIÊN CẤP CAO" : "QUẢN LÝ NỘI DUNG"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl">
            Bảng điều khiển tổng hợp số liệu thực tế về doanh thu VNPay, tương tác độc giả, tiến độ kiểm duyệt và tăng trưởng cộng đồng StoryVN.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
          {/* Chọn số ngày */}
          <div className="inline-flex p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDays(7)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                days === 7
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => setDays(14)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                days === 14
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              14 ngày
            </button>
            <button
              type="button"
              onClick={() => setDays(30)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                days === 30
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              30 ngày
            </button>
          </div>

          {/* Nút Làm mới */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isRefetching ? "Đang đồng bộ..." : "Đồng bộ"}</span>
          </button>
        </div>
      </div>

      {/* ─── 2. HÀNG ĐỢI KIỂM DUYỆT KHẨN CẤP (ACTION CENTER) ────────── */}
      <AdminUrgentQueueCard
        stories={urgentQueue?.stories || []}
        chapters={urgentQueue?.chapters || []}
        authorRequests={urgentQueue?.authorRequests || []}
        totalPendingStories={kpi?.stories.pending || 0}
        totalPendingChapters={kpi?.chapters.pending || 0}
        totalPendingAuthorRequests={kpi?.pendingSummary.authorRequests || 0}
      />

      {/* ─── 3. 4 THẺ METRICS KPI MASTER ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu VNPay */}
        <AdminMetricCard
          label="Tổng Doanh Thu Thực Tế"
          value={formatCurrency(kpi?.revenue.total || 0)}
          subValue={`Hôm nay: ${formatCurrency(kpi?.revenue.today || 0)} • Tháng này: ${formatCurrency(kpi?.revenue.thisMonth || 0)}`}
          trend={{
            value: kpi?.revenue.growthRate || 0,
            label: "so với tháng trước",
            isPositive: (kpi?.revenue.growthRate || 0) >= 0,
          }}
          colorScheme="indigo"
          sparklineData={revenueSparkline}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Người dùng & Cộng đồng */}
        <AdminMetricCard
          label="Tổng Người Dùng"
          value={kpi?.users.total || 0}
          subValue={`Hôm nay: +${kpi?.users.newToday || 0} • 7 ngày qua: +${kpi?.users.new7Days || 0}`}
          trend={{
            value: kpi?.users.growthToday || 0,
            label: "tăng trưởng hôm nay",
            isPositive: (kpi?.users.growthToday || 0) >= 0,
          }}
          colorScheme="emerald"
          sparklineData={userSparkline}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        {/* Kho Tác Phẩm & Lượt đọc */}
        <AdminMetricCard
          label="Kho Tác Phẩm & Lượt Đọc"
          value={kpi?.stories.total || 0}
          subValue={`Tổng ${kpi?.stories.totalViews.toLocaleString("vi-VN") || 0} lượt đọc • ${kpi?.chapters.published || 0} chương xuất bản`}
          colorScheme="violet"
          sparklineData={viewsSparkline}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />

        {/* Nạp Xu & Giao dịch */}
        <AdminMetricCard
          label="Tổng Xu Nạp & Giao Dịch"
          value={`${kpi?.revenue.coins.total.toLocaleString("vi-VN") || 0} Xu`}
          subValue={`${kpi?.revenue.totalTransactions || 0} lượt nạp thành công • ${kpi?.transactionsBreakdown.PENDING || 0} chờ xử lý`}
          colorScheme="amber"
          sparklineData={txSparkline}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
      </div>

      {/* ─── 4. BIỂU ĐỒ DIỆN TÍCH DOANH THU & BIỂU ĐỒ CỘT NGƯỜI DÙNG ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ Doanh thu (Area Chart - chiếm 2 cột) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Xu Hướng Doanh Thu & Dòng Tiền ({days} ngày qua)
              </h2>
              <p className="text-xs text-slate-500">
                Thống kê các giao dịch nạp tiền thành công qua cổng thanh toán VNPay
              </p>
            </div>

            {/* Switch tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setRevenueTab("revenue")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  revenueTab === "revenue"
                    ? "bg-white text-indigo-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Doanh thu (VND)
              </button>
              <button
                type="button"
                onClick={() => setRevenueTab("transactions")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  revenueTab === "transactions"
                    ? "bg-white text-indigo-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Số giao dịch
              </button>
              <button
                type="button"
                onClick={() => setRevenueTab("coins")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  revenueTab === "coins"
                    ? "bg-white text-indigo-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Số Xu nạp
              </button>
            </div>
          </div>

          <div className="mt-4">
            <AdminAreaChart
              data={revenueChartData}
              height={270}
              valuePrefix={revenueTab === "revenue" ? "₫" : ""}
              valueSuffix={revenueTab === "coins" ? " Xu" : revenueTab === "transactions" ? " GD" : ""}
              secondaryLabel={revenueTab === "revenue" ? "Số giao dịch" : "Doanh thu (VND)"}
              colorScheme={revenueTab === "revenue" ? "indigo" : revenueTab === "coins" ? "amber" : "emerald"}
              formatValue={(val) => {
                if (revenueTab === "revenue") {
                  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
                  if (val >= 1_000) return (val / 1_000).toFixed(0) + "k";
                  return val.toLocaleString("vi-VN");
                }
                return val.toLocaleString("vi-VN");
              }}
            />
          </div>
        </div>

        {/* Biểu đồ Cột: Tăng trưởng người dùng mới */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Người Dùng Đăng Ký Mới</h2>
              <p className="text-xs text-slate-500">Số lượng tài khoản mới tham gia nền tảng</p>
            </div>

            <div className="mt-4">
              <AdminBarChart
                data={userGrowthChartData}
                height={220}
                barColor="#10b981"
                primaryLegend="Tài khoản mới"
                valueSuffix=" user"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Hôm nay: <b className="text-emerald-600">+{kpi?.users.newToday || 0}</b></span>
            <span>Tổng tài khoản: <b className="text-slate-800">{kpi?.users.total.toLocaleString("vi-VN") || 0}</b></span>
          </div>
        </div>
      </div>

      {/* ─── 5. PHÂN BỐ THỂ LOẠI & TRẠNG THÁI KIỂM DUYỆT ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phân bố thể loại truyện */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-base font-bold text-slate-900">Cơ Cấu Thể Loại Truyện</h2>
            <p className="text-xs text-slate-500">Thị phần tác phẩm phân bổ theo các thể loại chính</p>
          </div>

          <AdminDonutChart
            data={categorySegments}
            size={190}
            thickness={26}
            centerLabel="Tác phẩm"
            centerValue={kpi?.stories.total || 0}
          />
        </div>

        {/* Trạng thái duyệt tác phẩm */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-base font-bold text-slate-900">Trạng Thái Nội Dung Truyện</h2>
            <p className="text-xs text-slate-500">Tỷ lệ tác phẩm đã xuất bản, chờ duyệt và bản nháp</p>
          </div>

          <AdminDonutChart
            data={storyModerationSegments}
            size={190}
            thickness={26}
            centerLabel="Tổng truyện"
            centerValue={kpi?.stories.total || 0}
          />
        </div>
      </div>

      {/* ─── 6. TOP TRUYỆN THỊNH HÀNH & GIAO DỊCH GẦN ĐÂY ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top truyện lượt xem cao nhất */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top Tác Phẩm Nổi Bật Nhất</h2>
              <p className="text-xs text-slate-500">Theo lượt đọc thực tế và số lượng theo dõi</p>
            </div>
            <Link
              href="/quan-ly/truyen"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Xem tất cả &rarr;
            </Link>
          </div>

          {topStories.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center italic">Chưa có truyện nào xuất bản</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {topStories.map((story, idx) => (
                <div key={story._id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 0
                        ? "bg-amber-100 text-amber-800"
                        : idx === 1
                        ? "bg-slate-200 text-slate-700"
                        : idx === 2
                        ? "bg-amber-50 text-amber-700"
                        : "text-slate-400"
                    }`}>
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/truyen/${story.slug}`}
                        target="_blank"
                        className="text-xs sm:text-sm font-bold text-slate-800 hover:text-indigo-600 truncate block transition-colors"
                      >
                        {story.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        Tác giả: <span className="text-slate-600 font-medium">{story.authorName}</span> • {story.chapterCount} chương
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-indigo-600 block">
                      {story.views.toLocaleString("vi-VN")} lượt xem
                    </span>
                    <span className="text-[11px] text-amber-500 font-semibold flex items-center justify-end gap-1">
                      ★ {story.ratingAverage.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Giao dịch gần đây */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Giao Dịch Nạp Xu Gần Nhất</h2>
              <p className="text-xs text-slate-500">Đối soát các lệnh nạp tiền mới nhất qua cổng VNPay</p>
            </div>
            <Link
              href="/quan-ly/giao-dich"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Xem tất cả &rarr;
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center italic">Chưa có giao dịch nào được ghi nhận</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <div key={tx._id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        #{tx.orderCode}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : tx.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {tx.status === "SUCCESS" ? "Thành công" : tx.status === "PENDING" ? "Chờ xử lý" : "Thất bại"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {tx.user?.displayName || tx.user?.username} • {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 block">
                      {formatCurrency(tx.amount)}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-600">
                      +{tx.totalCoin.toLocaleString("vi-VN")} Xu
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

