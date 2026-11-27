"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DateRangeToolbar, exportStatisticsData, useDateRange } from "@/components/statistics";
import { toast } from "@/lib/toast";
import { useAdminDashboardOverview } from "../../queries/useAdminDashboardQueries";
import {
  AdminMetricCard,
  AdminAreaChart,
  AdminBarChart,
  AdminDonutChart,
  type AreaChartDataPoint,
  type BarChartItem,
  type DonutSegment,
} from "../charts";

export function AdminDashboardView() {
  const dateRange = useDateRange();
  const [exporting, setExporting] = useState(false);
  const [revenueTab, setRevenueTab] = useState<"revenue" | "transactions" | "coins">("revenue");

  const { data, isLoading, isFetching, isError, refetch } = useAdminDashboardOverview(dateRange.range, dateRange.isValid);
  const canExport = !!data && dateRange.isValid && !isFetching && !isError && (dateRange.mode === "all" ? data.range.mode === "all" : data.range.startDate === dateRange.range.startDate && data.range.endDate === dateRange.range.endDate);
  const exportOverview = async (format: "xlsx" | "csv" = "xlsx") => {
    if (!data || !canExport || exporting) return;
    setExporting(true);
    try {
      await exportStatisticsData({ filename: "admin-overview", range: dateRange.range, notes: ["Số lượng nội dung/tài khoản theo ngày tạo trong kỳ, trạng thái hiện tại.", "Doanh thu là tổng tiền giao dịch được tạo trong kỳ và hiện có trạng thái thành công; không tính theo thời điểm thanh toán.", dateRange.mode === "all" ? "Toàn bộ thời gian; các trường kỳ trước và tăng trưởng không áp dụng (0). totalFollows là hiện tại." : "Các trường today, thisMonth, newToday, new7Days là kỳ đã chọn; lastMonth, newYesterday là kỳ trước cùng độ dài. totalFollows là hiện tại.", "Top truyện và giao dịch gần nhất chỉ gồm các dòng đã tải."], sheets: [
        { name: "Tổng quan", columns: ["Nhóm", "Chỉ số", "Giá trị"], rows: Object.entries(data.kpi).flatMap(([group, values]) => Object.entries(values).flatMap(([key, value]) => typeof value === "number" ? [[group, key, value]] : Object.entries(value).map(([subkey, number]) => [group, `${key}.${subkey}`, number as number]))) },
        { name: "Biểu đồ", columns: ["Ngày", "Doanh thu VND", "Xu", "Giao dịch", "Người dùng mới", "Lượt đọc"], rows: data.charts.timeline.map((item) => [item.date, item.revenue, item.coins, item.transactions, item.newUsers, item.views]) },
        { name: "Thể loại", columns: ["Thể loại", "Số lượng", "Tỷ lệ"], rows: data.charts.categories.map((item) => [item.name, item.count, item.percentage]) },
        { name: "Đánh giá", columns: ["Số sao", "Số lượng"], rows: Object.entries(data.charts.ratings).map(([rating, count]) => [Number(rating), count]) },
        { name: "Top truyện đã tải", columns: ["Truyện", "Lượt đọc", "Theo dõi hiện tại", "Chương hiện tại", "Điểm hiện tại"], rows: data.topStories.map((item) => [item.title, item.views, item.likes, item.chapterCount, item.ratingAverage]) },
        { name: "Giao dịch gần nhất", columns: ["Mã", "Ngày", "Số tiền VND", "Xu", "Trạng thái"], rows: data.recentTransactions.map((item) => [item.orderCode, item.createdAt, item.amount, item.totalCoin, item.status]) },
      ] }, format);
    } catch { toast.error("Không thể xuất Excel. Vui lòng thử lại."); } finally { setExporting(false); }
  };

  const kpi = data?.kpi;
  const charts = data?.charts;
  const topStories = data?.topStories || [];
  const recentTransactions = data?.recentTransactions || [];

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
      <div>
        <h1 className="admin-page-title text-2xl font-semibold text-gray-900 tracking-tight">Tổng quan</h1>
        <p className="mt-1 text-sm text-gray-500">Theo dõi số liệu, doanh thu và hoạt động của hệ thống.</p>
      </div>
      {/* ─── 3. 4 THẺ METRICS KPI MASTER ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu VNPay */}
        <AdminMetricCard
          label="Doanh Thu Giao Dịch"
          value={formatCurrency(kpi?.revenue.total || 0)}
          subValue="Giao dịch tạo trong kỳ, hiện đã thành công"
          trend={dateRange.mode === "all" ? undefined : {
            value: kpi?.revenue.growthRate || 0,
            label: "so với kỳ trước cùng độ dài",
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
          subValue="Tài khoản được tạo trong khoảng đã chọn"
          trend={dateRange.mode === "all" ? undefined : {
            value: kpi?.users.growthToday || 0,
            label: "so với kỳ trước cùng độ dài",
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

      <DateRangeToolbar dateRange={dateRange} exportDisabled={!canExport} exporting={exporting} onExport={exportOverview} />
      {isError && <p role="alert" className="text-sm text-red-600">Không thể tải thống kê. <button type="button" onClick={() => refetch()} className="underline">Thử lại</button></p>}
      {isLoading && <p role="status" className="text-sm text-gray-500">Đang tải thống kê...</p>}

      {/* ─── 4. BIỂU ĐỒ DIỆN TÍCH DOANH THU & BIỂU ĐỒ CỘT NGƯỜI DÙNG ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ Doanh thu (Area Chart - chiếm 2 cột) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-admin-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Xu Hướng Doanh Thu & Dòng Tiền ({dateRange.mode === "all" ? "toàn bộ thời gian" : "kỳ đã chọn"})
              </h2>
              <p className="text-xs text-gray-500">
                Thống kê các giao dịch nạp tiền thành công qua cổng thanh toán VNPay
              </p>
            </div>

            {/* Switch tabs */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setRevenueTab("revenue")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  revenueTab === "revenue"
                    ? "bg-white text-admin-brand-700 font-medium shadow-admin-card"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Doanh thu (VND)
              </button>
              <button
                type="button"
                onClick={() => setRevenueTab("transactions")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  revenueTab === "transactions"
                    ? "bg-white text-admin-brand-700 font-medium shadow-admin-card"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Số giao dịch
              </button>
              <button
                type="button"
                onClick={() => setRevenueTab("coins")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  revenueTab === "coins"
                    ? "bg-white text-admin-brand-700 font-medium shadow-admin-card"
                    : "text-gray-600 hover:text-gray-900"
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
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-admin-card flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Người Dùng Đăng Ký Mới</h2>
              <p className="text-xs text-gray-500">Số lượng tài khoản mới tham gia nền tảng</p>
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

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Trong kỳ: <b className="text-emerald-600">+{kpi?.users.total || 0}</b></span>
            <span>Tài khoản mới: <b className="text-gray-800">{kpi?.users.total.toLocaleString("vi-VN") || 0}</b></span>
          </div>
        </div>
      </div>

      {/* ─── 5. PHÂN BỐ THỂ LOẠI & TRẠNG THÁI KIỂM DUYỆT ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phân bố thể loại truyện */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-admin-card">
          <div className="pb-3 border-b border-gray-100 mb-4">
            <h2 className="text-base font-semibold text-gray-900">Cơ Cấu Thể Loại Truyện</h2>
            <p className="text-xs text-gray-500">Thị phần tác phẩm phân bổ theo các thể loại chính</p>
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
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-admin-card">
          <div className="pb-3 border-b border-gray-100 mb-4">
            <h2 className="text-base font-semibold text-gray-900">Trạng Thái Nội Dung Truyện</h2>
            <p className="text-xs text-gray-500">Tỷ lệ tác phẩm đã xuất bản, chờ duyệt và bản nháp</p>
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
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-admin-card">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Top Tác Phẩm Nổi Bật Nhất</h2>
              <p className="text-xs text-gray-500">Top {topStories.length} đã tải; lượt đọc trong kỳ, điểm/chương hiện tại</p>
            </div>
            <Link
              href="/quan-ly/truyen"
              className="text-xs font-medium text-admin-brand-600 hover:text-admin-brand-800 hover:underline"
            >
              Xem tất cả &rarr;
            </Link>
          </div>

          {topStories.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center italic">Chưa có truyện nào xuất bản</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {topStories.map((story, idx) => (
                <div key={story._id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${
                      idx === 0
                        ? "bg-amber-100 text-amber-800"
                        : idx === 1
                        ? "bg-gray-200 text-gray-700"
                        : idx === 2
                        ? "bg-amber-50 text-amber-700"
                        : "text-gray-400"
                    }`}>
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/truyen/${story.slug}`}
                        target="_blank"
                        className="text-xs sm:text-sm font-medium text-gray-800 hover:text-admin-brand-600 truncate block transition-colors"
                      >
                        {story.title}
                      </Link>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        Tác giả: <span className="text-gray-600 font-medium">{story.authorName}</span> • {story.chapterCount} chương
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-admin-brand-600 block">
                      {story.views.toLocaleString("vi-VN")} lượt xem
                    </span>
                    <span className="text-xs text-amber-500 font-semibold flex items-center justify-end gap-1">
                      ★ {story.ratingAverage.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Giao dịch gần đây */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-admin-card">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Giao Dịch Nạp Xu Gần Nhất</h2>
              <p className="text-xs text-gray-500">{recentTransactions.length} giao dịch gần nhất trong kỳ đã tải</p>
            </div>
            <Link
              href="/quan-ly/giao-dich"
              className="text-xs font-medium text-admin-brand-600 hover:text-admin-brand-800 hover:underline"
            >
              Xem tất cả &rarr;
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center italic">Chưa có giao dịch nào được ghi nhận</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentTransactions.map((tx) => (
                <div key={tx._id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-gray-700">
                        #{tx.orderCode}
                      </span>
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
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
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {tx.user?.displayName} • {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-gray-900 block">
                      {formatCurrency(tx.amount)}
                    </span>
                    <span className="text-xs font-semibold text-amber-600">
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

