"use client";

import { useMemo, useState } from "react";

export type DateRangeMode = "all" | "day" | "month" | "year" | "custom";
export interface DateRange { startDate?: string; endDate?: string; }
export function dateRangeParams(range: DateRange = {}) {
  const params = new URLSearchParams();
  if (range.startDate !== undefined) params.set("startDate", range.startDate);
  if (range.endDate !== undefined) params.set("endDate", range.endDate);
  return params;
}
const DAY = 86400000;

function iso(date: Date) { return date.toISOString().slice(0, 10); }
function parse(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null; const date = new Date(`${value}T00:00:00Z`); return Number.isNaN(date.getTime()) || iso(date) !== value ? null : date; }
function todayVietnam() { return new Date(Date.now() + 7 * 3600000); }
function preset(mode: DateRangeMode): Required<DateRange> {
  const end = todayVietnam();
  const start = new Date(end);
  if (mode === "day") return { startDate: iso(end), endDate: iso(end) };
  if (mode === "month") start.setUTCDate(1);
  else if (mode === "year") { start.setUTCMonth(0, 1); }
  else start.setUTCDate(start.getUTCDate() - 29);
  return { startDate: iso(start), endDate: iso(end) };
}

export function validateDateRange(range: DateRange) {
  if (range.startDate === undefined && range.endDate === undefined) return null;
  if (!range.startDate || !range.endDate) return "Ngày bắt đầu và kết thúc phải được chọn cùng nhau";
  const start = parse(range.startDate); const end = parse(range.endDate);
  if (!start || !end) return "Ngày không hợp lệ";
  const days = Math.floor((end.getTime() - start.getTime()) / DAY) + 1;
  if (days < 1) return "Ngày bắt đầu phải trước ngày kết thúc";
  if (days > 366) return "Khoảng thời gian tối đa là 366 ngày";
  return null;
}

export function useDateRange() {
  const [mode, setMode] = useState<DateRangeMode>("all");
  const initial = useMemo(() => preset("custom"), []);
  const [value, setValue] = useState(initial.startDate);
  const [endValue, setEndValue] = useState(initial.endDate);
  let range: DateRange = mode === "all" ? {} : { startDate: value, endDate: endValue };
  if (mode === "day") range = { startDate: value, endDate: value };
  if (mode === "month" && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    range = { startDate: `${value}-01`, endDate: iso(new Date(Date.UTC(year, month, 0))) };
  }
  if (mode === "year" && /^\d{4}$/.test(value)) range = { startDate: `${value}-01-01`, endDate: `${value}-12-31` };
  const error = validateDateRange(range);
  const chooseMode = (next: DateRangeMode) => { setMode(next); const nextRange = preset(next); setValue(next === "month" ? nextRange.startDate.slice(0, 7) : next === "year" ? nextRange.startDate.slice(0, 4) : nextRange.startDate); setEndValue(nextRange.endDate); };
  return { range, mode, setMode: chooseMode, value, setValue, endValue, setEndValue, error, isValid: !error };
}
