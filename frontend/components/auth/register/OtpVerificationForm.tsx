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
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-xs text-zinc-500">
            Nhập mã 6 chữ số được gửi tới
          </p>
          <p className="text-sm font-semibold text-zinc-800 break-all">
            {email}
          </p>
        </div>

        {/* 6 Digit OTP input */}
        <div className="py-2">
          <OtpInput
            length={6}
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
            hasError={Boolean(backendError)}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={otp.trim().length !== 6}
        >
          Xác Nhận & Hoàn Tất
        </Button>

        {/* Resend OTP button */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-zinc-500">Không nhận được mã?</span>
          {countdown > 0 ? (
            <span className="text-zinc-400 font-medium select-none">
              Gửi lại sau{" "}
              <span className="text-sky-600 font-semibold tabular-nums">
                {countdown}s
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="font-semibold text-sky-600 hover:text-sky-700 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isResending ? "Đang gửi..." : "Gửi lại mã OTP"}
            </button>
          )}
        </div>

        {/* Change details / Back to Step 1 */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleBackToForm}
            disabled={isLoading}
            className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Thay đổi thông tin hoặc email</span>
          </button>
        </div>
      </div>
    </form>
  );
}
