"use client";

import React from "react";

export interface StepIndicatorProps {
  currentStep: "form" | "otp";
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-3">
      <div
        className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full ${
          currentStep === "form"
            ? "bg-sky-100 text-sky-700"
            : "bg-zinc-100 text-zinc-500"
        }`}
      >
        <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-current text-white flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0">
          1
        </span>
        <span className="whitespace-nowrap">Thông tin</span>
      </div>
      <div className="w-5 sm:w-8 h-0.5 bg-zinc-200 shrink-0" />
      <div
        className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full ${
          currentStep === "otp"
            ? "bg-sky-100 text-sky-700"
            : "bg-zinc-100 text-zinc-500"
        }`}
      >
        <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-current text-white flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0">
          2
        </span>
        <span className="whitespace-nowrap">Xác thực OTP</span>
      </div>
    </div>
  );
}
