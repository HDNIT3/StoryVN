"use client";

import React, { useState } from "react";

export interface AreaChartDataPoint {
  label: string; // e.g. "12/11"
  value: number; // main value e.g. 500000
  secondaryValue?: number; // e.g. 12 transactions
  tooltipTitle?: string; // e.g. "12/11/2026"
}

interface AdminAreaChartProps {
  data: AreaChartDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  secondaryLabel?: string;
  colorScheme?: "indigo" | "emerald" | "violet" | "sky" | "amber";
  formatValue?: (val: number) => string;
}

const COLOR_MAP = {
  indigo: {
    stroke: "#6366f1",
    fillStart: "rgba(99, 102, 241, 0.35)",
    fillEnd: "rgba(99, 102, 241, 0.01)",
    point: "#4f46e5",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  emerald: {
    stroke: "#10b981",
    fillStart: "rgba(16, 185, 129, 0.35)",
    fillEnd: "rgba(16, 185, 129, 0.01)",
    point: "#059669",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  violet: {
    stroke: "#8b5cf6",
    fillStart: "rgba(139, 92, 246, 0.35)",
    fillEnd: "rgba(139, 92, 246, 0.01)",
    point: "#7c3aed",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  sky: {
    stroke: "#0284c7",
    fillStart: "rgba(2, 132, 199, 0.35)",
    fillEnd: "rgba(2, 132, 199, 0.01)",
    point: "#0369a1",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
  amber: {
    stroke: "#f59e0b",
    fillStart: "rgba(245, 158, 11, 0.35)",
    fillEnd: "rgba(245, 158, 11, 0.01)",
    point: "#d97706",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export function AdminAreaChart({
  data,
  title,
  subtitle,
  height = 240,
  valuePrefix = "",
  valueSuffix = "",
  secondaryLabel = "Lượt",
  colorScheme = "indigo",
  formatValue,
}: AdminAreaChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-medium">Chưa có dữ liệu thống kê chuỗi thời gian</span>
      </div>
    );
  }

  const colors = COLOR_MAP[colorScheme] || COLOR_MAP.indigo;

  // Tìm min và max value
  const values = data.map((d) => d.value);
  const rawMax = Math.max(...values, 0);
  const rawMin = Math.min(...values, 0);

  // Thêm padding cho min max
  const maxVal = rawMax === 0 ? 100 : Math.ceil(rawMax * 1.15);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  // Kích thước SVG
  const svgWidth = 800;
  const svgHeight = height;
  const padLeft = 60;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Tính tọa độ các điểm
  const points = data.map((d, index) => {
    const x = padLeft + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padTop + chartHeight - ((d.value - minVal) / range) * chartHeight;
    return { x, y, data: d, index };
  });

  // Tạo đường Bezier cong mượt
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX1 = curr.x + (next.x - curr.x) / 2;
    const cpY1 = curr.y;
    const cpX2 = curr.x + (next.x - curr.x) / 2;
    const cpY2 = next.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
  }

  // Tạo đường Area đóng đáy
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + chartHeight} L ${points[0].x} ${padTop + chartHeight} Z`;

  // Các nấc trục Y (4 nấc)
  const yTicks = [0, 0.33, 0.66, 1].map((pct) => {
    const val = minVal + pct * range;
    const y = padTop + chartHeight - pct * chartHeight;
    return { val, y };
  });

  // Định dạng số
  const defaultFormat = (val: number) => {
    if (val >= 1_000_000) {
      return (val / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (val >= 1_000) {
      return (val / 1_000).toFixed(0) + "k";
    }
    return val.toLocaleString("vi-VN");
  };

  const formatter = formatValue || defaultFormat;

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="w-full">
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-1">
          <div>
            {title && <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {activePoint && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 font-medium">{activePoint.data.label}:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${colors.badge}`}>
                {valuePrefix}
                {activePoint.data.value.toLocaleString("vi-VN")}
                {valueSuffix}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`area-grad-${colorScheme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.38" />
              <stop offset="85%" stopColor={colors.stroke} stopOpacity="0.04" />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.00" />
            </linearGradient>
            <filter id="glow-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={colors.stroke} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Lưới trục Y và nhãn */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={svgWidth - padRight}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeDasharray={i === 0 ? "none" : "3 3"}
                strokeWidth={1}
              />
              <text
                x={padLeft - 10}
                y={tick.y + 3.5}
                textAnchor="end"
                className="text-[11px] fill-slate-400 font-medium"
              >
                {formatter(tick.val)}
              </text>
            </g>
          ))}

          {/* Trục X nhãn ngày */}
          {points.map((p, i) => {
            // Hiển thị cách quãng để không bị chật nếu nhiều điểm
            const showLabel =
              data.length <= 14
                ? true
                : i === 0 ||
                  i === points.length - 1 ||
                  i % Math.ceil(data.length / 7) === 0;

            if (!showLabel) return null;
            return (
              <text
                key={i}
                x={p.x}
                y={svgHeight - 10}
                textAnchor="middle"
                className="text-[11px] fill-slate-400 font-medium"
              >
                {p.data.label}
              </text>
            );
          })}

          {/* Vùng gradient mượt */}
          <path d={areaD} fill={`url(#area-grad-${colorScheme})`} />

          {/* Đường nét chính cong spline */}
          <path
            d={pathD}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cột dọc khi Hover */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padTop}
                x2={activePoint.x}
                y2={padTop + chartHeight}
                stroke={colors.stroke}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                opacity={0.8}
              />
              {/* Vòng tròn điểm phát sáng */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={6}
                fill={colors.stroke}
                stroke="#ffffff"
                strokeWidth={2.5}
                filter="url(#glow-shadow)"
              />
            </g>
          )}

          {/* Điểm tương tác vô hình trên toàn bộ chiều cao */}
          {points.map((p, i) => (
            <rect
              key={i}
              x={p.x - (chartWidth / (data.length - 1 || 1)) / 2}
              y={padTop}
              width={chartWidth / (data.length - 1 || 1)}
              height={chartHeight + padBottom}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}
        </svg>

        {/* Floating Tooltip HTML Overlay */}
        {activePoint && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-100 ease-out"
            style={{
              left: `${(activePoint.x / svgWidth) * 100}%`,
              top: `${(activePoint.y / svgHeight) * 100}%`,
              transform: `translate(-50%, -120%)`,
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-xs text-white px-3 py-2 rounded-xl shadow-xl text-xs whitespace-nowrap border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] text-slate-300 font-semibold mb-1">
                {activePoint.data.tooltipTitle || activePoint.data.label}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.stroke }} />
                <span className="font-bold text-sm text-white">
                  {valuePrefix}
                  {activePoint.data.value.toLocaleString("vi-VN")}
                  {valueSuffix}
                </span>
              </div>
              {activePoint.data.secondaryValue !== undefined && (
                <div className="text-[11px] text-slate-300 mt-0.5">
                  {secondaryLabel}: <span className="font-medium text-white">{activePoint.data.secondaryValue.toLocaleString("vi-VN")}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

