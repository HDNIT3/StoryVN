"use client";

import { useMemo, useState } from "react";

export type DateRangeMode = "all" | "day" | "week" | "month" | "year" | "custom";
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
function isoWeekValue(dateOnly: string) {
  const date = parse(dateOnly);
  if (!date) return "";
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * DAY));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
function preset(mode: DateRangeMode): Required<DateRange> {
  const end = todayVietnam();
  const start = new Date(end);
  if (mode === "day") return { startDate: iso(end), endDate: iso(end) };
  if (mode === "week") {
    const monday = new Date(end);
    const weekday = (monday.getUTCDay() + 6) % 7;
    monday.setUTCDate(monday.getUTCDate() - weekday);
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    return { startDate: iso(monday), endDate: iso(sunday) };
  }
  if (mode === "month") start.setUTCDate(1);
  else if (mode === "year") { start.setUTCMonth(0, 1); }
  else start.setUTCDate(start.getUTCDate() - 29);
  return { startDate: iso(start), endDate: iso(end) };
}

export function validateDateRange(range: DateRange) {
  if (range.startDate === undefined && range.endDate === undefined) return null;
  if (!range.startDate || !range.endDate) return "NgÃ y báº¯t Ä‘áº§u vÃ  káº¿t thÃºc pháº£i Ä‘Æ°á»£c chá»n cÃ¹ng nhau";
  const start = parse(range.startDate); const end = parse(range.endDate);
  if (!start || !end) return "NgÃ y khÃ´ng há»£p lá»‡";
  const days = Math.floor((end.getTime() - start.getTime()) / DAY) + 1;
  if (days < 1) return "NgÃ y báº¯t Ä‘áº§u pháº£i trÆ°á»›c ngÃ y káº¿t thÃºc";
  if (days > 366) return "Khoáº£ng thá»i gian tá»‘i Ä‘a lÃ  366 ngÃ y";
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
  let invalidWeek = false;
  if (mode === "week" && /^\d{4}-W\d{2}$/.test(value)) {
    const [year, week] = value.split("-W").map(Number);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (week - 1) * 7);
    invalidWeek = isoWeekValue(iso(monday)) !== value;
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    range = { startDate: iso(monday), endDate: iso(sunday) };
  }
  const error = invalidWeek ? "Invalid ISO week for selected year" : validateDateRange(range);
  const chooseMode = (next: DateRangeMode) => { setMode(next); const nextRange = preset(next); setValue(next === "month" ? nextRange.startDate.slice(0, 7) : next === "year" ? nextRange.startDate.slice(0, 4) : next === "week" ? isoWeekValue(iso(todayVietnam())) : nextRange.startDate); setEndValue(nextRange.endDate); };
  return { range, mode, setMode: chooseMode, value, setValue, endValue, setEndValue, error, isValid: !error };
}
