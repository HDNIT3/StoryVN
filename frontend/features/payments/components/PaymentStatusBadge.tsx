"use client";

import React from "react";
import type { TransactionStatus } from "../types";

const STATUS_MAP: Record<
  TransactionStatus,
  { label: string; className: string; dotClassName: string }
> = {
  SUCCESS: {
    label: "Thành công",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClassName: "bg-emerald-500",
  },
  PENDING: {
    label: "Đang xử lý",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dotClassName: "bg-amber-500 animate-pulse",
  },
  FAILED: {
    label: "Thất bại",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    dotClassName: "bg-rose-500",
  },
};

export function PaymentStatusBadge({ status }: { status: TransactionStatus }) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClassName}`} />
      {config.label}
    </span>
  );
}
