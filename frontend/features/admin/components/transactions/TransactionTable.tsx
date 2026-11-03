"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { AdminTransactionItem } from "@/features/payments";
import { toast } from "@/lib/toast";

interface TransactionTableProps {
  items: AdminTransactionItem[];
  isLoading: boolean;
  onViewDetail: (tx: AdminTransactionItem) => void;
}

export function TransactionTable({
  items,
  isLoading,
  onViewDetail,
}: TransactionTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.info("Đã chép mã đơn hàng!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-10 text-center">
        <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Đang tải danh sách giao dịch...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">Không tìm thấy giao dịch nào</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Chưa có giao dịch thanh toán nào phù hợp với bộ lọc tìm kiếm hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── DESKTOP TABLE (Ẩn trên Mobile) ───────────────────────── */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Mã đơn hàng</th>
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Gói nạp</th>
                <th className="py-3 px-4 text-right">Số tiền</th>
                <th className="py-3 px-4 text-center">Xu nhận</th>
                <th className="py-3 px-4">Cổng / Ngân hàng</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((tx) => {
                const isSuccess = tx.status === "SUCCESS";
                const isFailed = tx.status === "FAILED";
                const isPending = tx.status === "PENDING";

                return (
                  <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Mã đơn */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                        <span>{tx.orderCode}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(tx.orderCode)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                          title="Sao chép"
                        >
                          {copiedId === tx.orderCode ? (
                            <span className="text-emerald-600 font-bold text-[10px]">✓</span>
                          ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {tx.transactionNo && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          GD: {tx.transactionNo}
                        </span>
                      )}
                    </td>

                    {/* Người dùng */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden text-[11px]">
                          {tx.userId?.avatarUrl ? (
                            <Image
                              src={tx.userId.avatarUrl}
                              alt={tx.userId.displayName}
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            tx.userId?.displayName?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                        <div className="min-w-0 max-w-[140px]">
                          <p className="font-semibold text-slate-900 truncate">
                            {tx.userId?.displayName || "Ẩn danh"}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {tx.userId?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Gói nạp */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {tx.packageId?.name || "Gói Xu"}
                    </td>

                    {/* Số tiền */}
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatCurrency(tx.amount)}
                    </td>

                    {/* Xu nhận */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <Image src="/icon/coin.svg" alt="Xu" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                        <span>{tx.totalCoin.toLocaleString("vi-VN")}</span>
                      </div>
                    </td>

                    {/* Cổng / Ngân hàng */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <span className="text-[#ED1C24] font-black text-[11px]">VN</span>
                        <span className="text-[#005BAA] font-black text-[11px]">PAY</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {tx.bankCode || "VNPAY-QR"}
                      </span>
                    </td>

                    {/* Thời gian */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isSuccess
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isFailed
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {isSuccess && "✓ Thành công"}
                        {isFailed && "✕ Thất bại"}
                        {isPending && "⏳ Đang chờ"}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onViewDetail(tx)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MOBILE CARDS (Hiển thị trên Mobile & Tablet) ──────────── */}
      <div className="lg:hidden space-y-3">
        {items.map((tx) => {
          const isSuccess = tx.status === "SUCCESS";
          const isFailed = tx.status === "FAILED";
          const isPending = tx.status === "PENDING";

          return (
            <div
              key={tx._id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
            >
              {/* Header card: Mã đơn + Trạng thái */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {tx.orderCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(tx.orderCode)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {copiedId === tx.orderCode ? (
                      <span className="text-emerald-600 font-bold text-[10px]">✓</span>
                    ) : (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSuccess
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : isFailed
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {isSuccess && "✓ Thành công"}
                  {isFailed && "✕ Thất bại"}
                  {isPending && "⏳ Đang chờ"}
                </span>
              </div>

              {/* Thông tin tiền & xu */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    Số tiền
                  </span>
                  <span className="font-black text-slate-900">{formatCurrency(tx.amount)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    Xu nhận
                  </span>
                  <div className="flex items-center justify-end gap-1 font-bold text-amber-600">
                    <Image src="/icon/coin.svg" alt="Xu" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                    <span>{tx.totalCoin.toLocaleString("vi-VN")} Xu</span>
                  </div>
                </div>
              </div>

              {/* Chi tiết phụ & Người dùng */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                    {tx.userId?.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="truncate text-slate-800 font-medium">
                    {tx.userId?.displayName || "Ẩn danh"}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">{formatDate(tx.createdAt)}</span>
              </div>

              {/* Nút xem chi tiết */}
              <button
                type="button"
                onClick={() => onViewDetail(tx)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Xem chi tiết giao dịch
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

