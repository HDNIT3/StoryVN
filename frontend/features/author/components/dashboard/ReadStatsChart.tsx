"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { AuthorOverviewData } from "../../types";

type TimeRange = "7days" | "30days" | "90days";

interface ReadStatsChartProps {
  readsChartData?: AuthorOverviewData["charts"]["reads"];
  stats?: AuthorOverviewData["stats"];
}

function buildEmptySeries(range: TimeRange) {
  const days = range === "7days" ? 7 : range === "30days" ? 30 : 90;
  const items: { date: string; value: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    items.push({
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      value: 0,
    });
  }
  return items;
}

function fmtK(n: number): string {
  if (!n || isNaN(n)) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
}

function fmtGrowth(pct?: number): string {
  if (!pct || isNaN(pct)) return "0%";
  return pct > 0 ? `↑ ${pct}%` : `↓ ${Math.abs(pct)}%`;
}

export function ReadStatsChart({ readsChartData, stats }: ReadStatsChartProps) {
  const [range, setRange] = useState<TimeRange>("7days");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const series = readsChartData?.[range];

  const data = useMemo(() => {
    if (series?.items && series.items.length > 0) {
      return series.items.map((item) => ({
        date: item.label || item.date,
        value: item.value || 0,
      }));
    }
    return buildEmptySeries(range);
  }, [series, range]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    const pL = 44;
    const pR = 16;
    const pT = 18;
    const pB = 28;
    const cW = Math.max(w - pL - pR, 10);
    const cH = Math.max(h - pT - pB, 10);
    ctx.clearRect(0, 0, w, h);

    const rawMax = Math.max(...data.map((d) => d.value), 0);
    const maxVal = rawMax > 0 ? rawMax : 5;

    // Y grid
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Inter,system-ui,sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = (maxVal / 5) * (5 - i);
      const y = pT + (cH / 5) * i;
      ctx.fillText(fmtK(val), pL - 8, y + 4);
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pL, y);
      ctx.lineTo(w - pR, y);
      ctx.stroke();
    }

    const pts = data.map((d, i) => ({
      x: pL + (cW / Math.max(data.length - 1, 1)) * i,
      y: pT + cH - (d.value / maxVal) * cH,
    }));

    // Fill
    const grad = ctx.createLinearGradient(0, pT, 0, pT + cH);
    grad.addColorStop(0, "rgba(59,130,246,0.16)");
    grad.addColorStop(1, "rgba(59,130,246,0.02)");
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pT + cH);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, pT + cH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else {
        const cp = (pts[i - 1].x + p.x) / 2;
        ctx.bezierCurveTo(cp, pts[i - 1].y, cp, p.y, p.x, p.y);
      }
    });
    ctx.stroke();

    // Dots
    if (data.length <= 31) {
      pts.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    // X labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Inter,system-ui,sans-serif";
    ctx.textAlign = "center";
    const step = data.length <= 7 ? 1 : Math.ceil(data.length / 6);
    data.forEach((d, i) => {
      if (i % step === 0 || i === data.length - 1) {
        ctx.fillText(d.date, pL + (cW / Math.max(data.length - 1, 1)) * i, h - 6);
      }
    });
  }, [data]);

  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawChart]);

  const periodReads = series?.total ?? data.reduce((s, d) => s + d.value, 0);
  const readsGrowth = series?.growthPercent ?? stats?.viewsGrowthPercent ?? 0;

  const summaryItems = [
    {
      icon: "👁",
      val: fmtK(periodReads > 0 ? periodReads : stats?.totalViews ?? 0),
      label: periodReads > 0 ? "Lượt đọc kỳ này" : "Tổng lượt đọc",
      g: fmtGrowth(readsGrowth),
      positive: readsGrowth >= 0,
      color: "text-blue-500",
    },
    {
      icon: "★",
      val:
        stats?.ratingAverage && stats.ratingAverage > 0
          ? `${stats.ratingAverage.toFixed(1)} (${fmtK(stats.totalRatings)})`
          : fmtK(stats?.totalRatings ?? 0),
      label: "Đánh giá",
      g:
        (stats?.ratingsThisMonth ?? 0) > 0
          ? `+${stats?.ratingsThisMonth}`
          : fmtGrowth(stats?.ratingsGrowthPercent ?? 0),
      positive: (stats?.ratingsGrowthPercent ?? 0) >= 0,
      color: "text-amber-500",
    },
    {
      icon: "🔖",
      val: fmtK(stats?.totalFollowers ?? 0),
      label: "Lượt theo dõi",
      g:
        (stats?.followersThisMonth ?? 0) > 0
          ? `+${stats?.followersThisMonth}`
          : fmtGrowth(stats?.followersGrowthPercent ?? 0),
      positive: (stats?.followersGrowthPercent ?? 0) >= 0,
      color: "text-emerald-500",
    },
    {
      icon: "💬",
      val: fmtK(stats?.totalComments ?? 0),
      label: "Bình luận",
      g:
        (stats?.commentsThisMonth ?? 0) > 0
          ? `+${stats?.commentsThisMonth}`
          : fmtGrowth(stats?.commentsGrowthPercent ?? 0),
      positive: (stats?.commentsGrowthPercent ?? 0) >= 0,
      color: "text-sky-500",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 min-w-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-[15px] font-bold text-zinc-900 truncate">
            Biểu đồ lượt đọc theo ngày
          </h3>
          <p className="text-[11px] text-zinc-400">
            Dữ liệu thực tế từ lượt đọc hàng ngày của toàn bộ tác phẩm
          </p>
        </div>
        <div className="inline-flex items-center rounded-lg bg-zinc-100 p-0.5 border border-zinc-200/80">
          {(
            [
              { key: "7days", label: "7 ngày" },
              { key: "30days", label: "30 ngày" },
              { key: "90days", label: "90 ngày" },
            ] as { key: TimeRange; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRange(tab.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                range === tab.key
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period View Breakdown Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="rounded-lg bg-sky-50/70 border border-sky-100 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 block">
            Hôm nay
          </span>
          <div className="flex items-baseline justify-between gap-1 mt-0.5">
            <span className="text-sm font-extrabold text-zinc-900">
              +{(stats?.viewsToday ?? 0).toLocaleString("vi-VN")}
            </span>
            {stats?.viewsTodayGrowthPercent !== undefined && (
              <span
                className={`text-[10px] font-bold ${
                  stats.viewsTodayGrowthPercent >= 0
                    ? "text-emerald-600"
                    : "text-rose-500"
                }`}
              >
                {fmtGrowth(stats.viewsTodayGrowthPercent)}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 block">
            7 ngày qua
          </span>
          <div className="flex items-baseline justify-between gap-1 mt-0.5">
            <span className="text-sm font-extrabold text-zinc-900">
              +{(stats?.viewsWeek ?? readsChartData?.["7days"]?.total ?? 0).toLocaleString("vi-VN")}
            </span>
            <span
              className={`text-[10px] font-bold ${
                (readsChartData?.["7days"]?.growthPercent ?? 0) >= 0
                  ? "text-emerald-600"
                  : "text-rose-500"
              }`}
            >
              {fmtGrowth(readsChartData?.["7days"]?.growthPercent ?? 0)}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block">
            30 ngày qua
          </span>
          <div className="flex items-baseline justify-between gap-1 mt-0.5">
            <span className="text-sm font-extrabold text-zinc-900">
              +{(stats?.views30Days ?? readsChartData?.["30days"]?.total ?? 0).toLocaleString("vi-VN")}
            </span>
            <span
              className={`text-[10px] font-bold ${
                (readsChartData?.["30days"]?.growthPercent ?? 0) >= 0
                  ? "text-emerald-600"
                  : "text-rose-500"
              }`}
            >
              {fmtGrowth(readsChartData?.["30days"]?.growthPercent ?? 0)}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-amber-50/70 border border-amber-100 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 block">
            Toàn thời gian
          </span>
          <div className="flex items-baseline justify-between gap-1 mt-0.5">
            <span className="text-sm font-extrabold text-zinc-900">
              {(stats?.totalViews ?? 0).toLocaleString("vi-VN")}
            </span>
            <span className="text-[10px] font-medium text-amber-700">tổng</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="w-full h-[200px] mb-4">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 pt-3.5 border-t border-zinc-100">
        {summaryItems.map((s, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span className={`text-base shrink-0 ${s.color}`}>{s.icon}</span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold text-zinc-900 leading-tight truncate">
                {s.val}
              </span>
              <span className="text-[11px] text-zinc-400 truncate">{s.label}</span>
            </div>
            <span
              className={`text-[11px] font-semibold ml-auto shrink-0 ${s.positive ? "text-emerald-600" : "text-rose-500"
                }`}
            >
              {s.g}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
