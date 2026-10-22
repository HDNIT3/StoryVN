"use client";

import React from "react";
import type { AuthorRequestStatus } from "@/features/author";
import { AdminStatCard } from "../common/AdminStatCard";

export type FilterStatus = AuthorRequestStatus | "ALL";

interface Props {
  currentFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  totalItems: number;
  counts?: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export function AuthorRequestStats({
  currentFilter,
  onFilterChange,
  totalItems,
  counts,
}: Props) {
  const statCards: {
    status: FilterStatus;
    label: string;
    count: number;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      status: "ALL",
      label: "Tất cả yêu cầu",
      count: counts?.all ?? totalItems,
      icon: (
        <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: "border-sky-100 text-sky-800",
    },
    {
      status: "PENDING",
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
      status: "APPROVED",
      label: "Đã phê duyệt",
      count: counts?.approved ?? 0,
      icon: (
        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "border-emerald-100 text-emerald-800",
    },
    {
      status: "REJECTED",
      label: "Đã từ chối",
      count: counts?.rejected ?? 0,
      icon: (
        <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "border-rose-100 text-rose-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {statCards.map((card) => {
        const isActive = currentFilter === card.status;
        const isPending = card.status === "PENDING";
        const hasPendingAlert = isPending && card.count > 0;

        return (
          <AdminStatCard
            key={card.status}
            label={card.label}
            value={card.count}
            icon={card.icon}
            color={card.color}
            isActive={isActive}
            hasAlert={hasPendingAlert}
            onClick={() => onFilterChange(card.status)}
          />
        );
      })}
    </div>
  );
}

export default AuthorRequestStats;

