"use client";

import React from "react";
import type { ChapterStatus } from "@/types/chapter";

export type ChapterFilterTab = "ALL" | ChapterStatus;

interface Props {
  currentFilter: ChapterFilterTab;
  onFilterChange: (tab: ChapterFilterTab) => void;
  counts?: {
    all: number;
    pending: number;
    published: number;
    rejected: number;
    draft: number;
    hidden: number;
  };
}

export function ChapterStats({ currentFilter, onFilterChange, counts }: Props) {
  const cards: {
    tab: ChapterFilterTab;
    label: string;
    description: string;
    count: number;
    icon: React.ReactNode;
    colorClasses: {
      active: string;
      inactive: string;
      iconBg: string;
      iconText: string;
      badgeBg: string;
      badgeText: string;
    };
  }[] = [
    {
      tab: "ALL",
      label: "Tất cả chương",
      description: "Toàn bộ chương trong hệ thống",
      count: counts?.all ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      colorClasses: {
        active: "border-sky-500 bg-sky-50/50 shadow-xs ring-1 ring-sky-400/30",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-sky-100",
        iconText: "text-sky-600",
        badgeBg: "bg-sky-100",
        badgeText: "text-sky-700",
      },
    },
    {
      tab: "PENDING_REVIEW",
      label: "Chờ xét duyệt",
      description: "Chương mới tác giả gửi duyệt",
      count: counts?.pending ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-400/40",
        inactive: "border-slate-200 bg-white hover:border-amber-300",
        iconBg: "bg-amber-100",
        iconText: "text-amber-600",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-700",
      },
    },
    {
      tab: "PUBLISHED",
      label: "Đã xuất bản",
      description: "Độc giả đang đọc công khai",
      count: counts?.published ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-400/30",
        inactive: "border-slate-200 bg-white hover:border-emerald-300",
        iconBg: "bg-emerald-100",
        iconText: "text-emerald-600",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-700",
      },
    },
    {
      tab: "REJECTED",
      label: "Bị từ chối",
      description: "Cần tác giả sửa & gửi lại",
      count: counts?.rejected ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-rose-500 bg-rose-50/50 shadow-xs ring-1 ring-rose-400/30",
        inactive: "border-slate-200 bg-white hover:border-rose-300",
        iconBg: "bg-rose-100",
        iconText: "text-rose-600",
        badgeBg: "bg-rose-100",
        badgeText: "text-rose-700",
      },
    },
    {
      tab: "DRAFT",
      label: "Bản nháp / Gỡ duyệt",
      description: "Đang soạn hoặc đã bị gỡ",
      count: counts?.draft ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      colorClasses: {
        active: "border-slate-500 bg-slate-50 shadow-xs ring-1 ring-slate-400/30",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-slate-100",
        iconText: "text-slate-600",
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700",
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const isActive = currentFilter === card.tab;
        return (
          <button
            key={card.tab}
            type="button"
            onClick={() => onFilterChange(card.tab)}
            className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              isActive ? card.colorClasses.active : card.colorClasses.inactive
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${card.colorClasses.iconBg} ${card.colorClasses.iconText}`}
              >
                {card.icon}
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.colorClasses.badgeBg} ${card.colorClasses.badgeText}`}
              >
                {card.count.toLocaleString("vi-VN")}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              {card.label}
            </p>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
              {card.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
