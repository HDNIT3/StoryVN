"use client";

import React, { useState } from "react";
import { StoryItem, useMyStoryDailyViews } from "@/features/stories";

interface StoryViewsAnalyticsModalProps {
  story: StoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryViewsAnalyticsModal({
  story,
  isOpen,
  onClose,
}: StoryViewsAnalyticsModalProps) {
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const storyId = story?._id || story?.id || story?.slug || "";
  const { data, isLoading } = useMyStoryDailyViews(
    storyId,
    days,
    isOpen && Boolean(storyId)
  );

  if (!isOpen || !story) return null;

  const summary = data?.story;
  const series = data?.series || [];
  const maxViews = Math.max(...series.map((d) => d.views), 1);
  const periodSum = series.reduce((sum, item) => sum + item.views, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50/80 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-sky-100 text-sky-600 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                Thống kê lượt đọc: {story.title}
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              Theo dõi lượt đọc chi tiết theo từng ngày, tuần, tháng và năm của tác phẩm
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/70 rounded-lg transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
                Hôm nay
              </span>
              <p className="text-xl font-extrabold text-zinc-900 mt-1">
                +{(summary?.viewsToday ?? story.stats?.viewsToday ?? 0).toLocaleString("vi-VN")}
              </p>
              <span className="text-[11px] text-zinc-500">lượt đọc trong ngày</span>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                7 ngày qua
              </span>
              <p className="text-xl font-extrabold text-zinc-900 mt-1">
                +{(summary?.viewsWeek ?? story.stats?.viewsWeek ?? 0).toLocaleString("vi-VN")}
              </p>
              <span className="text-[11px] text-zinc-500">lượt đọc tuần này</span>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                30 ngày qua
              </span>
              <p className="text-xl font-extrabold text-zinc-900 mt-1">
                +{(summary?.viewsMonth ?? story.stats?.viewsMonth ?? 0).toLocaleString("vi-VN")}
              </p>
              <span className="text-[11px] text-zinc-500">lượt đọc tháng này</span>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Tổng lượt đọc
              </span>
              <p className="text-xl font-extrabold text-zinc-900 mt-1">
                {(summary?.totalViews ?? story.stats?.viewCount ?? 0).toLocaleString("vi-VN")}
              </p>
              <span className="text-[11px] text-zinc-500">toàn thời gian</span>
            </div>
          </div>

          {/* Chart Filter & Bar Chart */}
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-sm font-bold text-zinc-900">
                  Biểu đồ lượt đọc {days} ngày gần nhất
                </h4>
                <p className="text-xs text-zinc-500">
                  Tổng trong kỳ:{" "}
                  <strong className="text-zinc-800">
                    {periodSum.toLocaleString("vi-VN")} lượt đọc
                  </strong>
                </p>
              </div>

              <div className="inline-flex items-center rounded-lg bg-zinc-100 p-0.5 border border-zinc-200">
                {([7, 30, 90] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      days === d
                        ? "bg-white text-sky-600 shadow-2xs"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {d} ngày
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="h-44 flex items-center justify-center text-xs text-zinc-400">
                Đang tải dữ liệu biểu đồ...
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 px-1 border-b border-zinc-100 overflow-x-auto">
                  {series.map((item) => {
                    const heightPct =
                      item.views > 0
                        ? Math.max(Math.round((item.views / maxViews) * 100), 8)
                        : 3;
                    return (
                      <div
                        key={item.date}
                        className="flex-1 min-w-[14px] flex flex-col items-center justify-end h-full group relative"
                        title={`${item.date}: ${item.views.toLocaleString("vi-VN")} lượt đọc`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-sky-700 mb-1 whitespace-nowrap">
                          {item.views > 0 ? item.views : ""}
                        </span>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t transition-all ${
                            item.views > 0
                              ? "bg-linear-to-t from-sky-600 to-sky-400 group-hover:from-sky-700 group-hover:to-sky-500"
                              : "bg-zinc-100"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                  <span>{series[0]?.label || ""}</span>
                  {series.length > 2 && (
                    <span>{series[Math.floor(series.length / 2)]?.label || ""}</span>
                  )}
                  <span>{series[series.length - 1]?.label || "Hôm nay"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

