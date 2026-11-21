"use client";

import { useEffect, useRef, useState } from "react";

type AxisItem = { label: string; tooltipTitle?: string };

export function useChartAxis(data: AxisItem[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [data.length]);

  const tickCount = Math.min(data.length, Math.max(2, Math.min(8, Math.floor((width - 80) / 80))));
  const tickIndices = new Set(Array.from({ length: tickCount }, (_, index) =>
    tickCount === 1 ? 0 : Math.round(index * (data.length - 1) / (tickCount - 1)),
  ));
  const dateOf = (item?: AxisItem) => {
    const text = item?.tooltipTitle || item?.label || "";
    const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const local = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
    return local ? `${local[3]}-${local[2]}-${local[1]}` : undefined;
  };
  const firstDate = dateOf(data[0]);
  const lastDate = dateOf(data[data.length - 1]);
  const longRange = !!firstDate && !!lastDate && new Date(lastDate).getTime() - new Date(firstDate).getTime() > 366 * 86400000;
  const axisLabel = (item: AxisItem) => {
    const date = dateOf(item);
    if (date) return longRange ? `${date.slice(5, 7)}/${date.slice(0, 4)}` : `${date.slice(8)}/${date.slice(5, 7)}`;
    return item.label.length > 12 ? `${item.label.slice(0, 11)}…` : item.label;
  };

  return { ref, width: Math.max(width, 240), tickIndices, axisLabel };
}
