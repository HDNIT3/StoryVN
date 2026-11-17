"use client";

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import type { AuthorOverviewData } from "../../types";


interface ReadStatsChartProps {
  allTime?: boolean;
  readsChartData?: AuthorOverviewData["charts"]["reads"];
  stats?: AuthorOverviewData["stats"];
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

export function ReadStatsChart({ readsChartData, stats, allTime = false }: ReadStatsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const series = readsChartData?.selectedRange;

  const data = useMemo(() => {
    if (series?.items && series.items.length > 0) {
      return series.items.map((item) => ({
        date: item.label || item.date,
        value: item.value || 0,
      }));
    }
    return [];
  }, [series]);

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
    if (!data.length) return;

    const rawMax = data.reduce((max, d) => Math.max(max, d.value), 0);
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
       val: fmtK(periodReads),
       label: "Lượt đọc kỳ này",
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
      label: "Điểm hiện tại / đánh giá kỳ này",
      g: fmtGrowth(stats?.ratingsGrowthPercent ?? 0),
      positive: (stats?.ratingsGrowthPercent ?? 0) >= 0,
      color: "text-amber-500",
    },
    {
      icon: "🔖",
      val: fmtK(stats?.totalFollowers ?? 0),
      label: "Theo dõi hiện tại",
      g: "hiện tại",
      positive: (stats?.followersGrowthPercent ?? 0) >= 0,
      color: "text-emerald-500",
    },
    {
      icon: "💬",
      val: fmtK(stats?.totalComments ?? 0),
      label: "Bình luận",
      g: fmtGrowth(stats?.commentsGrowthPercent ?? 0),
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
        <span className="text-xs text-zinc-500">Theo khoảng thời gian đã chọn</span>
      </div>

      {/* Period View Breakdown Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="rounded-lg bg-sky-50/70 border border-sky-100 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 block">
            {allTime ? "Lượt đọc toàn bộ thời gian" : "Lượt đọc trong kỳ"}
          </span>
          <div className="flex items-baseline justify-between gap-1 mt-0.5">
            <span className="text-sm font-extrabold text-zinc-900">
              {periodReads.toLocaleString("vi-VN")}
            </span>
            {!allTime && series?.growthPercent !== undefined && (
              <span
                className={`text-[10px] font-bold ${
                  series.growthPercent >= 0
                    ? "text-emerald-600"
                    : "text-rose-500"
                }`}
              >
                {fmtGrowth(series.growthPercent)}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 block">
            Bình quân mỗi ngày
          </span>
          <div className="flex items-baseline justify-between gap-1 mt-0.5">
            <span className="text-sm font-extrabold text-zinc-900">
              {Math.round(periodReads / Math.max(data.length, 1)).toLocaleString("vi-VN")}
            </span>
            <span
              className={`text-[10px] font-bold ${
                (series?.growthPercent ?? 0) >= 0
                  ? "text-emerald-600"
                  : "text-rose-500"
              }`}
            >
              trong kỳ
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block">
            Ngày cao nhất
          </span>
          <div className="flex items-baseline justify-between gap-1 mt-0.5">
            <span className="text-sm font-extrabold text-zinc-900">
              {Math.max(0, ...data.map((item) => item.value)).toLocaleString("vi-VN")}
            </span>
            <span
              className={`text-[10px] font-bold ${
                (series?.growthPercent ?? 0) >= 0
                  ? "text-emerald-600"
                  : "text-rose-500"
              }`}
            >
              trong kỳ
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-amber-50/70 border border-amber-100 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 block">
            Số ngày trong kỳ
          </span>
          <div className="flex items-baseline justify-between gap-1 mt-0.5">
            <span className="text-sm font-extrabold text-zinc-900">
              {data.length}
            </span>
            <span className="text-[10px] font-medium text-amber-700">ngày</span>
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
