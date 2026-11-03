"use client";

import React from "react";
import { Button } from "@/components/ui";
import type { CoinPackageItem } from "@/features/coin-packages/types";

interface Props {
  open: boolean;
  pkg: CoinPackageItem | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function CoinPackageDeleteModal({
  open,
  pkg,
  isLoading,
  onClose,
  onConfirm,
}: Props) {
  if (!open || !pkg) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-base font-bold text-slate-900">
            Xác nhận xóa gói nạp Xu?
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Bạn có chắc chắn muốn xóa gói nạp này? Hành động này không thể hoàn tác.
          </p>

          <div className="mt-3.5 p-3 bg-slate-50 rounded-lg text-left text-xs">
            <p className="font-bold text-slate-900">{pkg.name}</p>
            <div className="flex items-center justify-between text-slate-500 mt-1">
              <span>Giá: <strong className="text-indigo-600">{formatCurrency(pkg.price)}</strong></span>
              <span>Tổng nhận: <strong className="text-amber-600 font-bold">{pkg.totalCoin} Xu</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs px-4 py-2 flex-1 rounded-lg"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            className="text-xs px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white flex-1 font-bold rounded-lg shadow-xs"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xóa...
              </span>
            ) : (
              "Xóa gói nạp"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
