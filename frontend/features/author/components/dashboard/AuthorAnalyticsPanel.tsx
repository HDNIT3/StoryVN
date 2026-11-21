"use client";

import React, { useState } from "react";
import type { AuthorAnalyticsData } from "../../types/analytics.types";
import {
  AdminAreaChart,
  AdminBarChart,
  AdminDonutChart,
  AdminMetricCard,
} from "@/features/admin/components/charts";

const fmt = (value: number) => value.toLocaleString("vi-VN");
const score = (value: number | null) =>
  value === null ? "Chưa có" : `${value.toLocaleString("vi-VN")} / 5`;
const statuses: Record<string, string> = {
  PUBLISHED: "Đã xuất bản",
  PENDING_REVIEW: "Chờ duyệt",
  DRAFT: "Bản nháp",
  REJECTED: "Từ chối",
};
const colors: Record<string, string> = {
  PUBLISHED: "#10b981",
  PENDING_REVIEW: "#f59e0b",
  DRAFT: "#94a3b8",
  REJECTED: "#f43f5e",
};
const panel =
  "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0";

function ChartSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className={panel}>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function AuthorAnalyticsPanel({
  data,
  detail = false,
  onSelectStory,
}: {
  data: AuthorAnalyticsData;
  detail?: boolean;
  onSelectStory?: (story: AuthorAnalyticsData["stories"][number]) => void;
}) {
  const [search, setSearch] = useState("");
  const [paging, setPaging] = useState({ key: "", page: 1 });
  const [ratingMode, setRatingMode] = useState<"period" | "current">("period");
  const rows = detail ? data.chapters : data.stories;
  const filtered = rows.filter((row) =>
    row.title
      .toLocaleLowerCase("vi-VN")
      .includes(search.toLocaleLowerCase("vi-VN").trim()),
  );
  const pageKey = JSON.stringify([
    data.range,
    search,
    detail,
    data.stories.map((story) => story._id),
  ]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const page = Math.min(paging.key === pageKey ? paging.page : 1, pages);
  const visibleIds = new Set(
    filtered.slice((page - 1) * 10, page * 10).map((row) => row._id),
  );
  const timeline = data.timeline;
  const title = (date: string) => `Ngày ${date.split("-").reverse().join("/")}`;
  const metricCards = [
    {
      label: "Lượt đọc trong kỳ",
      value: fmt(data.period.views),
      subValue: "Theo lượt đọc được ghi nhận hằng ngày",
      key: "views" as const,
      color: "sky" as const,
    },
    {
      label: "Xu mở khóa trong kỳ",
      value: fmt(data.period.coins),
      subValue: `${fmt(data.period.unlocks)} lượt mở khóa chương`,
      key: "coins" as const,
      color: "amber" as const,
    },
    {
      label: "Bình luận trong kỳ",
      value: fmt(data.period.comments),
      subValue: "Bình luận hiện đang hiển thị",
      key: "comments" as const,
      color: "emerald" as const,
    },
    {
      label: "Điểm đánh giá trong kỳ",
      value: score(data.period.ratingAverage),
      subValue: `${fmt(data.period.ratings)} đánh giá hiện đang hiển thị`,
      key: "ratings" as const,
      color: "violet" as const,
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-5">
      {detail && (
        <section className={panel}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Toàn cảnh tác phẩm
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              Số liệu hiện tại / toàn thời gian
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              [
                "Lượt đọc toàn thời gian",
                fmt(data.snapshot.views),
              ],
              [
                "Chương xuất bản / tổng",
                `${fmt(data.snapshot.publishedChapters)} / ${fmt(data.snapshot.chapters)}`,
              ],
              ["Theo dõi truyện", fmt(data.snapshot.follows)],
              ["Điểm đánh giá", score(data.snapshot.ratingAverage)],
              ["Số lượt đánh giá", fmt(data.snapshot.ratings)],
              ["Tổng số từ", fmt(data.snapshot.words)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <AdminMetricCard
            key={card.key}
            label={card.label}
            value={card.value}
            subValue={card.subValue}
            colorScheme={card.color}
            icon={
              <span aria-hidden="true">
                {
                  { views: "↗", coins: "◉", comments: "☏", ratings: "★" }[
                    card.key
                  ]
                }
              </span>
            }
            sparklineData={timeline.map((point) => point[card.key])}
            trend={
              data.growth
                ? {
                    value: data.growth[card.key],
                    label: card.key === "ratings" ? "lượt đánh giá so với kỳ trước" : "so với kỳ trước cùng độ dài",
                    isPositive: data.growth[card.key] >= 0,
                  }
                : undefined
            }
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          Trong kỳ: <b>{fmt(data.period.stories)}</b> truyện mới ·{" "}
          <b>{fmt(data.period.chapters)}</b> chương mới
        </span>
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <b>{fmt(data.period.follows)}</b> theo dõi được tạo trong kỳ và còn
          hiệu lực
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartSection
          title="Xu hướng lượt đọc"
          description="Lượt đọc phát sinh theo ngày, bao gồm cả truyện đã tạo từ trước kỳ lọc."
        >
          <AdminAreaChart
            data={timeline.map((point) => ({
              label: point.label,
              value: point.views,
              tooltipTitle: title(point.date),
            }))}
            colorScheme="sky"
            height={240}
            valueSuffix=" lượt đọc"
          />
        </ChartSection>
        <ChartSection
          title="Xu từ mở khóa chương"
          description="Tính theo giá xu thực trả và thời điểm mở khóa, không theo giá chương hiện tại."
        >
          <AdminAreaChart
            data={timeline.map((point) => ({
              label: point.label,
              value: point.coins,
              secondaryValue: point.unlocks,
              tooltipTitle: title(point.date),
            }))}
            colorScheme="amber"
            height={240}
            valueSuffix=" xu"
            secondaryLabel="Lượt mở khóa"
          />
        </ChartSection>
        <ChartSection
          title="Nhịp độ sáng tác"
          description="Truyện và chương được tạo trong kỳ; chương tính cả những truyện cũ."
        >
          <AdminBarChart
            data={timeline.map((point) => ({
              label: point.label,
              value: point.stories,
              secondaryValue: point.chapters,
              tooltipTitle: title(point.date),
            }))}
            primaryLegend="Truyện mới"
            secondaryLegend="Chương mới"
            height={240}
          />
        </ChartSection>
        <ChartSection
          title="Tương tác của độc giả"
          description="Bình luận và đánh giá theo ngày tạo, với trạng thái hiện đang hiển thị."
        >
          <AdminBarChart
            data={timeline.map((point) => ({
              label: point.label,
              value: point.comments,
              secondaryValue: point.ratings,
              tooltipTitle: title(point.date),
            }))}
            primaryLegend="Bình luận"
            secondaryLegend="Đánh giá"
            barColor="#10b981"
            secondaryBarColor="#8b5cf6"
            height={240}
          />
        </ChartSection>
        <ChartSection
          title="Phân bố đánh giá"
          description="Mỗi đánh giá có trọng số bằng nhau. Chưa có đánh giá sẽ không hiển thị điểm mặc định."
        >
          <div
            role="group"
            aria-label="Phạm vi đánh giá"
            className="mb-3 flex gap-2"
          >
            {(["period", "current"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={ratingMode === mode}
                onClick={() => setRatingMode(mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${ratingMode === mode ? "bg-violet-50 text-violet-700" : "bg-slate-50 text-slate-500"}`}
              >
                {mode === "period" ? "Trong kỳ" : "Toàn thời gian"}
              </button>
            ))}
          </div>
          <AdminBarChart
            data={(ratingMode === "period"
              ? data.distribution
              : data.snapshotDistribution
            ).map((item) => ({
              label: `${item.stars} sao`,
              value: item.count,
              tooltipTitle: `${item.stars} sao`,
            }))}
            primaryLegend="Số đánh giá"
            barColor="#8b5cf6"
            height={200}
          />
        </ChartSection>
        <ChartSection
          title="Trạng thái chương truyện"
          description="Trạng thái hiện tại của toàn bộ chương thuộc tác phẩm, không phụ thuộc kỳ lọc."
        >
          <AdminDonutChart
            data={Object.entries(data.chapterStatuses).map(([id, value]) => ({
              id,
              value,
              name: statuses[id] || id,
              color: colors[id],
            }))}
            centerLabel="Chương"
            centerValue={data.snapshot.chapters}
            size={175}
            thickness={23}
          />
        </ChartSection>
      </div>
      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {detail ? "Hiệu quả từng chương" : "Hiệu quả từng tác phẩm"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {detail
                ? "Lượt đọc và trạng thái chương là hiện tại; lượt mở khóa và xu theo kỳ lọc."
                : "Lượt đọc, bình luận và xu theo kỳ lọc; theo dõi và điểm là hiện tại. Chọn tên để xem chi tiết."}
            </p>
          </div>
          <label className="text-xs text-slate-500">
            Tìm theo tên
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={detail ? "Tên chương..." : "Tên tác phẩm..."}
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="whitespace-nowrap bg-slate-50 text-slate-500">
              <tr>
                {(detail
                  ? [
                      "Chương",
                      "Trạng thái",
                      "Lượt đọc toàn thời gian",
                      "Số từ",
                      "Mở khóa trong kỳ",
                      "Xu trong kỳ",
                    ]
                  : [
                      "Tác phẩm",
                      "Lượt đọc trong kỳ",
                      "Xu trong kỳ",
                      "Bình luận trong kỳ",
                      "Theo dõi hiện tại",
                      "Điểm / lượt đánh giá hiện tại",
                    ]
                ).map((heading) => (
                  <th className="p-3" key={heading}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {detail
                ? data.chapters
                    .filter((chapter) => visibleIds.has(chapter._id))
                    .map((chapter) => (
                      <tr key={chapter._id}>
                        <td className="min-w-40 p-3 font-semibold">
                          {chapter.chapterNumber}. {chapter.title}
                        </td>
                        <td className="whitespace-nowrap p-3">
                          {statuses[chapter.status] || chapter.status}
                        </td>
                        <td className="p-3 tabular-nums">
                          {fmt(chapter.totalViews)}
                        </td>
                        <td className="p-3 tabular-nums">
                          {fmt(chapter.words)}
                        </td>
                        <td className="p-3 tabular-nums">
                          {fmt(chapter.unlocks)}
                        </td>
                        <td className="p-3 tabular-nums">
                          {fmt(chapter.coins)}
                        </td>
                      </tr>
                    ))
                : data.stories
                    .filter((story) => visibleIds.has(story._id))
                    .map((story) => (
                      <tr key={story._id}>
                        <td className="min-w-44 p-3">
                          <button
                            type="button"
                            onClick={() => onSelectStory?.(story)}
                            className="text-left font-semibold text-sky-700 hover:underline"
                          >
                            {story.title}
                          </button>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {statuses[story.status] || story.status} ·{" "}
                            {fmt(story.totalChapters)} chương
                          </p>
                        </td>
                        <td className="p-3 tabular-nums">{fmt(story.views)}</td>
                        <td className="p-3 tabular-nums">{fmt(story.coins)}</td>
                        <td className="p-3 tabular-nums">
                          {fmt(story.comments)}
                        </td>
                        <td className="p-3 tabular-nums">
                          {fmt(story.followers)}
                        </td>
                        <td className="whitespace-nowrap p-3">
                          {score(story.ratingAverage)} ·{" "}
                          {fmt(story.ratingCount)} lượt
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="py-8 text-center text-sm text-slate-400">
              Chưa có dữ liệu phù hợp.
            </p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            {fmt(filtered.length)} {detail ? "chương" : "tác phẩm"} · Trang{" "}
            {page}/{pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPaging({ key: pageKey, page: page - 1 })}
              className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPaging({ key: pageKey, page: page + 1 })}
              className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
