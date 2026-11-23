"use client";

import React from "react";
import { AdminMiniSparkline } from "./AdminMiniSparkline";

interface AdminMetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: number; // e.g. +12 or -5
    label?: string; // e.g. "so với tháng trước"
    isPositive?: boolean;
  };
  icon: React.ReactNode;
  sparklineData?: number[];
  colorScheme?: "indigo" | "emerald" | "amber" | "sky" | "rose" | "violet";
  onClick?: () => void;
}

const COLOR_CLASSES = {
  indigo: {
    bgIcon: "bg-admin-brand-50 text-admin-brand-600",
    border: "border-admin-brand-100/80 hover:border-admin-brand-300",
    sparkColor: "#465fff",
  },
  emerald: {
    bgIcon: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100/80 hover:border-emerald-300",
    sparkColor: "#10b981",
  },
  amber: {
    bgIcon: "bg-amber-50 text-amber-600",
    border: "border-amber-100/80 hover:border-amber-300",
    sparkColor: "#f59e0b",
  },
  sky: {
    bgIcon: "bg-admin-brand-50 text-admin-brand-600",
    border: "border-admin-brand-100/80 hover:border-admin-brand-300",
    sparkColor: "#0284c7",
  },
  rose: {
    bgIcon: "bg-rose-50 text-rose-600",
    border: "border-rose-100/80 hover:border-rose-300",
    sparkColor: "#f43f5e",
  },
  violet: {
    bgIcon: "bg-violet-50 text-violet-600",
    border: "border-violet-100/80 hover:border-violet-300",
    sparkColor: "#8b5cf6",
  },
};

export function AdminMetricCard({
  label,
  value,
  subValue,
  trend,
  icon,
  sparklineData,
  colorScheme = "indigo",
  onClick,
}: AdminMetricCardProps) {
  const styles = COLOR_CLASSES[colorScheme] || COLOR_CLASSES.indigo;

  return (
    <div
      onClick={onClick}
      className={`admin-stat-card bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-admin-card ${styles.border} ${
        onClick ? "cursor-pointer hover:shadow-md " : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="admin-metric-label text-xs font-semibold text-gray-500 uppercase tracking-wider truncate mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
            </h3>
          </div>
          {subValue && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{subValue}</p>
          )}
        </div>

        <div className={`admin-stat-icon w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${styles.bgIcon} shadow-admin-card`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        {trend ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                trend.isPositive !== false
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "bg-rose-50 text-rose-700 font-medium"
              }`}
            >
              {trend.isPositive !== false ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
            </span>
            {trend.label && <span className="text-xs text-gray-400 font-normal">{trend.label}</span>}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Dữ liệu thời gian thực</span>
        )}

        {sparklineData && sparklineData.length > 1 && (
          <div className="shrink-0">
            <AdminMiniSparkline data={sparklineData} color={styles.sparkColor} />
          </div>
        )}
      </div>
    </div>
  );
}

