"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DateRangeToolbar,
  exportStatisticsData,
  useDateRange,
} from "@/components/statistics";
import { toast } from "@/lib/toast";
import { useAdminContentStatistics } from "../../queries/useAdminDashboardQueries";
import {
  AdminAreaChart,
  AdminBarChart,
  AdminDonutChart,
  AdminMetricCard,
  AdminUrgentQueueCard,
} from "../charts";

const STATUS_NAMES: Record<string, string> = {
  PUBLISHED: "Đã xuất bản",
  PENDING_REVIEW: "Chờ duyệt",
  REJECTED: "Từ chối",
  DRAFT: "Bản nháp",
};
const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "#10b981",
  PENDING_REVIEW: "#f59e0b",
  REJECTED: "#f43f5e",
  DRAFT: "#94a3b8",
};
const panel = "rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs";
const number = (value: number) => value.toLocaleString("vi-VN");

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={panel}>
      <div className="mb-4 border-b border-gray-100 pb-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function AdminContentStatisticsView() {
  const dateRange = useDateRange();
  const [author, setAuthor] = useState({ id: "", name: "Tất cả tác giả" });
  const [statusTab, setStatusTab] = useState<"stories" | "chapters">("stories");
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ key: "", page: 1 });
  const filters = {
    ...dateRange.range,
    ...(author.id ? { authorId: author.id } : {}),
  };
  const { data, isFetching, isError, refetch } = useAdminContentStatistics(
    filters,
    dateRange.isValid,
  );
  const ready = !!data && dateRange.isValid && !isFetching && !isError;
  const rows = data?.stories || [];
  const counts = data?.counts;
  const timeline = data?.timeline || [];
  const searchRows = rows.filter((row) =>
    `${row.title} ${row.authorName}`
      .toLocaleLowerCase("vi-VN")
      .includes(search.trim().toLocaleLowerCase("vi-VN")),
  );
  const pageKey = JSON.stringify([filters, search]);
  const pageCount = Math.max(1, Math.ceil(searchRows.length / 10));
  const page = Math.min(
    pagination.key === pageKey ? pagination.page : 1,
    pageCount,
  );
  const chapterRanking = [...rows]
    .filter((row) => row.chapters > 0)
    .sort((a, b) => b.chapters - a.chapters)
    .slice(0, 10);
  const authorStats = new Map<
    string,
    {
      id: string;
      name: string;
      stories: number;
      chapters: number;
      views: number;
    }
  >();
  for (const row of rows) {
    const item = authorStats.get(row.authorId) || {
      id: row.authorId,
      name: row.authorName,
      stories: 0,
      chapters: 0,
      views: 0,
    };
    item.stories += Number(row.newStory);
    item.chapters += row.chapters;
    item.views += row.views;
    authorStats.set(row.authorId, item);
  }
  const authors = [...authorStats.values()].sort(
    (a, b) => b.chapters - a.chapters || b.views - a.views,
  );
  const statusData = Object.entries(
    statusTab === "stories"
      ? data?.storyStatuses || {}
      : data?.chapterStatuses || {},
  ).map(([id, value]) => ({
    id,
    name: STATUS_NAMES[id] || id,
    value,
    color: STATUS_COLORS[id],
  }));
  const exportData = async (format: "xlsx" | "csv" = "xlsx") => {
    if (!data || !ready || exporting) return;
    setExporting(true);
    try {
      await exportStatisticsData(
        {
          filename: "thong-ke-truyen-tac-gia",
          range: dateRange.range,
          notes: [
            `Tác giả: ${author.name}`,
            "Truyện mới theo ngày tạo truyện; chương theo ngày tạo chương, kể cả thuộc truyện cũ; lượt đọc phát sinh trong kỳ. Trạng thái là hiện tại.",
            "Bảng gồm truyện được tạo hoặc có chương/lượt đọc trong kỳ. Hàng đợi hiển thị tối đa 5 mục mỗi loại.",
          ],
          sheets: [
            {
              name: "Tổng hợp",
              columns: ["Chỉ số", "Giá trị"],
              rows: [
                ["Truyện mới", data.counts.stories],
                ["Chương mới", data.counts.chapters],
                ["Tác giả có hoạt động", data.counts.authors],
                ["Lượt đọc", data.counts.views],
              ],
            },
            {
              name: "Theo thời gian",
              columns: ["Ngày", "Truyện mới", "Chương mới", "Lượt đọc"],
              rows: timeline.map((item) => [
                item.date,
                item.stories,
                item.chapters,
                item.views,
              ]),
            },
            {
              name: "Theo truyện",
              columns: [
                "Truyện",
                "Tác giả",
                "Trạng thái hiện tại",
                "Truyện mới trong kỳ",
                "Chương mới",
                "Đã xuất bản",
                "Chờ duyệt",
                "Lượt đọc",
              ],
              rows: rows.map((row) => [
                row.title,
                row.authorName,
                STATUS_NAMES[row.status] || row.status,
                row.newStory ? "Có" : "Không",
                row.chapters,
                row.publishedChapters,
                row.pendingChapters,
                row.views,
              ]),
            },
            {
              name: "Theo tác giả",
              columns: ["Tác giả", "Truyện mới", "Chương mới", "Lượt đọc"],
              rows: authors.map((item) => [
                item.name,
                item.stories,
                item.chapters,
                item.views,
              ]),
            },
            {
              name: "Thể loại",
              columns: ["Thể loại", "Số truyện", "Tỷ lệ"],
              rows: data.categories.map((item) => [
                item.name,
                item.count,
                item.percentage,
              ]),
            },
          ],
        },
        format,
      );
    } catch {
      toast.error("Không thể xuất thống kê. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="admin-page-title text-2xl font-semibold text-gray-900">Truyện & tác giả</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi sáng tác, lượt đọc và tiến độ kiểm duyệt.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-admin-brand-600">
          <Link
            href="/quan-ly/truyen"
            className="rounded-lg border border-admin-brand-100 bg-white px-3 py-2 hover:bg-admin-brand-50"
          >
            Quản lý truyện
          </Link>
          <Link
            href="/quan-ly/chuong"
            className="rounded-lg border border-admin-brand-100 bg-white px-3 py-2 hover:bg-admin-brand-50"
          >
            Quản lý chương
          </Link>
          <Link
            href="/quan-ly/duyet-tac-gia"
            className="rounded-lg border border-admin-brand-100 bg-white px-3 py-2 hover:bg-admin-brand-50"
          >
            Duyệt tác giả
          </Link>
        </div>
      </div>
      <div className="space-y-3">
        <DateRangeToolbar
          dateRange={dateRange}
          onExport={exportData}
          exporting={exporting}
          exportDisabled={!ready}
        />
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
          <label className="text-xs font-semibold text-gray-600">
            Tác giả
            <select
              value={author.id}
              disabled={exporting}
              onChange={(event) =>
                setAuthor({
                  id: event.target.value,
                  name: event.target.selectedOptions[0].text,
                })
              }
              className="ml-3 max-w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <option value="">Tất cả tác giả</option>
              {author.id &&
                !data?.authors.some((item) => item._id === author.id) && (
                  <option value={author.id}>{author.name}</option>
                )}
              {data?.authors.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          {author.id && (
            <button
              type="button"
              onClick={() => setAuthor({ id: "", name: "Tất cả tác giả" })}
              className="text-sm font-semibold text-admin-brand-600"
            >
              Xóa lọc tác giả
            </button>
          )}
        </div>
      </div>
      {isError ? (
        <div
          role="alert"
          className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
        >
          Không thể tải thống kê.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="font-semibold underline"
          >
            Thử lại
          </button>
        </div>
      ) : !dateRange.isValid ? (
        <p role="status" className="text-sm text-gray-500">
          Chọn khoảng thời gian hợp lệ để xem thống kê.
        </p>
      ) : isFetching && !data ? (
        <p role="status" className="py-12 text-center text-sm text-gray-500">
          Đang tải thống kê truyện và tác giả...
        </p>
      ) : (
        data && (
          <div className="space-y-6" aria-busy={isFetching}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  [
                    "Truyện mới",
                    counts?.stories || 0,
                    "Tác phẩm được tạo trong kỳ",
                    "indigo",
                    timeline.map((item) => item.stories),
                  ],
                  [
                    "Chương mới",
                    counts?.chapters || 0,
                    "Bao gồm chương thuộc truyện đã có",
                    "emerald",
                    timeline.map((item) => item.chapters),
                  ],
                  [
                    "Tác giả có hoạt động",
                    counts?.authors || 0,
                    "Có truyện mới, chương mới hoặc lượt đọc",
                    "violet",
                    [],
                  ],
                  [
                    "Lượt đọc",
                    counts?.views || 0,
                    "Lượt đọc phát sinh trong kỳ",
                    "amber",
                    timeline.map((item) => item.views),
                  ],
                ] as const
              ).map(
                ([label, value, subValue, colorScheme, sparkline], index) => (
                  <AdminMetricCard
                    key={label}
                    label={label}
                    value={number(value)}
                    subValue={subValue}
                    colorScheme={colorScheme}
                    sparklineData={[...sparkline]}
                    icon={
                      <span className="text-lg font-medium">
                        {["▤", "≡", "✎", "↗"][index]}
                      </span>
                    }
                  />
                ),
              )}
            </div>
            <AdminUrgentQueueCard
              stories={data.urgentQueue.stories}
              chapters={data.urgentQueue.chapters}
              authorRequests={data.urgentQueue.authorRequests}
              totalPendingStories={data.pending.stories}
              totalPendingChapters={data.pending.chapters}
              totalPendingAuthorRequests={data.pending.authorRequests}
            />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ChartPanel
                title="Nhịp độ sáng tác"
                description="Truyện mới và chương mới theo ngày"
              >
                <AdminBarChart
                  data={timeline.map((item) => ({
                    label: item.label,
                    value: item.stories,
                    secondaryValue: item.chapters,
                    tooltipTitle: `Ngày ${item.date.split("-").reverse().join("/")}`,
                  }))}
                  primaryLegend="Truyện mới"
                  secondaryLegend="Chương mới"
                  height={260}
                />
              </ChartPanel>
              <ChartPanel
                title="Xu hướng lượt đọc"
                description="Lượt đọc theo thời gian của các tác phẩm thuộc tác giả đã chọn"
              >
                <AdminAreaChart
                  data={timeline.map((item) => ({
                    label: item.label,
                    value: item.views,
                    tooltipTitle: `Ngày ${item.date.split("-").reverse().join("/")}`,
                  }))}
                  height={260}
                  colorScheme="violet"
                  valueSuffix=" lượt đọc"
                />
              </ChartPanel>
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ChartPanel
                title="Thể loại truyện mới"
                description="Một truyện có thể thuộc nhiều thể loại"
              >
                <AdminDonutChart
                  data={data.categories.map((item) => ({
                    ...item,
                    value: item.count,
                  }))}
                  centerLabel="Truyện mới"
                  centerValue={counts?.stories || 0}
                  size={190}
                  thickness={26}
                />
              </ChartPanel>
              <ChartPanel
                title="Trạng thái kiểm duyệt"
                description="Trạng thái hiện tại của nội dung được tạo trong kỳ"
              >
                <div
                  className="mb-4 flex gap-2"
                  role="group"
                  aria-label="Loại nội dung thống kê"
                >
                  {(["stories", "chapters"] as const).map((tab) => (
                    <button
                      type="button"
                      key={tab}
                      aria-pressed={statusTab === tab}
                      onClick={() => setStatusTab(tab)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${statusTab === tab ? "bg-admin-brand-50 text-admin-brand-700" : "bg-gray-50 text-gray-600"}`}
                    >
                      {tab === "stories" ? "Truyện" : "Chương"}
                    </button>
                  ))}
                </div>
                <AdminDonutChart
                  data={statusData}
                  centerLabel={
                    statusTab === "stories" ? "Truyện mới" : "Chương mới"
                  }
                  centerValue={
                    statusTab === "stories"
                      ? counts?.stories || 0
                      : counts?.chapters || 0
                  }
                  size={190}
                  thickness={26}
                />
              </ChartPanel>
            </div>
            <ChartPanel
              title="Chương theo truyện"
              description="10 truyện có nhiều chương mới nhất trong kỳ"
            >
              <AdminBarChart
                data={chapterRanking.map((row) => ({
                  label:
                    row.title.length > 18
                      ? `${row.title.slice(0, 18)}…`
                      : row.title,
                  value: row.chapters,
                  secondaryValue: row.publishedChapters,
                  tooltipTitle: row.title,
                }))}
                primaryLegend="Chương mới"
                secondaryLegend="Đã xuất bản"
                height={260}
                valueSuffix=" chương"
              />
            </ChartPanel>
            <ChartPanel
              title="Hoạt động theo tác giả"
              description="10 tác giả có nhiều chương mới nhất; chọn tên để xem chi tiết"
            >
              <div className="overflow-x-auto">
                <table className="admin-data-table w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="p-3">Tác giả</th>
                      <th className="p-3 text-right">Truyện mới</th>
                      <th className="p-3 text-right">Chương mới</th>
                      <th className="p-3 text-right">Lượt đọc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {authors.slice(0, 10).map((item) => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() =>
                              setAuthor({ id: item.id, name: data.authors.find((option) => option._id === item.id)?.name || item.name })
                            }
                            className="font-semibold text-admin-brand-600 hover:underline"
                          >
                            {item.name}
                          </button>
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          {number(item.stories)}
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          {number(item.chapters)}
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          {number(item.views)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {authors.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-400">
                    Chưa có hoạt động trong khoảng đã chọn.
                  </p>
                )}
              </div>
            </ChartPanel>
            <ChartPanel
              title="Chi tiết theo truyện"
              description="Truyện mới hoặc có chương, lượt đọc trong kỳ; sắp xếp theo lượt đọc"
            >
              <label className="mb-4 block text-xs font-semibold text-gray-600">
                Tìm truyện hoặc tác giả
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nhập tên truyện, tác giả..."
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm sm:max-w-sm"
                />
              </label>
              <div className="overflow-x-auto">
                <table className="admin-data-table w-full text-left text-sm">
                  <thead className="whitespace-nowrap bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="p-3">Truyện / tác giả</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3 text-right">Chương mới</th>
                      <th className="p-3 text-right">Đã xuất bản</th>
                      <th className="p-3 text-right">Chờ duyệt</th>
                      <th className="p-3 text-right">Lượt đọc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {searchRows.slice((page - 1) * 10, page * 10).map((row) => (
                      <tr key={row._id} className="hover:bg-gray-50/60">
                        <td className="min-w-48 p-3">
                          <Link
                            href={
                              row.status === "PUBLISHED"
                                ? `/truyen/${row.slug}`
                                : "/quan-ly/truyen"
                            }
                            className="font-semibold text-gray-800 hover:text-admin-brand-600"
                          >
                            {row.title}
                          </Link>
                          <p className="mt-1 text-xs text-gray-500">
                            {row.authorName}
                          </p>
                        </td>
                        <td className="whitespace-nowrap p-3 text-sm text-gray-600">
                          {STATUS_NAMES[row.status] || row.status}
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          {number(row.chapters)}
                        </td>
                        <td className="p-3 text-right tabular-nums text-emerald-600">
                          {number(row.publishedChapters)}
                        </td>
                        <td className="p-3 text-right tabular-nums text-amber-600">
                          {number(row.pendingChapters)}
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          {number(row.views)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {searchRows.length === 0 && (
                  <p className="py-10 text-center text-sm text-gray-400">
                    Không có truyện phù hợp.
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500">
                <span>
                  {number(searchRows.length)} truyện · Trang {page}/{pageCount}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPagination({ key: pageKey, page: page - 1 })
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page >= pageCount}
                    onClick={() =>
                      setPagination({ key: pageKey, page: page + 1 })
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </ChartPanel>
          </div>
        )
      )}
    </div>
  );
}
