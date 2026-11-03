"use client";

import React from "react";
import type { TransactionStatus } from "@/features/payments";

interface TransactionFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: TransactionStatus | "";
  onStatusChange: (status: TransactionStatus | "") => void;
  onReset: () => void;
}

export function TransactionFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onReset,
}: TransactionFilterBarProps) {
  const hasFilter = Boolean(search || status);

  const STATUS_TABS: Array<{ label: string; value: TransactionStatus | "" }> = [
    { label: "Tất cả", value: "" },
    { label: "Thành công", value: "SUCCESS" },
    { label: "Đang chờ", value: "PENDING" },
    { label: "Thất bại", value: "FAILED" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo mã đơn, mã VNPay, tên hoặc email..."
          className="w-full pl-9.5 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isSelected = status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusChange(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        {hasFilter && (
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors ml-1 cursor-pointer whitespace-nowrap"
            title="Xóa bộ lọc"
          >
            Đặt lại
          </button>
        )}
      </div>
    </div>
  );
}

