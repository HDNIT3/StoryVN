"use client";

import React, { useState, useEffect, useRef } from "react";

type TimeRange = "7days" | "30days" | "90days";

function generateMockData(range: TimeRange) {
  const days = range === "7days" ? 7 : range === "30days" ? 30 : 90;
  const data: { date: string; value: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      value: Math.floor(Math.random() * 15000) + 2000,
    });
  }
  return data;
}

function fmtK(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K";
  return String(Math.round(n));
}

export function ReadStatsChart() {
  const [range, setRange] = useState<TimeRange>("7days");
  const [data, setData] = useState(() => generateMockData("7days"));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setData(generateMockData(range)); }, [range]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const pL = 50, pR = 20, pT = 20, pB = 30;
    const cW = w - pL - pR, cH = h - pT - pB;
    ctx.clearRect(0, 0, w, h);
    const maxVal = Math.max(...data.map(d => d.value));

    // Y grid
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px Inter,system-ui,sans-serif"; ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = (maxVal / 5) * (5 - i), y = pT + (cH / 5) * i;
      ctx.fillText(fmtK(val), pL - 8, y + 4);
      ctx.strokeStyle = "#f1f5f9"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(w - pR, y); ctx.stroke();
    }

    const pts = data.map((d, i) => ({
      x: pL + (cW / Math.max(data.length - 1, 1)) * i,
      y: pT + cH - (d.value / maxVal) * cH,
    }));

    // Fill
    const grad = ctx.createLinearGradient(0, pT, 0, pT + cH);
    grad.addColorStop(0, "rgba(59,130,246,0.15)"); grad.addColorStop(1, "rgba(59,130,246,0.02)");
    ctx.beginPath(); ctx.moveTo(pts[0].x, pT + cH);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, pT + cH); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath(); ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else { const cp = (pts[i - 1].x + p.x) / 2; ctx.bezierCurveTo(cp, pts[i - 1].y, cp, p.y, p.x, p.y); }
    });
    ctx.stroke();

    // Dots
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#3b82f6"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // X labels
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px Inter,system-ui,sans-serif"; ctx.textAlign = "center";
    const step = data.length <= 7 ? 1 : Math.ceil(data.length / 7);
    data.forEach((d, i) => {
      if (i % step === 0 || i === data.length - 1) {
        ctx.fillText(d.date, pL + (cW / Math.max(data.length - 1, 1)) * i, h - 6);
      }
    });
  }, [data]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold text-zinc-900">Thống kê lượt đọc</h3>
        <select value={range} onChange={e => setRange(e.target.value as TimeRange)}
          className="text-xs font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-md px-2.5 py-1 cursor-pointer focus:outline-none focus:border-blue-500">
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
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 pt-3.5 border-t border-zinc-100">
        {[
          { icon: "👁", val: fmtK(total), label: "Lượt đọc", g: "↑ 18%", color: "text-blue-500" },
          { icon: "❤", val: "4.8K", label: "Lượt thích", g: "↑ 12%", color: "text-rose-500" },
          { icon: "🔖", val: "2.1K", label: "Lượt theo dõi", g: "↑ 9%", color: "text-emerald-500" },
          { icon: "💬", val: "1.3K", label: "Bình luận", g: "↑ 15%", color: "text-amber-500" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`text-base ${s.color}`}>{s.icon}</span>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-zinc-900 leading-tight">{s.val}</span>
              <span className="text-[11px] text-zinc-400">{s.label}</span>
            </div>
            <span className="text-[11px] font-semibold text-green-500 ml-auto">{s.g}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
