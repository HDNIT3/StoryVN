"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAdminReports, useUpdateReportStatus } from "@/features/reports";
import type { ReportStatus, ReportTargetType } from "@/features/reports";

type FilterTargetTab = "ALL" | ReportTargetType;

const TARGET_BADGE_CONFIG: Record<
  ReportTargetType,
  { label: string; className: string; manageHref: string }
> = {
  FORUM_POST: {
    label: "Bài viết diễn đàn",
    className: "bg-admin-brand-50 text-admin-brand-700 border-admin-brand-200",
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
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, ReportStatus>>({});
  const updateReport = useUpdateReportStatus();

  const reportsQuery = useAdminReports({
    page,
    limit: 15,
    targetType: tab === "ALL" ? undefined : tab,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  const items = reportsQuery.data?.items ?? [];
  const pagination = reportsQuery.data?.pagination;

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const inReason = item.reason.toLowerCase().includes(q);
    const inUser = (
      item.userId?.displayName ||
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
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <Link href="/quan-ly" className="hover:text-gray-700 transition">
              Quản trị
            </Link>
            <span>/</span>
            <span className="text-rose-600">Báo cáo vi phạm</span>
          </div>
          <h1 className="admin-page-title text-2xl font-semibold text-gray-900 tracking-tight sm:text-3xl">
            Quản lý báo cáo nội dung vi phạm
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Theo dõi toàn bộ báo cáo từ người dùng đối với bài viết diễn đàn, truyện, chương truyện và bình luận.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reportsQuery.refetch()}
          disabled={reportsQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-admin-card cursor-pointer self-start sm:self-auto"
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
      <div className="admin-filter-bar rounded-2xl border border-gray-200 bg-white p-4 shadow-admin-card space-y-4">
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
                  className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${active
                      ? "bg-gray-900 text-white shadow-admin-card"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <label className="text-xs font-semibold text-gray-600">Trạng thái
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as ReportStatus | "ALL"); setPage(1); }} className="mt-1 block rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <option value="ALL">Tất cả trạng thái</option><option value="PENDING">Chưa xử lý</option><option value="IN_REVIEW">Đang xem xét</option><option value="ACTION_TAKEN">Đã xử lý vi phạm</option><option value="REJECTED">Từ chối báo cáo</option>
            </select>
          </label>

          <div className="relative min-w-[240px] max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-admin-brand-500 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-admin-card overflow-hidden">
        {reportsQuery.isPending ? (
          <div className="p-16 text-center text-sm text-gray-500">
            Đang tải danh sách báo cáo vi phạm...
          </div>
        ) : reportsQuery.isError ? (
          <div className="p-12 text-center text-sm text-rose-600 bg-rose-50/50">
            Không thể tải danh sách báo cáo. Vui lòng thử lại.
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Không có báo cáo vi phạm nào
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Hiện chưa ghi nhận báo cáo nào trong bộ lọc này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-data-table w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-5">Người báo cáo</th>
                  <th className="py-3.5 px-5">Loại nội dung</th>
                  <th className="py-3.5 px-5 min-w-[220px]">Nội dung bị báo cáo</th>
                  <th className="py-3.5 px-5 min-w-[260px]">Lý do & Chi tiết tố cáo</th>
                  <th className="py-3.5 px-5">{"Trạng thái xử lý"}</th>
                  <th className="py-3.5 px-5">{"Thời gian"}</th>
                  <th className="py-3.5 px-5 text-right">Đi tới xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((report) => {
                  const reporter = report.userId;
                  const name =
                    reporter?.displayName || "Người dùng";
                  const badge =
                    TARGET_BADGE_CONFIG[report.targetType] ||
                    TARGET_BADGE_CONFIG.FORUM_POST;

                  return (
                    <tr key={report._id} className="hover:bg-gray-50/70 transition">
                      <td className="py-4 px-5 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            {reporter?.avatarUrl ? (
                              <Image
                                src={reporter.avatarUrl}
                                alt={name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-medium text-xs text-admin-brand-700 bg-admin-brand-50">
                                {name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-xs">
                              {name}
                            </div>
                            <div className="text-xs text-gray-400">
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-4 px-5 align-top text-sm text-gray-700">
                        {report.targetMeta ? (
                          <div className="space-y-0.5 max-w-[260px]">
                            {report.targetMeta.url ? (
                              <Link
                                href={report.targetMeta.url}
                                target="_blank"
                                className="font-medium text-admin-brand-700 hover:text-admin-brand-800 hover:underline line-clamp-2 block"
                              >
                                {report.targetMeta.title} ↗
                              </Link>
                            ) : (
                              <span className="font-medium text-gray-800 line-clamp-2 block">
                                {report.targetMeta.title}
                              </span>
                            )}
                            {report.targetMeta.subtitle && (
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {report.targetMeta.subtitle}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Nội dung đã ẩn hoặc xóa</span>
                        )}
                      </td>

                      <td className="py-4 px-5 align-top">
                        <p className="text-xs text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                          {report.reason}
                        </p>
                      </td>

                      <td className="py-4 px-5 align-top min-w-[280px]">
                        <div className="space-y-2">
                          <select value={statuses[report._id] ?? report.status ?? "PENDING"} onChange={(e) => setStatuses((current) => ({ ...current, [report._id]: e.target.value as ReportStatus }))} className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm">
                            <option value="PENDING">{"Chưa xử lý"}</option><option value="IN_REVIEW">{"Đang xem xét"}</option><option value="ACTION_TAKEN">{"Đã xử lý vi phạm"}</option><option value="REJECTED">{"Từ chối báo cáo"}</option>
                          </select>
                          <textarea rows={2} value={resolutionNotes[report._id] ?? report.resolutionNote ?? ""} onChange={(e) => setResolutionNotes((current) => ({ ...current, [report._id]: e.target.value }))} placeholder="Ghi kết quả xem xét; bắt buộc khi đóng hồ sơ" className="w-full resize-y rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
                          <button type="button" disabled={updateReport.isPending || (((statuses[report._id] ?? report.status) === "ACTION_TAKEN" || (statuses[report._id] ?? report.status) === "REJECTED") && !(resolutionNotes[report._id] ?? report.resolutionNote)?.trim())} onClick={() => updateReport.mutate({ id: report._id, status: statuses[report._id] ?? report.status ?? "PENDING", resolutionNote: resolutionNotes[report._id] ?? report.resolutionNote ?? "" })} className="rounded-lg bg-admin-brand-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">{"Lưu cập nhật"}</button>
                          {report.history?.length ? <details className="text-xs text-gray-500"><summary className="cursor-pointer">Review history ({report.history.length})</summary><ol className="mt-1 space-y-1">{report.history.map((entry, index) => <li key={`${entry.createdAt}-${index}`} className="border-l-2 border-gray-200 pl-2">{new Date(entry.createdAt).toLocaleString("vi-VN")} - {entry.actorId?.displayName || "Manager"} - {entry.status}{entry.note ? `: ${entry.note}` : ""}</li>)}</ol></details> : null}
                          {report.reviewedBy && <p className="text-xs text-gray-400">{"Đã cập nhật bởi "}{report.reviewedBy.displayName}{report.reviewedAt ? ` ? ${new Date(report.reviewedAt).toLocaleString("vi-VN")}` : ""}</p>}
                        </div>
                      </td>

                      <td className="py-4 px-5 align-top whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleString("vi-VN")}
                      </td>

                      <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                        <Link
                          href={badge.manageHref}
                          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-admin-brand-600 hover:bg-admin-brand-50 hover:border-admin-brand-200 transition"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Trang <strong>{pagination.page}</strong> / {pagination.totalPages} (Tổng{" "}
              {pagination.total} báo cáo)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
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
