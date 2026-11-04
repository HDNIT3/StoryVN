"use client";

import React from "react";
import Link from "next/link";

interface PaymentHistoryEmptyStateProps {
  isFiltering: boolean;
  onResetFilters: () => void;
}

export function PaymentHistoryEmptyState({
  isFiltering,
  onResetFilters,
}: PaymentHistoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-2xs sm:p-14">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-200">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <h3 className="font-serif text-base font-bold text-zinc-900 sm:text-lg">
        {isFiltering ? "Không có giao dịch nào khớp bộ lọc" : "Chưa có giao dịch thanh toán"}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-zinc-500 sm:text-sm">
        {isFiltering
          ? "Thử đổi từ khoá hoặc trạng thái để xem kết quả khác."
          : "Các đơn nạp Xu qua VNPay của bạn sẽ được lưu lại tại đây."}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {isFiltering ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="cursor-pointer rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            Xoá bộ lọc
          </button>
        ) : (
          <Link
            href="/nap-xu"
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-amber-600"
          >
            Nạp Xu ngay
          </Link>
        )}
        <Link
          href="/vi"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Xem ví của tôi
        </Link>
      </div>
    </div>
  );
}
