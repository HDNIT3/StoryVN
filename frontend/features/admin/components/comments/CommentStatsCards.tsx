"use client";

import React from "react";
import type { AdminCommentCounts } from "../../types/comment.types";

interface CommentStatsCardsProps {
  counts?: AdminCommentCounts;
  isLoading?: boolean;
}

export function CommentStatsCards({ counts, isLoading }: CommentStatsCardsProps) {
  const stats = [
    {
      title: "Tổng bình luận",
      value: counts?.total ?? 0,
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      bg: "bg-indigo-50",
    },
    {
      title: "Đang hiển thị",
      value: counts?.visible ?? 0,
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: "bg-emerald-50",
    },
    {
      title: "Đang bị ẩn",
      value: counts?.hidden ?? 0,
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      ),
      bg: "bg-amber-50",
    },
    {
      title: "Đã xóa (Lưu vết)",
      value: counts?.deleted ?? 0,
      icon: (
        <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                item.value.toLocaleString("vi-VN")
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

