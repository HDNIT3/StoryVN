"use client";

import React from "react";
import Link from "next/link";

interface StoryRevisionHistoryPanelProps {
  identifier: string;
}

export function StoryRevisionHistoryPanel({
  identifier,
}: StoryRevisionHistoryPanelProps) {
  return (
    <div className="mt-6 bg-white rounded-xl border border-zinc-200/90 shadow-2xs">
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">
            Lịch sử chỉnh sửa tác phẩm
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Xem lại và khôi phục nội dung của các bản sửa trước đó (tối đa 50 bản).
          </p>
        </div>
        <Link
          href={`/tac-gia/tac-pham/lich-su?story=${identifier}`}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Mở lịch sử chỉnh sửa</span>
        </Link>
      </div>
    </div>
  );
}
