"use client";

import React from "react";
import Image from "next/image";
import { formatDateTime } from "@/lib/utils/format";
import type { PaymentHistoryItem } from "../types";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export function PaymentHistoryRow({ item }: { item: PaymentHistoryItem }) {
  const isSuccess = item.status === "SUCCESS";

  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      {/* Gói nạp + mã đơn */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50">
          <Image
            src="/icon/coin.svg"
            alt="Xu"
            width={22}
            height={22}
            className="h-5 w-5 object-contain"
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {item.packageName}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-zinc-500">
            Mã đơn: <span className="font-medium text-zinc-600">{item.orderCode}</span>
          </p>
        </div>
      </div>

      {/* Số tiền + Xu */}
      <div className="flex items-center justify-between gap-4 sm:block sm:w-36 sm:shrink-0 sm:text-right">
        <p className="text-sm font-bold tabular-nums text-zinc-900">
          {formatCurrency(item.amount)}
        </p>
        <p
          className={`mt-0.5 text-xs font-semibold tabular-nums ${
            isSuccess ? "text-amber-600" : "text-zinc-400"
          }`}
        >
          {isSuccess ? `+${item.totalCoin.toLocaleString("vi-VN")} Xu` : `${item.totalCoin.toLocaleString("vi-VN")} Xu`}
        </p>
      </div>

      {/* Trạng thái + thời gian */}
      <div className="flex items-center justify-between gap-3 border-t border-dashed border-zinc-100 pt-2.5 sm:block sm:w-40 sm:shrink-0 sm:border-0 sm:pt-0 sm:text-right">
        <PaymentStatusBadge status={item.status} />
        <p className="text-[11px] text-zinc-400 sm:mt-1">
          {formatDateTime(item.createdAt)}
        </p>
      </div>
    </div>
  );
}
