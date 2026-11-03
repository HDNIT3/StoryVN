"use client";

import React from "react";
import Image from "next/image";
import type { AdminTransactionItem } from "@/features/payments";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: AdminTransactionItem | null;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  if (!isOpen || !transaction) return null;

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
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isSuccess = transaction.status === "SUCCESS";
  const isFailed = transaction.status === "FAILED";
  const isPending = transaction.status === "PENDING";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Chi tiết giao dịch
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-base font-mono font-bold text-slate-900">
                {transaction.orderCode}
              </h2>
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
                {isPending && "⏳ Đang chờ xác nhận"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Thông tin người dùng */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Người thực hiện
            </span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-200 overflow-hidden">
                {transaction.userId?.avatarUrl ? (
                  <Image
                    src={transaction.userId.avatarUrl}
                    alt={transaction.userId.displayName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  transaction.userId?.displayName?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 truncate">
                  {transaction.userId?.displayName || "Người dùng ẩn danh"}
                </p>
                <p className="text-slate-500 text-[11px] truncate">
                  {transaction.userId?.email || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Snapshot gói nạp & số xu */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Số tiền thanh toán
              </span>
              <p className="text-lg font-black text-slate-900">
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                Gói: {transaction.packageId?.name || "Gói Xu"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Tổng Xu nhận
              </span>
              <div className="flex items-center gap-1.5">
                <div className="relative w-4 h-4 shrink-0">
                  <Image src="/icon/coin.svg" alt="Xu" width={16} height={16} className="w-full h-full object-contain" />
                </div>
                <p className="text-lg font-black text-amber-600">
                  {transaction.totalCoin.toLocaleString("vi-VN")} Xu
                </p>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gốc: {transaction.coinAmount} | Thưởng: +{transaction.bonusCoin}
              </p>
            </div>
          </div>

          {/* Chi tiết VNPay */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Thông tin cổng thanh toán VNPay
            </span>
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
              <div className="flex items-center justify-between p-2.5">
                <span className="text-slate-500">Cổng thanh toán:</span>
                <span className="font-semibold text-slate-800">VNPay Sandbox</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-slate-500">Mã GD VNPay:</span>
                <span className="font-mono text-slate-800">{transaction.transactionNo || "—"}</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-semibold text-slate-800">{transaction.bankCode || "—"}</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-slate-500">Loại thẻ:</span>
                <span className="text-slate-700">{transaction.cardType || "—"}</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-slate-500">Mã kết quả (ResponseCode):</span>
                <span className="font-mono font-bold text-slate-800">
                  {transaction.vnpResponseCode || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-slate-500">Thời gian tạo:</span>
                <span className="text-slate-700">{formatDate(transaction.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-slate-500">Cập nhật lần cuối:</span>
                <span className="text-slate-700">{formatDate(transaction.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

