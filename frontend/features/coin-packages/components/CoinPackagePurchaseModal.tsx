"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CoinPackageItem } from "@/features/coin-packages/types";

interface CoinPackagePurchaseModalProps {
  isOpen: boolean;
  pkg: CoinPackageItem | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (pkg: CoinPackageItem) => void;
}

export function CoinPackagePurchaseModal({
  isOpen,
  pkg,
  isLoading = false,
  onClose,
  onConfirm,
}: CoinPackagePurchaseModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !pkg) return null;

  const handleConfirmClick = () => {
    if (!termsAccepted) {
      setErrorMessage("Vui lòng tích chọn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật trước khi thanh toán!");
      return;
    }
    setErrorMessage("");
    onConfirm(pkg);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Modal Header ────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-100/80 border border-amber-200/80 flex items-center justify-center p-1.5 shrink-0">
              <Image
                src="/icon/coin.svg"
                alt="Coin"
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-base font-bold text-slate-900">Xác nhận nạp Xu</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ─── Modal Body: 1 page, 2 cột (Trái: Thông tin gói, Phải: Danh sách thanh toán) ── */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* CỘT BÊN TRÁI: THÔNG TIN GÓI NẠP (Đã bỏ toàn bộ mô tả và text thừa) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Thông tin gói nạp
                </span>
                {pkg.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
                    ⭐ Phổ biến
                  </span>
                )}
              </div>

              <div className="bg-slate-50/80 border border-slate-200 rounded-md p-4 space-y-3">
                {/* Tên gói */}
                <h4 className="text-base font-bold text-slate-900">{pkg.name}</h4>

                {/* Tổng Xu nhận được */}
                <div className="p-3 bg-linear-to-r from-amber-100/70 via-amber-50 to-orange-50/50 border border-amber-200 rounded-md text-center">
                  <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide block">
                    Tổng Xu nhận được
                  </span>
                  <div className="flex items-center justify-center gap-2 mt-0.5">
                    <div className="relative w-6 h-6 shrink-0">
                      <Image
                        src="/icon/coin.svg"
                        alt="Xu"
                        width={24}
                        height={24}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
                      {pkg.totalCoin.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-xs font-extrabold text-amber-700 uppercase">Xu</span>
                  </div>
                </div>

                {/* Chi tiết phân rã số Xu */}
                <div className="space-y-2 text-xs border-t border-slate-200/80 pt-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Xu gốc:</span>
                    <span className="font-semibold text-slate-800">
                      {pkg.coinAmount.toLocaleString("vi-VN")} Xu
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Xu khuyến mãi:</span>
                    {pkg.bonusCoin > 0 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200">
                        +{pkg.bonusCoin.toLocaleString("vi-VN")} Xu
                      </span>
                    ) : (
                      <span className="text-slate-400">0 Xu</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-dashed border-slate-200">
                    <span className="font-medium">Số tiền cần nạp:</span>
                    <span className="text-base font-black text-indigo-700">
                      {formatCurrency(pkg.price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT BÊN PHẢI: PHƯƠNG THỨC THANH TOÁN (Chỉ hiện logo & tên phương thức) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Phương thức thanh toán
                </span>
              </div>

              {/* Card VNPAY gọn gàng: chỉ logo + tên */}
              <div className="rounded-md p-4 border-2 border-blue-600 bg-blue-50/30 flex items-center justify-between gap-3 select-none">
                <div className="flex items-center gap-3">
                  {/* VNPAY Brand Logo */}
                  <div className="h-9 px-3 rounded-md bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24]" />
                    <div className="flex items-baseline font-black text-base tracking-tight leading-none">
                      <span className="text-[#ED1C24]">VN</span>
                      <span className="text-[#005BAA]">PAY</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Cổng thanh toán VNPAY</h5>
                  </div>
                </div>

                {/* Checked Icon */}
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-3 h-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Alert Sandbox thu nhỏ trong modal */}
              <div className="mt-3.5 p-3 rounded-lg border border-amber-300 bg-amber-50 text-[11px] sm:text-xs text-amber-800 flex items-start gap-2">
                <span className="text-base shrink-0 leading-none">⚠️</span>
                <span>
                  <strong>Lưu ý:</strong> Cổng VNPay chạy sandbox thử nghiệm đồ án. Vui lòng chỉ sử dụng thông tin thẻ test.
                </span>
              </div>
            </div>
          </div>

          {/* Ô Checkbox Điều khoản bắt buộc */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs sm:text-sm text-slate-700">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (e.target.checked) setErrorMessage("");
                }}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
              />
              <span>
                Tôi đã đọc và đồng ý với{" "}
                <Link
                  href="/dieu-khoan-dich-vu"
                  target="_blank"
                  className="text-sky-600 font-bold hover:underline"
                >
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link
                  href="/chinh-sach-bao-mat"
                  target="_blank"
                  className="text-sky-600 font-bold hover:underline"
                >
                  Chính sách bảo mật
                </Link>
              </span>
            </label>
            {errorMessage && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium">
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* ─── Modal Footer: Hủy hoặc Đồng ý ───────────────────────── */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 w-full sm:w-auto justify-between sm:justify-start">
            <span>Tổng thanh toán:</span>
            <span className="text-lg font-black text-indigo-700">
              {formatCurrency(pkg.price)}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isLoading || !termsAccepted}
              onClick={handleConfirmClick}
              className="flex-1 sm:flex-none px-5 py-2 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Đang kết nối VNPay...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận nạp</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
