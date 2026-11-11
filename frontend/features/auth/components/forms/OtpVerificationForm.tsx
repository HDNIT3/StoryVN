"use client";

import React from "react";
import { Button, OtpInput } from "@/components/ui";

export interface OtpVerificationFormProps {
  email: string;
  otp: string;
  setOtp: (otp: string) => void;
  isLoading: boolean;
  backendError?: string;
  countdown: number;
  isResending: boolean;
  handleVerifyOtp: (e?: React.FormEvent) => void;
  handleResendOtp: () => void;
  handleBackToForm: () => void;
}

export function OtpVerificationForm({
  email,
  otp,
  setOtp,
  isLoading,
  backendError,
  countdown,
  isResending,
  handleVerifyOtp,
  handleResendOtp,
  handleBackToForm,
}: OtpVerificationFormProps) {
  return (
    <form onSubmit={handleVerifyOtp} className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        {/* Security Shield Badge */}
        <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center shadow-2xs">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            Xác Thực Email
          </h2>
          <p className="text-sm text-zinc-500 font-normal">
            Nhập mã 6 chữ số được gửi tới email
          </p>
        </div>

        {/* Target Email Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs sm:text-sm font-semibold max-w-full">
          <svg className="w-4 h-4 shrink-0 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="truncate">{email}</span>
        </div>

        {/* 6 Digit OTP input */}
        <div className="w-full pt-4">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider text-center mb-3">
            MÃ XÁC THỰC 6 CHỮ SỐ (OTP)
          </label>
          <OtpInput
            length={6}
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
            hasError={Boolean(backendError)}
          />
          <p className="mt-2 text-center text-xs text-zinc-400">
            Nhập từng chữ số hoặc dán cả chuỗi 6 ký tự
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3.5">
        <button
          type="submit"
          disabled={isLoading || otp.trim().length !== 6}
          className="w-full py-3 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:bg-[#0369a1] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow active:scale-[0.99] transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Đang xác thực...</span>
            </span>
          ) : (
            "Xác Nhận & Hoàn Tất"
          )}
        </button>

        {/* Resend OTP row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs pt-1">
          <span className="text-zinc-500">Chưa nhận được mã qua hộp thư?</span>
          {countdown > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 font-semibold text-zinc-600 select-none">
              Gửi lại sau{" "}
              <span className="text-sky-600 font-bold tabular-nums">
                {countdown}s
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="font-bold text-sky-600 hover:text-sky-700 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isResending ? "Đang gửi..." : "Gửi lại mã OTP"}
            </button>
          )}
        </div>

        {/* Back to Step 1 */}
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={handleBackToForm}
            disabled={isLoading}
            className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium"
          >
            <span>←</span>
            <span>Thay đổi thông tin hoặc email</span>
          </button>
        </div>

        {/* Helpful Tip */}
        <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-800 text-xs flex items-start gap-2 text-left">
          <span className="text-amber-500 font-bold">ℹ</span>
          <span>
            <strong>Mẹo:</strong> Kiểm tra kỹ thư mục <u>Thư rác (Spam)</u> hoặc tab <u>Quảng cáo</u> nếu không thấy mã trong Hộp thư đến.
          </span>
        </div>
      </div>
    </form>
  );
}

export default OtpVerificationForm;
