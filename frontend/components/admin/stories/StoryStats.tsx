"use client";

import React from "react";
import type { StoryStatus } from "@/types/story";
import { AdminStatCard } from "@/components/admin/common/AdminStatCard";

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
    count: number;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      tab: "ALL",
      label: "Tổng tác phẩm",
      count: counts?.all ?? 0,
      icon: (
        <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "border-sky-100 text-sky-800",
    },
    {
      tab: "PENDING_REVIEW",
      label: "Chờ xét duyệt",
      count: counts?.pending ?? 0,
      icon: (
        <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "border-amber-100 text-amber-800",
    },
    {
      tab: "PUBLISHED",
      label: "Đã xuất bản",
      count: counts?.published ?? 0,
      icon: (
        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "border-emerald-100 text-emerald-800",
    },
    {
      tab: "REJECTED",
      label: "Bị từ chối",
      count: counts?.rejected ?? 0,
      icon: (
        <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "border-rose-100 text-rose-800",
    },
    {
      tab: "HIDDEN",
      label: "Bị ẩn",
      count: counts?.hidden ?? 0,
      icon: (
        <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      ),
      color: "border-purple-100 text-purple-800",
    },
    {
      tab: "DRAFT",
      label: "Bản nháp",
      count: counts?.draft ?? 0,
      icon: (
        <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: "border-slate-200 text-slate-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
      {cards.map((card) => {
        const isActive = currentFilter === card.tab;
        const isPending = card.tab === "PENDING_REVIEW";
        const hasPendingAlert = isPending && card.count > 0;

        return (
          <AdminStatCard
            key={card.tab}
            label={card.label}
            value={card.count}
            icon={card.icon}
            color={card.color}
            isActive={isActive}
            hasAlert={hasPendingAlert}
            onClick={() => onFilterChange(card.tab)}
          />
        );
      })}
    </div>
  );
}

export default StoryStats;
