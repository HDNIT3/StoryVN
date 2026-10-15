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
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      colorClasses: {
        active: "border-sky-400/80 bg-sky-50/40 shadow-xs ring-2 ring-sky-300/40",
        inactive: "border-transparent bg-white/70 hover:bg-white hover:border-slate-200",
        iconBg: "bg-sky-100",
        iconText: "text-sky-600",
        badgeBg: "bg-sky-100",
        badgeText: "text-sky-700",
      },
    },
    {
      tab: "PENDING_REVIEW",
      label: "Chờ xét duyệt",
      description: "Chờ admin một giá gửi duyệt",
      count: counts?.pending ?? 0,
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-amber-400 bg-amber-50/50 shadow-sm ring-1 ring-amber-300/50",
        inactive: "border-transparent bg-white/70 hover:bg-white hover:border-amber-200",
        iconBg: "bg-amber-100",
        iconText: "text-amber-600",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-800",
      },
    },
    {
      tab: "PUBLISHED",
      label: "Đã xuất bản",
      description: "Độc giả đang đọc công khai",
      count: counts?.published ?? 0,
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-emerald-400 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-300/40",
        inactive: "border-transparent bg-white/70 hover:bg-white hover:border-emerald-200",
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
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-rose-400 bg-rose-50/40 shadow-xs ring-2 ring-rose-300/40",
        inactive: "border-transparent bg-white/70 hover:bg-white hover:border-rose-200",
        iconBg: "bg-rose-100",
        iconText: "text-rose-600",
        badgeBg: "bg-rose-100",
        badgeText: "text-rose-700",
      },
    },
    {
      tab: "HIDDEN",
      label: "Chương bị ẩn",
      description: "Đang tạm ẩn khỏi công khai",
      count: counts?.hidden ?? 0,
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      ),
      colorClasses: {
        active: "border-purple-400 bg-purple-50/40 shadow-xs ring-2 ring-purple-300/40",
        inactive: "border-transparent bg-white/70 hover:bg-white hover:border-purple-200",
        iconBg: "bg-purple-100",
        iconText: "text-purple-600",
        badgeBg: "bg-purple-100",
        badgeText: "text-purple-700",
      },
    },
    {
      tab: "DRAFT",
      label: "Bản nháp / Gỡ duyệt",
      description: "Đang soạn hoặc đã bị gỡ",
      count: counts?.draft ?? 0,
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      colorClasses: {
        active: "border-slate-400 bg-slate-100/70 shadow-xs ring-2 ring-slate-300/40",
        inactive: "border-transparent bg-white/70 hover:bg-white hover:border-slate-200",
        iconBg: "bg-slate-100",
        iconText: "text-slate-600",
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700",
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const isActive = currentFilter === card.tab;
        return (
          <button
            key={card.tab}
            type="button"
            onClick={() => onFilterChange(card.tab)}
            className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-xs group shadow-2xs ${
              isActive ? card.colorClasses.active : card.colorClasses.inactive
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${card.colorClasses.iconBg} ${card.colorClasses.iconText}`}
              >
                {card.icon}
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${card.colorClasses.badgeBg} ${card.colorClasses.badgeText}`}
              >
                {card.count.toLocaleString("vi-VN")}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
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
