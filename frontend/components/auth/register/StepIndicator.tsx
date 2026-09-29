"use client";

import React from "react";

export interface StepIndicatorProps {
  currentStep: "form" | "otp";
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
          currentStep === "form"
            ? "bg-orange-100 text-orange-700"
            : "bg-zinc-100 text-zinc-500"
        }`}
      >
        <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px] font-bold">
          1
        </span>
        <span>Thông tin</span>
      </div>
      <div className="w-6 h-0.5 bg-zinc-200" />
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
          currentStep === "otp"
            ? "bg-orange-100 text-orange-700"
            : "bg-zinc-100 text-zinc-500"
        }`}
      >
        <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px] font-bold">
          2
        </span>
        <span>Xác thực OTP</span>
      </div>
    </div>
  );
}
