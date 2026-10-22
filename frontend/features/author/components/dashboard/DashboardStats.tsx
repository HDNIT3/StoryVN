"use client";

import React from "react";

interface DashboardStatsProps {
  totalStories: number;
  totalChapters: number;
  totalViews: number;
  totalCoins: number;
  storiesGrowth?: string;
  chaptersGrowth?: string;
  viewsGrowth?: string;
  coinsGrowth?: string;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("vi-VN");
};

export function DashboardStats({
  totalStories,
  totalChapters,
  totalViews,
  totalCoins,
  storiesGrowth = "+1 tháng này",
  chaptersGrowth = "+12 tháng này",
  viewsGrowth = "+18% so với tháng trước",
  coinsGrowth = "+320,000 tháng này",
}: DashboardStatsProps) {
  const stats = [
    {
      label: "Tổng số tác phẩm",
      value: totalStories,
      growth: storiesGrowth,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
    },
    {
      label: "Tổng số chương",
      value: totalChapters,
      growth: chaptersGrowth,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    },
    {
      label: "Tổng lượt đọc",
      value: formatNumber(totalViews),
      growth: viewsGrowth,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>,
    },
    {
      label: "Tổng xu nhận được",
      value: formatNumber(totalCoins),
      growth: coinsGrowth,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-3.5 bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
            <svg className={`w-5 h-5 ${s.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>{s.icon}</svg>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-zinc-500 mb-0.5">{s.label}</span>
            <span className="text-2xl font-extrabold text-zinc-900 tracking-tight leading-tight">{s.value}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-500 mt-0.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {s.growth}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
