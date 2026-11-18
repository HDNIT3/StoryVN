"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAdminReports } from "@/features/reports";
import type { ReportTargetType } from "@/features/reports";

type FilterTargetTab = "ALL" | ReportTargetType;

const TARGET_BADGE_CONFIG: Record<
  ReportTargetType,
  { label: string; className: string; manageHref: string }
> = {
  FORUM_POST: {
    label: "Bài viết diễn đàn",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    manageHref: "/quan-ly/dien-dan",
  },
  STORY: {
    label: "Tác phẩm truyện",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    manageHref: "/quan-ly/truyen",
  },
  CHAPTER: {
    label: "Chương truyện",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    manageHref: "/quan-ly/chuong",
  },
  COMMENT: {
    label: "Bình luận",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    manageHref: "/quan-ly/binh-luan",
  },
};

export function AdminReportsView() {
  const [tab, setTab] = useState<FilterTargetTab>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const reportsQuery = useAdminReports({
    page,
    limit: 15,
    targetType: tab === "ALL" ? undefined : tab,
  });

  const items = reportsQuery.data?.items ?? [];
  const pagination = reportsQuery.data?.pagination;

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const inReason = item.reason.toLowerCase().includes(q);
    const inUser = (
      item.userId?.displayName ||
      item.userId?.username ||
      ""
    )
      .toLowerCase()
      .includes(q);
    const inMeta = (
      item.targetMeta?.title ||
      item.targetMeta?.subtitle ||
      ""
    )
      .toLowerCase()
      .includes(q);
    return inReason || inUser || inMeta;
  });

  const tabs: { key: FilterTargetTab; label: string }[] = [
    { key: "ALL", label: "Tất cả báo cáo" },
    { key: "FORUM_POST", label: "Bài viết diễn đàn" },
    { key: "STORY", label: "Tác phẩm truyện" },
    { key: "CHAPTER", label: "Chương truyện" },
    { key: "COMMENT", label: "Bình luận" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Link href="/quan-ly" className="hover:text-slate-700 transition">
              Quản trị
            </Link>
            <span>/</span>
            <span className="text-rose-600">Báo cáo vi phạm</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
            Quản lý báo cáo nội dung vi phạm
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi toàn bộ báo cáo từ người dùng đối với bài viết diễn đàn, truyện, chương truyện và bình luận.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reportsQuery.refetch()}
          disabled={reportsQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <svg
            className={`w-4 h-4 ${reportsQuery.isFetching ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Làm mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {tabs.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setTab(item.key);
                    setPage(1);
                  }}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[240px] max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo nội dung bị tố cáo, lý do, người gửi..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {reportsQuery.isPending ? (
          <div className="p-16 text-center text-sm text-slate-500">
            Đang tải danh sách báo cáo vi phạm...
          </div>
        ) : reportsQuery.isError ? (
          <div className="p-12 text-center text-sm text-rose-600 bg-rose-50/50">
            Không thể tải danh sách báo cáo. Vui lòng thử lại.
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Không có báo cáo vi phạm nào
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Hiện chưa ghi nhận báo cáo nào trong bộ lọc này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Người báo cáo</th>
                  <th className="py-3.5 px-4">Loại nội dung</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Nội dung bị báo cáo</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Lý do & Chi tiết tố cáo</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4 text-right">Đi tới xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((report) => {
                  const reporter = report.userId;
                  const name =
                    reporter?.displayName || reporter?.username || "Người dùng";
                  const badge =
                    TARGET_BADGE_CONFIG[report.targetType] ||
                    TARGET_BADGE_CONFIG.FORUM_POST;

                  return (
                    <tr key={report._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {reporter?.avatarUrl ? (
                              <Image
                                src={reporter.avatarUrl}
                                alt={name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-[11px] text-indigo-700 bg-indigo-50">
                                {name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              @{reporter?.username || "user"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top text-xs text-slate-700">
                        {report.targetMeta ? (
                          <div className="space-y-0.5 max-w-[260px]">
                            {report.targetMeta.url ? (
                              <Link
                                href={report.targetMeta.url}
                                target="_blank"
                                className="font-bold text-sky-700 hover:text-sky-800 hover:underline line-clamp-2 block"
                              >
                                {report.targetMeta.title} ↗
                              </Link>
                            ) : (
                              <span className="font-bold text-slate-800 line-clamp-2 block">
                                {report.targetMeta.title}
                              </span>
                            )}
                            {report.targetMeta.subtitle && (
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {report.targetMeta.subtitle}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Nội dung đã ẩn hoặc xóa</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <p className="text-xs text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                          {report.reason}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs text-slate-500">
                        {new Date(report.createdAt).toLocaleString("vi-VN")}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <Link
                          href={badge.manageHref}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition"
                        >
                          <span>Kiểm duyệt</span>
                          <span>→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Trang <strong>{pagination.page}</strong> / {pagination.totalPages} (Tổng{" "}
              {pagination.total} báo cáo)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
