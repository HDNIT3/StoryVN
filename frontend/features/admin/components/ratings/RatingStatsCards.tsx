"use client";

import React from "react";
import type { AdminRatingCounts } from "../../types/rating.types";

interface RatingStatsCardsProps {
  counts?: AdminRatingCounts;
  isLoading?: boolean;
}

export function RatingStatsCards({ counts, isLoading }: RatingStatsCardsProps) {
  const stats = [
    {
      title: "Tổng lượt đánh giá",
      value: (counts?.total ?? 0).toLocaleString("vi-VN"),
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      bg: "bg-indigo-50",
    },
    {
      title: "Điểm trung bình",
      value: counts?.avgRating ? `${counts.avgRating.toFixed(1)} ★` : "0.0 ★",
      icon: (
        <span className="text-xl font-bold text-amber-500">★</span>
      ),
      bg: "bg-amber-50",
    },
    {
      title: "Đang hiển thị",
      value: (counts?.visible ?? 0).toLocaleString("vi-VN"),
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: "bg-emerald-50",
    },
    {
      title: "Đang bị ẩn / Xóa",
      value: ((counts?.hidden ?? 0) + (counts?.deleted ?? 0)).toLocaleString("vi-VN"),
      icon: (
        <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
            {item.icon}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.title}</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {isLoading ? (
                <span className="inline-block w-12 h-6 bg-slate-200 animate-pulse rounded" />
              ) : (
                item.value
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

