"use client";

import React from "react";
import type { StoryStatus, StoryVisibility } from "@/types/story";

export type StoryFilterTab = "ALL" | StoryStatus | "HIDDEN";

interface Props {
  currentFilter: StoryFilterTab;
  onFilterChange: (tab: StoryFilterTab) => void;
  counts?: {
    all: number;
    pending: number;
    published: number;
    rejected: number;
    draft: number;
    hidden: number;
  };
}

export function StoryStats({ currentFilter, onFilterChange, counts }: Props) {
  const cards: {
    tab: StoryFilterTab;
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
      label: "Tất cả tác phẩm",
      description: "Toàn bộ tác phẩm hệ thống",
      count: counts?.all ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      colorClasses: {
        active: "border-sky-500 bg-sky-50/50 shadow-xs",
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
      description: "Cần admin / quản lý duyệt",
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
        badgeText: "text-amber-800",
      },
    },
    {
      tab: "PUBLISHED",
      label: "Đã xuất bản",
      description: "Đang phát hành công khai",
      count: counts?.published ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-emerald-500 bg-emerald-50/50 shadow-xs",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-emerald-100",
        iconText: "text-emerald-600",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-700",
      },
    },
    {
      tab: "REJECTED",
      label: "Bị từ chối",
      description: "Chưa đạt yêu cầu kiểm duyệt",
      count: counts?.rejected ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-rose-500 bg-rose-50/50 shadow-xs",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-rose-100",
        iconText: "text-rose-600",
        badgeBg: "bg-rose-100",
        badgeText: "text-rose-700",
      },
    },
    {
      tab: "HIDDEN",
      label: "Bị ẩn / Cấm",
      description: "Chế độ riêng tư (không public)",
      count: counts?.hidden ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      ),
      colorClasses: {
        active: "border-purple-500 bg-purple-50/50 shadow-xs",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-purple-100",
        iconText: "text-purple-600",
        badgeBg: "bg-purple-100",
        badgeText: "text-purple-700",
      },
    },
    {
      tab: "DRAFT",
      label: "Bản nháp",
      description: "Tác giả đang soạn thảo / gỡ",
      count: counts?.draft ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      colorClasses: {
        active: "border-slate-600 bg-slate-100 shadow-xs",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-slate-100",
        iconText: "text-slate-600",
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700",
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-6">
      {cards.map((card) => {
        const isActive = currentFilter === card.tab;
        const isPending = card.tab === "PENDING_REVIEW";
        const hasPendingAlert = isPending && card.count > 0;

        return (
          <button
            key={card.tab}
            type="button"
            onClick={() => onFilterChange(card.tab)}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden group ${
              isActive ? card.colorClasses.active : card.colorClasses.inactive
            }`}
          >
            {/* Chấm tròn nhấp nháy nếu có bài chờ duyệt */}
            {hasPendingAlert && (
              <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            )}

            <div className="flex items-center justify-between gap-2 mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${card.colorClasses.iconBg} ${card.colorClasses.iconText}`}
              >
                {card.icon}
              </div>

              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full ${card.colorClasses.badgeBg} ${card.colorClasses.badgeText}`}
              >
                {card.count}
              </span>
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {card.label}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {card.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
