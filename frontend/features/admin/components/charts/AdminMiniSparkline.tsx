"use client";

import React from "react";

interface AdminMiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function AdminMiniSparkline({
  data,
  color = "#6366f1",
  width = 80,
  height = 28,
}: AdminMiniSparklineProps) {
  if (!data || data.length < 2) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padX = 2;
  const padY = 3;
  const usableWidth = width - padX * 2;
  const usableHeight = height - padY * 2;

  const points = data.map((val, i) => {
    const x = padX + (i / (data.length - 1)) * usableWidth;
    const y = padY + usableHeight - ((val - min) / range) * usableHeight;
    return { x, y };
  });

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

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

