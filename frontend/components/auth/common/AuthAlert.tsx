"use client";

import React from "react";

interface AuthAlertProps {
  message?: string;
  error?: string;
}

export function AuthAlert({ message, error }: AuthAlertProps) {
  if (!message && !error) return null;

  if (error) {
    const displayError =
      error === "Failed to fetch" || error.includes("Failed to fetch")
        ? "Website chưa hoạt động vui lòng chờ"
        : error;

    return (
      <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-2xl flex items-start gap-2.5 text-red-600 text-xs animate-in fade-in duration-200">
        <svg
          className="w-4 h-4 shrink-0 mt-0.5 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="font-medium leading-relaxed">{displayError}</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-emerald-700 text-xs animate-in fade-in duration-200">
      <svg
        className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="font-medium leading-relaxed">{message}</span>
    </div>
  );
}
