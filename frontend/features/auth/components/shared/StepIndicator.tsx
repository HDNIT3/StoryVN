"use client";

import React from "react";
import type { RegisterStep } from "../../types";

export interface StepIndicatorProps {
  currentStep: RegisterStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const isOtp = currentStep === "otp";

  return (
    <div className="flex items-center justify-between max-w-xs mx-auto mb-6">
      {/* Step 1: Info */}
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            isOtp
              ? "bg-emerald-500 text-white shadow-2xs"
              : "bg-sky-500 text-white shadow-2xs shadow-sky-500/25"
          }`}
        >
          {isOtp ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            "1"
          )}
        </div>
        <div className="text-left">
          <span className="text-xs font-bold text-zinc-900 block leading-tight">Thông tin</span>
          <span className="text-[10px] text-zinc-400 font-medium">
            {isOtp ? "Đã xong" : "Bước 1/2"}
          </span>
        </div>
      </div>

      {/* Connector line */}
      <div className="flex-1 mx-3 h-0.5 bg-zinc-200 rounded-full relative overflow-hidden">
        <div
          className={`h-full bg-sky-500 transition-all duration-300 ${
            isOtp ? "w-full" : "w-1/2"
          }`}
        />
      </div>

      {/* Step 2: OTP */}
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            isOtp
              ? "bg-sky-500 text-white shadow-2xs shadow-sky-500/30"
              : "bg-zinc-100 text-zinc-400 border border-zinc-200/80"
          }`}
        >
          2
        </div>
        <div className="text-left">
          <span
            className={`text-xs font-bold block leading-tight ${
              isOtp ? "text-sky-600" : "text-zinc-500"
            }`}
          >
            Xác thực OTP
          </span>
          <span className="text-[10px] text-zinc-400 font-medium">Bước 2/2</span>
        </div>
      </div>
    </div>
  );
}

export default StepIndicator;
