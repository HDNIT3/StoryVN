"use client";

import React from "react";
import Link from "next/link";
import type { TransactionStatus } from "../types";

const STATUS_TABS: { value: TransactionStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "PENDING", label: "Đang xử lý" },
  { value: "FAILED", label: "Thất bại" },
];

interface PaymentHistoryFilterBarProps {
  totalItems: number;
  searchInput: string;
  status: TransactionStatus | "";
  isFiltering: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TransactionStatus | "") => void;
  onResetFilters: () => void;
}

export function PaymentHistoryFilterBar({
  totalItems,
  searchInput,
  status,
  isFiltering,
  onSearchChange,
  onStatusChange,
  onResetFilters,
}: PaymentHistoryFilterBarProps) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Lịch sử thanh toán
            </h1>
            {totalItems > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-amber-700 ring-1 ring-amber-200">
                {totalItems} giao dịch
              </span>
            )}
          </div>

          <p className="mt-1 max-w-[65ch] text-xs text-zinc-500 sm:text-sm">
            Theo dõi các đơn nạp Xu đã tạo qua VNPay, trạng thái xử lý và số Xu được cộng vào ví.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
          <Link
            href="/vi"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 sm:text-sm"
          >
            Ví của tôi
          </Link>
          <Link
            href="/nap-xu"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-amber-600 sm:text-sm"
          >
            Nạp Xu
          </Link>
        </div>
      </div>

      <div className="mt-5 space-y-3.5 border-t border-zinc-100 pt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm theo mã đơn hàng hoặc mã giao dịch VNPay..."
              aria-label="Tìm kiếm giao dịch"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-9 text-xs text-zinc-900 transition placeholder:text-zinc-400 hover:bg-zinc-100/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 sm:text-sm"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            {searchInput && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Xoá từ khoá tìm kiếm"
                className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_TABS.map((tab) => {
              const isActive = status === tab.value;
              return (
                <button
                  key={tab.value || "all"}
                  type="button"
                  onClick={() => onStatusChange(tab.value)}
                  aria-pressed={isActive}
                  className={`cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-sky-500 text-white shadow-2xs"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

            {isFiltering && (
              <button
                type="button"
                onClick={onResetFilters}
                className="cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                Xoá bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
