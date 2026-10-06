"use client";

import React from "react";
import type { AuthorRequestStatus } from "@/types/author";

export type FilterStatus = AuthorRequestStatus | "ALL";

interface Props {
  currentFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  totalItems: number;
}

export function AuthorRequestStats({ currentFilter, onFilterChange }: Props) {
  const statCards: {
    status: FilterStatus;
    label: string;
    description: string;
    icon: React.ReactNode;
    colorClasses: {
      active: string;
      inactive: string;
      iconBg: string;
      iconText: string;
    };
  }[] = [
    {
      status: "ALL",
      label: "Tất cả yêu cầu",
      description: "Toàn bộ lịch sử yêu cầu",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      colorClasses: {
        active: "border-blue-500 bg-blue-50/50 shadow-sm",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-blue-100",
        iconText: "text-blue-600",
      },
    },
    {
      status: "PENDING",
      label: "Chờ xét duyệt",
      description: "Cần kiểm duyệt và xử lý",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-amber-500 bg-amber-50/50 shadow-sm",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-amber-100",
        iconText: "text-amber-600",
      },
    },
    {
      status: "APPROVED",
      label: "Đã phê duyệt",
      description: "Đã nâng cấp quyền tác giả",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-emerald-500 bg-emerald-50/50 shadow-sm",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-emerald-100",
        iconText: "text-emerald-600",
      },
    },
    {
      status: "REJECTED",
      label: "Đã từ chối",
      description: "Chưa đủ điều kiện xét duyệt",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-rose-500 bg-rose-50/50 shadow-sm",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-rose-100",
        iconText: "text-rose-600",
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statCards.map((card) => {
        const isSelected = currentFilter === card.status;
        return (
          <button
            key={card.status}
            onClick={() => onFilterChange(card.status)}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
              isSelected ? card.colorClasses.active : card.colorClasses.inactive
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${card.colorClasses.iconBg} ${card.colorClasses.iconText}`}>
                {card.icon}
              </span>
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{card.label}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">{card.description}</p>
          </button>
        );
      })}
    </div>
  );
}
