"use client";

import React from "react";
import Link from "next/link";
import type {
  AdminDashboardUrgentStory,
  AdminDashboardUrgentChapter,
  AdminDashboardUrgentAuthorRequest,
} from "../../types/dashboard.types";

interface AdminUrgentQueueCardProps {
  stories: AdminDashboardUrgentStory[];
  chapters: AdminDashboardUrgentChapter[];
  authorRequests: AdminDashboardUrgentAuthorRequest[];
  totalPendingStories: number;
  totalPendingChapters: number;
  totalPendingAuthorRequests: number;
}

export function AdminUrgentQueueCard({
  stories,
  chapters,
  authorRequests,
  totalPendingStories,
  totalPendingChapters,
  totalPendingAuthorRequests,
}: AdminUrgentQueueCardProps) {
  const total = totalPendingStories + totalPendingChapters + totalPendingAuthorRequests;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Hàng Đợi Cần Xử Lý Gấp
              {total > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 animate-pulse">
                  {total}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">Các tác phẩm, chương và yêu cầu đang chờ phê duyệt</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Cột 1: Truyện chờ duyệt */}
        <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Truyện chờ duyệt
              </span>
              <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {totalPendingStories}
              </span>
            </div>
            {stories.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic text-center">Không có truyện nào chờ duyệt</p>
            ) : (
              <div className="space-y-2 mt-2">
                {stories.slice(0, 3).map((s) => (
                  <div key={s._id} className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs text-xs">
                    <p className="font-semibold text-slate-800 truncate">{s.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">Bởi: {s.authorName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/quan-ly/truyen"
            className="mt-3 block text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 py-1.5 rounded-lg transition-colors"
          >
            Đến trang duyệt truyện &rarr;
          </Link>
        </div>

        {/* Cột 2: Chương chờ duyệt */}
        <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Chương chờ duyệt
              </span>
              <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {totalPendingChapters}
              </span>
            </div>
            {chapters.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic text-center">Không có chương nào chờ duyệt</p>
            ) : (
              <div className="space-y-2 mt-2">
                {chapters.slice(0, 3).map((c) => (
                  <div key={c._id} className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs text-xs">
                    <p className="font-semibold text-slate-800 truncate">
                      Chương {c.chapterNumber}: {c.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{c.storyTitle}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/quan-ly/chuong"
            className="mt-3 block text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 py-1.5 rounded-lg transition-colors"
          >
            Đến trang duyệt chương &rarr;
          </Link>
        </div>

        {/* Cột 3: Tác giả chờ duyệt */}
        <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Yêu cầu tác giả
              </span>
              <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                {totalPendingAuthorRequests}
              </span>
            </div>
            {authorRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic text-center">Không có yêu cầu chờ duyệt</p>
            ) : (
              <div className="space-y-2 mt-2">
                {authorRequests.slice(0, 3).map((r) => (
                  <div key={r._id} className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs text-xs">
                    <p className="font-semibold text-slate-800 truncate">Bút danh: {r.penName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{r.userName} ({r.userEmail})</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/quan-ly/duyet-tac-gia"
            className="mt-3 block text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 py-1.5 rounded-lg transition-colors"
          >
            Đến duyệt tác giả &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

