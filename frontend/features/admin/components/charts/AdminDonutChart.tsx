"use client";

import React, { useState } from "react";

export interface DonutSegment {
  id: string;
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

interface AdminDonutChartProps {
  data: DonutSegment[];
  title?: string;
  subtitle?: string;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
  showLegend?: boolean;
}

const DEFAULT_COLORS = [
  "#4f46e5", // Indigo
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#64748b", // Slate
];

export function AdminDonutChart({
  data,
  title,
  subtitle,
  size = 200,
  thickness = 28,
  centerLabel = "Tổng",
  centerValue,
  showLegend = true,
}: AdminDonutChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <span className="text-xs font-medium">Chưa có dữ liệu phân bổ</span>
      </div>
    );
  }

  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;

  // Tính bán kính và chu vi
  const radius = size / 2 - thickness / 2;
  const circumference = 2 * Math.PI * radius;

  // Chuẩn bị segments với màu sắc và offset
  let accumulatedPercent = 0;
  const segments = data.map((item, index) => {
    const pct = item.value / total;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += pct;
    const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    const percentage = item.percentage ?? Math.round(pct * 100);

    return {
      ...item,
      color,
      percentage,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSegment = segments.find((s) => s.id === hoveredId);

  return (
    <div className="w-full">
      {(title || subtitle) && (
        <div className="pb-3">
          {title && <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* SVG Circle */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={thickness}
            />

            {/* Segments */}
            {segments.map((seg) => {
              const isHovered = hoveredId === seg.id;
              return (
                <circle
                  key={seg.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? thickness + 4 : thickness}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className="cursor-pointer transition-all duration-200"
                  opacity={hoveredId === null || isHovered ? 1 : 0.45}
                  onMouseEnter={() => setHoveredId(seg.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              );
            })}
          </svg>

          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate max-w-[110px]">
              {activeSegment ? activeSegment.name : centerLabel}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeSegment
                ? activeSegment.value.toLocaleString("vi-VN")
                : centerValue !== undefined
                ? typeof centerValue === "number"
                  ? centerValue.toLocaleString("vi-VN")
                  : centerValue
                : total.toLocaleString("vi-VN")}
            </span>
            {activeSegment && (
              <span className="text-xs font-bold text-indigo-600 mt-0.5">
                {activeSegment.percentage}%
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
            {segments.map((seg) => {
              const isHovered = hoveredId === seg.id;
              return (
                <div
                  key={seg.id}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isHovered
                      ? "bg-slate-100/90 font-bold shadow-2xs"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                  onMouseEnter={() => setHoveredId(seg.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-3 h-3 rounded-md shrink-0 shadow-2xs"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="truncate">{seg.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-slate-800">
                      {seg.value.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      {seg.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

