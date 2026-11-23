"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { DateRangeToolbar, useDateRange, type DateRange } from "@/components/statistics";
import { exportForum } from "../services/forum-export";
import { toast } from "@/lib/toast";
import { useForumMutation, useForumPosts, useForumReports, useForumStats } from "../queries/useForumQueries";
import type { ForumPost, ForumPostStatus } from "../types";
import { ForumPagination, ForumStatus } from "./ForumShared";
import { ForumContent } from "./ForumContent";

type AdminFilterTab = "ALL" | ForumPostStatus;

// Modal xem báo cáo & chi tiết bài viết
function PostDetailAndReportsModal({
  post,
  range,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating,
}: {
  post: ForumPost | null;
  range: DateRange;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ForumPostStatus) => Promise<void>;
  isUpdating: boolean;
}) {
  const [reportPage, setReportPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"CONTENT" | "REPORTS">("CONTENT");

  const reports = useForumReports(post?._id ?? "", reportPage, range);

  if (!isOpen || !post) return null;

  const author = post.userId;
  const avatar = author?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
  const authorName = author?.displayName || author?.username || "Thành viên ẩn danh";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="admin-dialog-overlay fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-950/50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="admin-dialog bg-white rounded-2xl max-w-3xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-3rem)] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="admin-dialog-header flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-admin-brand-50 text-admin-brand-600 flex items-center justify-center shadow-admin-card">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <h3 className="admin-dialog-title text-sm font-semibold text-gray-900">Chi tiết bài viết & Kiểm duyệt</h3>
              {post.slug && (
                <Link
                  href={`/dien-dan/${post.slug}`}
                  target="_blank"
                  className="text-xs text-admin-brand-600 hover:underline"
                >
                  /dien-dan/{post.slug} ↗
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ForumStatus status={post.status} />
            <button
              type="button"
              onClick={onClose}
              className="admin-dialog-close p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-4 px-6 border-b border-gray-100 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("CONTENT")}
            className={`py-3 border-b-2 transition ${activeTab === "CONTENT"
                ? "border-admin-brand-600 text-admin-brand-600 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
          >
            Nội dung bài viết
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("REPORTS")}
            className={`py-3 border-b-2 transition flex items-center gap-2 ${activeTab === "REPORTS"
                ? "border-rose-600 text-rose-600 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
          >
            <span>Báo cáo vi phạm</span>
            {(post.reportCount ?? 0) > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                {post.reportCount}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-dialog-body flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "CONTENT" ? (
            <>
              {/* Author & Meta */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                    <Image src={avatar} alt={authorName} fill className="object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{authorName}</div>
                    <div className="text-xs text-gray-500">
                      @{author?.username || "an-danh"} · Đăng ngày {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1" title="Lượt xem">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {(post.viewCount ?? 0).toLocaleString("vi-VN")}
                  </span>
                  <span className="flex items-center gap-1" title="Lượt thích">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    {(post.likeCount ?? 0).toLocaleString("vi-VN")}
                  </span>
                  <span className="flex items-center gap-1" title="Lượt chia sẻ">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {(post.shareCount ?? 0).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Title & Rich Content */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 leading-snug">{post.title}</h2>
                <div className="mt-4 rounded-2xl border border-gray-100 p-5 bg-white shadow-admin-card">
                  <ForumContent post={post} />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 text-sm">Danh sách báo cáo vi phạm</h4>
                <span className="text-xs text-gray-500">
                  {reports.data?.pagination.total ?? 0} lượt báo cáo
                </span>
              </div>

              {reports.isPending ? (
                <div className="p-8 text-center text-sm text-gray-500">Đang tải báo cáo...</div>
              ) : reports.isError ? (
                <div className="p-6 text-center text-sm text-rose-600 bg-rose-50 rounded-2xl">
                  Không thể tải báo cáo. Vui lòng thử lại.
                </div>
              ) : reports.data.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center text-sm text-gray-500">
                  Không có báo cáo vi phạm nào đối với bài viết này.
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.data.items.map((report) => (
                    <div key={report._id} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 text-sm space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium text-gray-800">
                          {report.userId?.displayName || report.userId?.username || "Người dùng"}
                        </span>
                        <span>{new Date(report.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <p className="text-gray-800 font-medium whitespace-pre-wrap break-words">
                        {report.reason || "Không ghi rõ lý do báo cáo."}
                      </p>
                    </div>
                  ))}

                  <ForumPagination
                    page={reportPage}
                    totalPages={reports.data.pagination.totalPages}
                    disabled={reports.isFetching || isUpdating}
                    onChange={setReportPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="admin-dialog-footer flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-xs text-gray-500">
            Hành động duyệt sẽ cập nhật trạng thái hiển thị cho bài viết ngay lập tức.
          </div>

          <div className="flex items-center gap-2">
            {post.status !== "VISIBLE" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => void onUpdateStatus(post._id, "VISIBLE")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-admin-card hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Phê duyệt (Hiển thị)
              </button>
            )}

            {post.status !== "REJECTED" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => void onUpdateStatus(post._id, "REJECTED")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-admin-card hover:bg-rose-700 disabled:opacity-50 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Từ chối duyệt
              </button>
            )}

            {post.status === "VISIBLE" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => void onUpdateStatus(post._id, "HIDDEN")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-admin-card hover:bg-gray-100 disabled:opacity-50 transition"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                Ẩn bài viết
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminForumView() {
  const dateRange = useDateRange();
  const [tab, setTab] = useState<AdminFilterTab>("ALL");
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [exporting, setExporting] = useState(false);
  const exportLock = useRef(false);

  const filterKey = JSON.stringify([dateRange.range, tab, search]);
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  if (pageState.key !== filterKey) {
    setPageState({ key: filterKey, page: 1 });
  }
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ key: filterKey, page: next });

  const statusParam = tab === "ALL" ? undefined : tab;
  const posts = useForumPosts("admin", page, statusParam, dateRange.range);
  const statsQuery = useForumStats(dateRange.range);
  const mutation = useForumMutation();
  const busy = mutation.isPending || exporting;

  const stats = statsQuery.data;

  // Filter items client-side by search query (title or author username/display name)
  const filteredPosts = (posts.data?.items ?? []).filter((post) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const titleMatch = post.title.toLowerCase().includes(q);
    const authorMatch = (post.userId?.displayName || post.userId?.username || "").toLowerCase().includes(q);
    return titleMatch || authorMatch;
  });

  const handleUpdateStatus = async (id: string, newStatus: ForumPostStatus) => {
    try {
      await mutation.mutateAsync({ type: "status", id, status: newStatus });
      if (selectedPost && selectedPost._id === id) {
        setSelectedPost((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch {
      // Error handled by mutation toast
    }
  };

  async function exportAll() {
    if (exportLock.current || busy || posts.isFetching || !dateRange.isValid) return;
    exportLock.current = true;
    setExporting(true);
    try {
      await exportForum("admin", dateRange.range, statusParam);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xuất Excel");
    } finally {
      exportLock.current = false;
      setExporting(false);
    }
  }

  const tabs: { key: AdminFilterTab; label: string; count: number; color?: string }[] = [
    { key: "ALL", label: "Tất cả", count: stats?.total ?? 0 },
    { key: "PENDING", label: "Chờ duyệt", count: stats?.PENDING ?? 0, color: "text-amber-700 bg-amber-50" },
    { key: "VISIBLE", label: "Đang hiển thị", count: stats?.VISIBLE ?? 0, color: "text-emerald-700 bg-emerald-50" },
    { key: "HIDDEN", label: "Đang ẩn", count: stats?.HIDDEN ?? 0, color: "text-gray-700 bg-gray-100" },
    { key: "REJECTED", label: "Bị từ chối", count: stats?.REJECTED ?? 0, color: "text-rose-700 bg-rose-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb - Khớp hoàn toàn AdminStoriesView & AdminCommentsView */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <Link href="/quan-ly" className="hover:text-gray-700 transition">Quản trị</Link>
            <span>/</span>
            <span className="text-admin-brand-600">Bài viết diễn đàn</span>
          </div>
          <h1 className="admin-page-title text-2xl font-semibold text-gray-900 tracking-tight sm:text-3xl">Quản lý bài viết diễn đàn</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Kiểm duyệt bài viết mới, quản lý trạng thái hiển thị, theo dõi tương tác và xử lý báo cáo vi phạm từ người dùng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dien-dan"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-admin-card"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Xem Diễn đàn
          </Link>
        </div>
      </div>

      {/* DateRangeToolbar */}
      <DateRangeToolbar
        dateRange={dateRange}
        exporting={exporting}
        onExport={() => void exportAll()}
        exportDisabled={busy || posts.isFetching || posts.isError || !posts.data}
      />

      {/* Admin Stat Cards - Khớp form dáng chuẩn AdminStatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng bài viết */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-admin-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-admin-brand-50 text-admin-brand-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Tổng bài viết</div>
            <div className="text-2xl font-medium text-gray-900 mt-0.5">
              {(stats?.total ?? 0).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>

        {/* Card 2: Chờ duyệt */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-admin-card flex items-center gap-4 relative">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Chờ duyệt</div>
            <div className="text-2xl font-medium text-amber-600 mt-0.5 flex items-center gap-2">
              {(stats?.PENDING ?? 0).toLocaleString("vi-VN")}
              {(stats?.PENDING ?? 0) > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Đang hiển thị */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-admin-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Đang hiển thị</div>
            <div className="text-2xl font-medium text-emerald-600 mt-0.5">
              {(stats?.VISIBLE ?? 0).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>

        {/* Card 4: Tổng tương tác */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-admin-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-admin-brand-50 text-admin-brand-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Lượt xem & tương tác</div>
            <div className="text-2xl font-medium text-admin-brand-600 mt-0.5">
              {(stats?.views ?? 0).toLocaleString("vi-VN")}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {(stats?.likes ?? 0).toLocaleString("vi-VN")} thích · {(stats?.shares ?? 0).toLocaleString("vi-VN")} chia sẻ
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar: Tabs & Search */}
      <div className="admin-filter-bar bg-white rounded-2xl p-4 border border-gray-200 shadow-admin-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {tabs.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setTab(item.key);
                    setPageState((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${active
                      ? "bg-gray-900 text-white shadow-admin-card"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900"
                    }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${active ? "bg-white/20 text-white" : item.color || "bg-white text-gray-700"
                      }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề, tác giả..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-admin-brand-500 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-admin-card overflow-hidden">
        {posts.isPending ? (
          <div className="p-16 text-center text-sm text-gray-500">
            <svg className="mx-auto h-8 w-8 animate-spin text-admin-brand-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Đang tải dữ liệu bài viết...
          </div>
        ) : posts.isError ? (
          <div className="p-12 text-center text-sm text-rose-600 bg-rose-50/50">
            Không thể tải danh sách bài viết. Vui lòng thử lại.
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void posts.refetch()}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-sm shadow-admin-card hover:bg-rose-700"
              >
                Tải lại
              </button>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Không có bài viết nào</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search ? `Không tìm thấy bài viết nào khớp với "${search}".` : "Chưa có bài viết nào trong trạng thái hoặc mốc thời gian này."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-data-table w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-5">Tác giả</th>
                  <th className="py-3.5 px-5 min-w-[260px]">Tiêu đề bài viết</th>
                  <th className="py-3.5 px-5 text-center">Tương tác</th>
                  <th className="py-3.5 px-5 text-center">Báo cáo</th>
                  <th className="py-3.5 px-5">Ngày đăng</th>
                  <th className="py-3.5 px-5 text-center">Trạng thái</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPosts.map((post) => {
                  const author = post.userId;
                  const avatar = author?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
                  const authorName = author?.displayName || author?.username || "Thành viên";
                  const reportCount = post.reportCount ?? 0;

                  return (
                    <tr key={post._id} className="hover:bg-gray-50/70 transition">
                      {/* Author */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 shrink-0">
                            <Image src={avatar} alt={authorName} fill className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-xs truncate max-w-[130px]">
                              {authorName}
                            </div>
                            <div className="text-xs text-gray-400 truncate max-w-[130px]">
                              @{author?.username || "an-danh"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Title & Preview */}
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => setSelectedPost(post)}
                          className="text-left group block"
                        >
                          <div className="font-medium text-gray-900 text-xs line-clamp-1 group-hover:text-admin-brand-600 transition">
                            {post.title}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {post.content.replace(/<[^>]*>/g, "").slice(0, 80) || "Không có trích đoạn..."}
                          </div>
                        </button>
                      </td>

                      {/* Interactions */}
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1" title="Lượt xem">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {post.viewCount ?? 0}
                          </span>
                          <span className="flex items-center gap-1" title="Lượt thích">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            {post.likeCount ?? 0}
                          </span>
                          <span className="flex items-center gap-1" title="Lượt chia sẻ">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            {post.shareCount ?? 0}
                          </span>
                          <span className="flex items-center gap-1" title="Lượt bình luận">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.commentCount ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Reports */}
                      <td className="py-4 px-5 text-center">
                        {reportCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPost(post)}
                            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-sm font-medium text-rose-700 border border-rose-200/80 hover:bg-rose-100 transition"
                          >
                            <svg className="w-3 h-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {reportCount} báo cáo
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-5 text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 text-center">
                        <ForumStatus status={post.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve (VISIBLE) */}
                          {post.status !== "VISIBLE" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleUpdateStatus(post._id, "VISIBLE")}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                              title="Duyệt hiển thị"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}

                          {/* Reject (REJECTED) */}
                          {post.status !== "REJECTED" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleUpdateStatus(post._id, "REJECTED")}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                              title="Từ chối bài viết"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}

                          {/* Hide (HIDDEN) */}
                          {post.status === "VISIBLE" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleUpdateStatus(post._id, "HIDDEN")}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                              title="Ẩn bài viết"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                              </svg>
                            </button>
                          )}

                          {/* View Detail Modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedPost(post)}
                            className="p-1.5 rounded-lg text-admin-brand-600 hover:bg-admin-brand-50 transition"
                            title="Xem chi tiết & báo cáo"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {posts.data && posts.data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100">
            <ForumPagination
              page={page}
              totalPages={posts.data.pagination.totalPages}
              disabled={posts.isFetching || busy}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Detail & Reports Modal */}
      <PostDetailAndReportsModal
        post={selectedPost}
        range={dateRange.range}
        isOpen={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={busy}
      />
    </div>
  );
}
