"use client";

import React from "react";
import type { useDateRange } from "./date-range";

type DateState = ReturnType<typeof useDateRange>;
type ExportFormat = "xlsx" | "csv";

export function DateRangeToolbar({ dateRange, onExport, exportDisabled = false, exporting = false, disabled = false }: { dateRange: DateState; onExport?: (format: ExportFormat) => void; exportDisabled?: boolean; exporting?: boolean; disabled?: boolean }) {
  const [format, setFormat] = React.useState<ExportFormat>("xlsx");
  const locked = disabled || exporting;
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <label className="text-xs font-semibold text-slate-600">Khoảng thời gian
        <select disabled={locked} value={dateRange.mode} onChange={(e) => dateRange.setMode(e.target.value as DateState["mode"])} className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700">
          <option value="all">Toàn bộ thời gian</option><option value="custom">Tùy chọn</option><option value="day">Ngày</option><option value="week">Tuần (ISO)</option><option value="month">Tháng</option><option value="year">Năm</option>
        </select>
      </label>
      {dateRange.mode !== "all" && <label className="text-xs font-semibold text-slate-600">{dateRange.mode === "custom" ? "Từ" : dateRange.mode === "week" ? "Tuần / năm" : "Chọn"}
        <input disabled={locked} type={dateRange.mode === "month" ? "month" : dateRange.mode === "year" ? "number" : dateRange.mode === "week" ? "week" : "date"} min={dateRange.mode === "year" ? "1000" : undefined} max={dateRange.mode === "year" ? "9999" : undefined} value={dateRange.value} onChange={(e) => dateRange.setValue(e.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700" />
      </label>}
      {dateRange.mode === "custom" && <label className="text-xs font-semibold text-slate-600">Đến<input disabled={locked} type="date" value={dateRange.endValue} onChange={(e) => dateRange.setEndValue(e.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700" /></label>}
      {dateRange.mode === "week" && <span className="text-xs text-slate-500">{dateRange.range.startDate} đến {dateRange.range.endDate}</span>}
      <span className="text-xs text-slate-500">Giờ Việt Nam (UTC+7)</span>
      {dateRange.error && <span className="text-xs font-medium text-rose-600">{dateRange.error}</span>}
      {onExport && <><label className="text-xs font-semibold text-slate-600">Định dạng
        <select disabled={locked} value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700"><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option></select>
      </label><button type="button" onClick={() => onExport(format)} disabled={exportDisabled || exporting || !dateRange.isValid} className="ml-auto rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{exporting ? "Đang xuất..." : `Xuất ${format.toUpperCase()}`}</button></>}
    </div>
  );
}
