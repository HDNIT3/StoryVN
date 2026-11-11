"use client";

import React from "react";
import Link from "next/link";
import type { UnlockChapterResponse } from "../../types";
import type { ReaderThemeMode } from "./ReaderThemes";

interface ReaderUnlockModalProps {
  isOpen: boolean;
  storyTitle?: string;
  chapterNumber: number | string;
  chapterTitle?: string;
  coinPrice: number;
  walletBalance: number;
  isLoadingWallet: boolean;
  isPending: boolean;
  errorMessage: string | null;
  unlockResult: UnlockChapterResponse | null;
  theme: ReaderThemeMode;
  onConfirm: () => void;
  onClose: () => void;
}

export const ReaderUnlockModal: React.FC<ReaderUnlockModalProps> = ({
  isOpen,
  storyTitle,
  chapterNumber,
  chapterTitle,
  coinPrice,
  walletBalance,
  isLoadingWallet,
  isPending,
  errorMessage,
  unlockResult,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const remainingBalance = walletBalance - coinPrice;
  const isInsufficient = !isLoadingWallet && remainingBalance < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${unlockResult
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-amber-100 text-amber-600"
                }`}
            >
              {unlockResult ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </span>
            <h3 className="text-base font-bold text-zinc-900">
              {unlockResult ? "Kết quả giao dịch" : "Xác nhận mở khóa chương"}
            </h3>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition disabled:opacity-40 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {unlockResult ? (
          <div className="p-6 space-y-5">
            <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-4 text-center space-y-1.5">
              <p className="text-sm font-bold text-emerald-800">
                Mở khóa chương thành công!
              </p>
              <p className="text-xs text-emerald-700">
                Bạn đã sở hữu vĩnh viễn Chương {chapterNumber} và có thể đọc không giới hạn.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-zinc-600">
                <span>Chương đã mở khóa:</span>
                <span className="font-semibold text-zinc-900 truncate max-w-[220px]">
                  Chương {chapterNumber}: {chapterTitle}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Số Xu đã thanh toán:</span>
                <span className="font-bold text-rose-600">
                  -{unlockResult.unlock.coinPrice.toLocaleString("vi-VN")} Xu
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
                <span className="font-semibold text-zinc-700">Số dư ví còn lại:</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  {unlockResult.wallet.balance.toLocaleString("vi-VN")} Xu
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <span>Thời gian giao dịch:</span>
                <span>
                  {new Date(unlockResult.unlock.unlockedAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs cursor-pointer"
            >
              Đọc chương ngay
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Thông tin chương */}
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-1">
              {storyTitle && (
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 truncate">
                  {storyTitle}
                </p>
              )}
              <p className="text-sm font-bold text-zinc-900">
                Chương {chapterNumber}: {chapterTitle}
              </p>
            </div>

            {/* Chi tiết thanh toán Xu */}
            <div className="rounded-xl border border-zinc-200 p-4 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Giá mở khóa chương:</span>
                <span className="font-extrabold text-amber-600">
                  {coinPrice.toLocaleString("vi-VN")} Xu
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Số dư ví hiện tại:</span>
                <span className="font-bold text-zinc-900">
                  {isLoadingWallet
                    ? "Đang kiểm tra..."
                    : `${walletBalance.toLocaleString("vi-VN")} Xu`}
                </span>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                <span className="font-semibold text-zinc-700">Số dư sau khi mua:</span>
                <span
                  className={`font-extrabold ${isInsufficient ? "text-rose-600" : "text-emerald-600"
                    }`}
                >
                  {isLoadingWallet
                    ? "..."
                    : `${remainingBalance.toLocaleString("vi-VN")} Xu`}
                </span>
              </div>
            </div>

            {isInsufficient && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 font-medium space-y-2.5">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    Số dư Xu trong ví của bạn không đủ để mở khóa chương này (cần thêm{" "}
                    <strong className="font-bold text-rose-800">
                      {Math.abs(remainingBalance).toLocaleString("vi-VN")} Xu
                    </strong>
                    ).
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-end">
                  <Link
                    href="/nap-xu"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow-2xs cursor-pointer"
                  >
                    <span>Nạp Xu ngay</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium">
                {errorMessage}
              </div>
            )}

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Mỗi chương trả phí chỉ tính Xu một lần duy nhất. Sau khi mở khóa, bạn có thể đọc lại bất kỳ lúc nào.
            </p>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isPending}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              {isInsufficient ? (
                <Link
                  href="/nap-xu"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Nạp thêm Xu</span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={isPending || isLoadingWallet}
                  onClick={onConfirm}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPending
                    ? "Đang xử lý giao dịch..."
                    : `Xác nhận mua (${coinPrice.toLocaleString("vi-VN")} Xu)`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

