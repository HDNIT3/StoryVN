"use client";

import React from "react";

export interface AdminStatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string; // Ví dụ: "border-sky-100 text-sky-800"
  isActive?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
  hasAlert?: boolean;
  className?: string;
}

export function AdminStatCard({
  label,
  value,
  icon,
  color = "border-slate-200 text-slate-800",
  isActive = false,
  onClick,
  badge,
  hasAlert = false,
  className = "",
}: AdminStatCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`rounded-2xl border p-4 sm:p-4.5 flex items-center gap-3.5 sm:gap-4 bg-white shadow-xs transition-all relative overflow-hidden select-none ${
        isClickable ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      } ${
        isActive
          ? "ring-2 ring-indigo-500/40 border-indigo-500 shadow-sm bg-gradient-to-br from-white to-indigo-50/30"
          : ""
      } ${color} ${className}`}
    >
      {/* Alert ping dot khi có thông báo cần chú ý */}
      {hasAlert && (
        <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
      )}

      {/* Khối Icon (Đồng bộ chuẩn 100% với trang quản lý người dùng) */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white/80 shadow-xs border border-current/10">
        {icon}
      </div>

      {/* Khối dữ liệu số lượng & nhãn */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <p className="text-xl sm:text-2xl font-black tracking-tight truncate text-slate-900">
            {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
          </p>
          {badge}
        </div>
        <p className="text-xs font-semibold opacity-70 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

export default AdminStatCard;
