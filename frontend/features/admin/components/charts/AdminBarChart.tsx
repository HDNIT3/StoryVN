"use client";

import React, { useState } from "react";
import { AdminChartTooltip } from "./AdminChartTooltip";
import { useChartAxis } from "./useChartAxis";

export interface BarChartItem {
  label: string;
  value: number;
  secondaryValue?: number;
  tooltipTitle?: string;
  color?: string;
}

interface AdminBarChartProps {
  data: BarChartItem[];
  title?: string;
  subtitle?: string;
  height?: number;
  barColor?: string;
  secondaryBarColor?: string;
  primaryLegend?: string;
  secondaryLegend?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  showXAxisLabels?: boolean;
}

export function AdminBarChart({
  data,
  title,
  subtitle,
  height = 240,
  barColor = "#4f46e5",
  secondaryBarColor = "#10b981",
  primaryLegend,
  secondaryLegend,
  valuePrefix = "",
  valueSuffix = "",
  showXAxisLabels = true,
}: AdminBarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { ref: chartRef, width: chartWidthPx, tickIndices, axisLabel } = useChartAxis(data);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <span className="text-xs font-medium">Chưa có dữ liệu biểu đồ cột</span>
      </div>
    );
  }

  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);

  // Tính max value
  const allValues = data.flatMap((d) => [d.value, d.secondaryValue || 0]);
  const rawMax = allValues.reduce((max, value) => Math.max(max, value), 0);
  const maxVal = rawMax === 0 ? 10 : Math.ceil(rawMax * 1.15);

  const svgWidth = chartWidthPx;
  const svgHeight = height;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = showXAxisLabels ? 35 : 12;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const groupWidth = chartWidth / data.length;
  const barWidth = hasSecondary ? Math.min(groupWidth * 0.35, 20) : Math.min(groupWidth * 0.6, 32);

  // 4 ticks for Y axis
  const yTicks = [0, 0.33, 0.66, 1].map((pct) => {
    const val = pct * maxVal;
    const y = padTop + chartHeight - pct * chartHeight;
    return { val, y };
  });

  return (
    <div ref={chartRef} className="w-full">
      {(title || subtitle || primaryLegend) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
          <div>
            {title && <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {(primaryLegend || secondaryLegend) && (
            <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
              {primaryLegend && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: barColor }} />
                  <span>{primaryLegend}</span>
                </div>
              )}
              {secondaryLegend && hasSecondary && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: secondaryBarColor }} />
                  <span>{secondaryLegend}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative w-full select-none" onMouseLeave={() => setHoverIndex(null)}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Lưới ngang */}
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
                x={padLeft - 8}
                y={tick.y + 3.5}
                textAnchor="end"
                className="text-[11px] fill-slate-400 font-medium"
              >
                {Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(tick.val))}
              </text>
            </g>
          ))}

          {/* Các cột dữ liệu */}
          {data.map((item, i) => {
            const groupX = padLeft + i * groupWidth;
            const primaryHeight = (item.value / maxVal) * chartHeight;
            const primaryY = padTop + chartHeight - primaryHeight;

            let secondaryHeight = 0;
            let secondaryY = 0;
            if (hasSecondary && item.secondaryValue !== undefined) {
              secondaryHeight = (item.secondaryValue / maxVal) * chartHeight;
              secondaryY = padTop + chartHeight - secondaryHeight;
            }

            const isHovered = hoverIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer transition-opacity duration-150"
                opacity={hoverIndex === null || isHovered ? 1 : 0.45}
                onMouseEnter={() => setHoverIndex(i)}
              >
                {/* The entire time bucket remains hoverable, including zero values. */}
                  <rect
                    x={groupX}
                    y={padTop}
                    width={groupWidth}
                    height={chartHeight}
                    fill={isHovered ? "#f1f5f9" : "transparent"}
                    rx={6}
                  />

                {hasSecondary ? (
                  <>
                    {/* Cột 1 */}
                    <rect
                      x={groupX + groupWidth / 2 - barWidth - 2}
                      y={primaryY}
                      width={barWidth}
                      height={primaryHeight}
                      fill={item.color || barColor}
                      rx={4}
                    />
                    {/* Cột 2 */}
                    <rect
                      x={groupX + groupWidth / 2 + 2}
                      y={secondaryY}
                      width={barWidth}
                      height={secondaryHeight}
                      fill={secondaryBarColor}
                      rx={4}
                    />
                  </>
                ) : (
                  <rect
                    x={groupX + (groupWidth - barWidth) / 2}
                    y={primaryY}
                    width={barWidth}
                    height={primaryHeight}
                    fill={item.color || barColor}
                    rx={5}
                  />
                )}

                {/* Nhãn trục X */}
                {showXAxisLabels && tickIndices.has(i) && <text
                  x={groupX + groupWidth / 2}
                  y={svgHeight - 10}
                  textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered ? "fill-indigo-600 font-bold" : "fill-slate-400"
                  }`}
                >
                  {axisLabel(item)}
                </text>}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && data[hoverIndex] && (
          <AdminChartTooltip anchorPercent={((padLeft + hoverIndex * groupWidth + groupWidth / 2) / svgWidth) * 100}>
              <div className="text-[10px] text-slate-300 font-semibold mb-1">
                {data[hoverIndex].tooltipTitle || data[hoverIndex].label}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: barColor }} />
                <span className="text-slate-300">{primaryLegend || "Giá trị"}:</span>
                <span className="font-bold text-white">
                  {valuePrefix}
                  {data[hoverIndex].value.toLocaleString("vi-VN")}
                  {valueSuffix}
                </span>
              </div>
              {hasSecondary && data[hoverIndex].secondaryValue !== undefined && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryBarColor }} />
                  <span className="text-slate-300">{secondaryLegend || "Phụ"}:</span>
                  <span className="font-bold text-white">
                    {data[hoverIndex].secondaryValue!.toLocaleString("vi-VN")}
                  </span>
                </div>
              )}
          </AdminChartTooltip>
        )}
      </div>
    </div>
  );
}

