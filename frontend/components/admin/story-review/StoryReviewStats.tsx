"use client";

import React from "react";
import type { StoryStatus } from "@/types/story";
import type { AdminStoryStatsData } from "@/types/story";

export type StoryFilterStatus = StoryStatus | "ALL" | "APPEALED";

interface Props {
  currentFilter: StoryFilterStatus;
  onFilterChange: (status: StoryFilterStatus) => void;
  stats?: AdminStoryStatsData;
  isLoading?: boolean;
}

export function StoryReviewStats({
  currentFilter,
  onFilterChange,
  stats,
  isLoading,
}: Props) {
  const statCards: {
    key: StoryFilterStatus;
    label: string;
    description: string;
    count?: number;
    badgeText?: string;
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
      key: "PENDING_REVIEW",
      label: "Chờ kiểm duyệt",
      description: "Cần thẩm định nội dung & bìa",
      count: stats?.pending,
      badgeText: stats?.pending !== undefined ? `${stats.pending}` : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-amber-500 bg-amber-50/60 shadow-sm",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-amber-100",
        iconText: "text-amber-600",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-700",
      },
    },
    {
      key: "APPEALED",
      label: "Có phản hồi / Khiếu nại",
      description: "Tác giả giải trình lý do từ chối",
      count: stats?.appealed,
      badgeText: stats?.appealed ? `${stats.appealed}` : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      colorClasses: {
        active: "border-indigo-500 bg-indigo-50/60 shadow-sm",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-indigo-100",
        iconText: "text-indigo-600",
        badgeBg: "bg-indigo-100",
        badgeText: "text-indigo-700",
      },
    },
    {
      key: "PUBLISHED",
      label: "Đã phê duyệt",
      description: "Đang xuất bản công khai",
      count: stats?.published,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-emerald-500 bg-emerald-50/60 shadow-sm",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-emerald-100",
        iconText: "text-emerald-600",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-700",
      },
    },
    {
      key: "REJECTED",
      label: "Bị từ chối",
      description: "Không đạt yêu cầu xuất bản",
      count: stats?.rejected,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClasses: {
        active: "border-rose-500 bg-rose-50/60 shadow-sm",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-rose-100",
        iconText: "text-rose-600",
        badgeBg: "bg-rose-100",
        badgeText: "text-rose-700",
      },
    },
    {
      key: "ALL",
      label: "Tất cả truyện",
      description: "Toàn bộ tác phẩm hệ thống",
      count: stats?.total,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      colorClasses: {
        active: "border-sky-500 bg-sky-50/60 shadow-sm",
        inactive: "border-slate-200 bg-white hover:border-slate-300",
        iconBg: "bg-sky-100",
        iconText: "text-sky-600",
        badgeBg: "bg-sky-100",
        badgeText: "text-sky-700",
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {statCards.map((card) => {
        const isCurrent = currentFilter === card.key;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onFilterChange(card.key)}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 ${
              isCurrent ? card.colorClasses.active : card.colorClasses.inactive
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${card.colorClasses.iconBg} ${card.colorClasses.iconText}`}
            >
              {card.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {card.label}
                </span>
                {card.badgeText !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${card.colorClasses.badgeBg} ${card.colorClasses.badgeText}`}
                  >
                    {isLoading ? "..." : card.badgeText}
                  </span>
                )}
              </div>
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
