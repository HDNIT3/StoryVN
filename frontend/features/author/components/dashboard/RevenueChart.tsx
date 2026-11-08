"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import type { AuthorOverviewData } from "../../types";

type TimeRange = "7days" | "30days" | "90days";

interface RevenueChartProps {
  revenueChartData?: AuthorOverviewData["charts"]["revenue"];
  totalCoins?: number;
  walletBalance?: number;
}

function buildEmptyRevenue(range: TimeRange) {
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

export function RevenueChart({
  revenueChartData,
  totalCoins = 0,
  walletBalance = 0,
}: RevenueChartProps) {
  const [range, setRange] = useState<TimeRange>("7days");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const series = revenueChartData?.[range];

  const data = useMemo(() => {
    if (series?.items && series.items.length > 0) {
      return series.items.map((item) => ({
        date: item.label || item.date,
        value: item.value || 0,
      }));
    }
    return buildEmptyRevenue(range);
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
    const maxVal = rawMax > 0 ? rawMax : 100;

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

    // Bars
    const gap = cW / Math.max(data.length, 1);
    const barW = Math.min(Math.max(gap * 0.6, 2), 24);
    data.forEach((d, i) => {
      const x = pL + gap * i + (gap - barW) / 2;
      const rawBarH = (d.value / maxVal) * cH;
      const barH = d.value > 0 ? Math.max(rawBarH, 4) : 2;
      const y = pT + cH - barH;
      const r = Math.min(barW / 2, 4, barH / 2);

      if (d.value > 0) {
        const grad = ctx.createLinearGradient(x, y, x, pT + cH);
        grad.addColorStop(0, "#f59e0b");
        grad.addColorStop(1, "#fbbf24");
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = "#e2e8f0";
      }

      ctx.beginPath();
      ctx.moveTo(x, pT + cH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, pT + cH);
      ctx.closePath();
      ctx.fill();
    });

    // X labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Inter,system-ui,sans-serif";
    ctx.textAlign = "center";
    const step = data.length <= 7 ? 1 : Math.ceil(data.length / 6);
    data.forEach((d, i) => {
      if (i % step === 0 || i === data.length - 1) {
        ctx.fillText(d.date, pL + gap * i + gap / 2, h - 6);
      }
    });
  }, [data]);

  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawChart]);

  const periodTotal = series?.total ?? data.reduce((s, d) => s + d.value, 0);
  const displayCoins = periodTotal > 0 ? periodTotal : totalCoins;
  const growthPct = series?.growthPercent ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-[15px] font-bold text-zinc-900 truncate">Doanh thu xu</h3>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as TimeRange)}
          className="text-xs font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-md px-2.5 py-1 cursor-pointer focus:outline-none focus:border-blue-500 shrink-0"
        >
          <option value="7days">7 ngày qua</option>
          <option value="30days">30 ngày qua</option>
          <option value="90days">90 ngày qua</option>
        </select>
      </div>

      {/* Canvas */}
      <div className="w-full h-[200px] mb-4">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-zinc-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <svg
            className="w-5 h-5 text-amber-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-zinc-400">
              {periodTotal > 0 ? "Doanh thu kỳ này" : "Tổng xu chương VIP"}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-zinc-900 tracking-tight">
              {displayCoins.toLocaleString("vi-VN")} xu
            </span>
          </div>
          <span
            className={`text-[11px] font-semibold ml-1 ${
              growthPct >= 0 ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {growthPct > 0
              ? `↑ ${growthPct}% so với kỳ trước`
              : growthPct < 0
              ? `↓ ${Math.abs(growthPct)}% so với kỳ trước`
              : walletBalance > 0
              ? `Ví: ${walletBalance.toLocaleString("vi-VN")} xu`
              : "0% so với kỳ trước"}
          </span>
        </div>
        <Link
          href="/vi-cua-toi"
          className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer shrink-0"
        >
          Xem ví xu →
        </Link>
      </div>
    </div>
  );
}
