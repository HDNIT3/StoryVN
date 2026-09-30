"use client";

import React from "react";

export interface StepIndicatorProps {
  currentStep: "form" | "otp";
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-3">
      <div
        className={`flex items-center gap-2 text-sm font-bold px-3.5 py-1.5 rounded-full ${
          currentStep === "form"
            ? "bg-sky-100 text-sky-700"
            : "bg-zinc-100 text-zinc-500"
        }`}
      >
        <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-xs font-black">
          1
        </span>
        <span>Thông tin</span>
      </div>
      <div className="w-8 h-0.5 bg-zinc-200" />
      <div
        className={`flex items-center gap-2 text-sm font-bold px-3.5 py-1.5 rounded-full ${
          currentStep === "otp"
            ? "bg-sky-100 text-sky-700"
            : "bg-zinc-100 text-zinc-500"
        }`}
      >
        <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-xs font-black">
          2
        </span>
        <span>Xác thực OTP</span>
      </div>
    </div>
  );
}
