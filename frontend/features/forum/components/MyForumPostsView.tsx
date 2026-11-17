"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DateRangeToolbar, useDateRange } from "@/components/statistics";
import { useForumMutation, useForumPosts, useMyForumStats } from "../queries/useForumQueries";
import type { ForumPostStatus } from "../types";
import { ForumError, ForumPagination, ForumStatus } from "./ForumShared";
import { ForumContent } from "./ForumContent";

type FilterTab = "ALL" | ForumPostStatus;

export function MyForumPostsView() {
  const dateRange = useDateRange();
  const [tab, setTab] = useState<FilterTab>("ALL");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filterKey = JSON.stringify([dateRange.range, tab, search]);
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  if (pageState.key !== filterKey) {
    setPageState({ key: filterKey, page: 1 });
  }
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ key: filterKey, page: next });

  const statusParam = tab === "ALL" ? undefined : tab;
  const posts = useForumPosts("me", page, statusParam, dateRange.range);
  const statsQuery = useMyForumStats(dateRange.range);
  const mutation = useForumMutation();
  const busy = mutation.isPending;

  const stats = statsQuery.data;

  // Filter posts client-side by search query if user entered text
  const filteredItems = (posts.data?.items ?? []).filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return item.title.toLowerCase().includes(q);
  });

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.")) {
      return;
    }
    setDeleting(postId);
    try {
      await mutation.mutateAsync({ type: "delete", id: postId });
    } finally {
      setDeleting(null);
    }
  };

  const tabs: { key: FilterTab; label: string; count: number; color?: string }[] = [
    { key: "ALL", label: "Tất cả", count: stats?.total ?? 0 },
    { key: "VISIBLE", label: "Đang hiển thị", count: stats?.VISIBLE ?? 0, color: "text-emerald-700 bg-emerald-50" },
    { key: "PENDING", label: "Chờ duyệt", count: stats?.PENDING ?? 0, color: "text-amber-700 bg-amber-50" },
    { key: "REJECTED", label: "Bị từ chối", count: stats?.REJECTED ?? 0, color: "text-rose-700 bg-rose-50" },
    { key: "HIDDEN", label: "Đang ẩn", count: stats?.HIDDEN ?? 0, color: "text-slate-700 bg-slate-100" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/ho-so" className="hover:text-slate-900 transition">Hồ sơ cá nhân</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Bài viết của tôi</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Quản lý bài viết của tôi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi tình trạng phê duyệt, tương tác và quản lý nội dung bạn đã chia sẻ trên diễn đàn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/tai-khoan/bai-viet/them-moi"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-sky-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo bài viết mới
          </Link>
          <Link
            href="/dien-dan"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Về diễn đàn
          </Link>
        </div>
      </div>

      {/* DateRangeToolbar */}
      <div className="space-y-1.5 [&_label]:text-sm [&_input]:min-h-10 [&_input]:text-sm [&_select]:min-h-10 [&_select]:text-sm">
        <DateRangeToolbar dateRange={dateRange} />
        <p className="text-xs text-slate-500">Lọc thống kê và bài viết theo khoảng ngày tạo (giờ Việt Nam UTC+7).</p>
      </div>

      {/* Stat Cards - Tham khảo tương tự StoryStatsCards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Tổng bài viết */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-4">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Tổng bài viết</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{(stats?.total ?? 0).toLocaleString("vi-VN")}</div>
          </div>
        </div>

        {/* Card 2: Đang hiển thị */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-4">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Đang hiển thị</div>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">{(stats?.VISIBLE ?? 0).toLocaleString("vi-VN")}</div>
          </div>
        </div>

        {/* Card 3: Chờ duyệt */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-4 relative">
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Chờ duyệt</div>
            <div className="text-2xl font-bold text-amber-600 mt-0.5 flex items-center gap-2">
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

        {/* Card 4: Tổng lượt xem & tương tác */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-4">
          <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Lượt xem & tương tác</div>
            <div className="text-2xl font-bold text-sky-600 mt-0.5">{(stats?.views ?? 0).toLocaleString("vi-VN")}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {(stats?.likes ?? 0).toLocaleString("vi-VN")} thích · {(stats?.shares ?? 0).toLocaleString("vi-VN")} chia sẻ
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar: Tabs & Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
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
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : item.color || "bg-white text-slate-700"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative min-w-[220px] max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
              placeholder="Tìm kiếm bài viết..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Post List */}
      {posts.isPending ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          <svg className="mx-auto h-8 w-8 animate-spin text-sky-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Đang tải danh sách bài viết...
        </div>
      ) : posts.isError ? (
        <ForumError retry={() => void posts.refetch()} />
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900">Không tìm thấy bài viết nào</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {search ? `Không có kết quả khớp với từ khóa "${search}".` : "Bạn chưa có bài viết nào trong trạng thái hoặc mốc thời gian này."}
          </p>
          <div className="mt-5">
            <Link
              href="/tai-khoan/bai-viet/them-moi"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition"
            >
              + Tạo bài viết mới
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((post) => {
            const isPending = post.status === "PENDING";
            const isRejected = post.status === "REJECTED";
            const isHidden = post.status === "HIDDEN";

            return (
              <article
                key={post._id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs transition hover:border-slate-300 hover:shadow-xs"
              >
                {/* Header row: Title & Status */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <ForumStatus status={post.status} />
                      <span className="text-xs text-slate-400">
                        Đăng ngày {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <span className="text-xs text-slate-400">
                          · Sửa lần cuối {new Date(post.updatedAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/dien-dan/${post._id}`}
                      className="mt-2 block hover:text-sky-600 transition"
                    >
                      <h2 className="break-words text-lg font-bold text-slate-900 group-hover:text-sky-600 transition">
                        {post.title}
                      </h2>
                    </Link>
                  </div>

                  {/* Actions dropdown/buttons */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tai-khoan/bai-viet/${post._id}/chinh-sua`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-sky-600 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Chỉnh sửa
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
                      disabled={busy || deleting === post._id}
                      onClick={() => void handleDelete(post._id)}
                    >
                      {deleting === post._id ? "Đang xóa..." : "Xóa"}
                    </Button>
                  </div>
                </div>

                {/* Status Notice Alert */}
                {isPending && (
                  <div className="mt-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 p-3 text-xs text-amber-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Bài viết đang được Ban quản trị xem xét và kiểm duyệt trước khi hiển thị cho cộng đồng độc giả.</span>
                  </div>
                )}
                {isRejected && (
                  <div className="mt-3.5 rounded-xl bg-rose-50/80 border border-rose-200/70 p-3 text-xs text-rose-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Bài viết bị từ chối duyệt do chưa đáp ứng tiêu chuẩn cộng đồng. Bạn có thể nhấn Chỉnh sửa để sửa lại và gửi duyệt lại.</span>
                  </div>
                )}
                {isHidden && (
                  <div className="mt-3.5 rounded-xl bg-slate-100 border border-slate-200 p-3 text-xs text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                    <span>Bài viết hiện đang bị ẩn đối với cộng đồng.</span>
                  </div>
                )}

                {/* Snippet preview */}
                <div className="mt-3 max-h-24 overflow-hidden text-sm text-slate-600">
                  <ForumContent post={post} preview={160} />
                </div>

                {/* Footer Metrics */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    {/* Views */}
                    <span className="inline-flex items-center gap-1.5" title="Lượt xem">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{(post.viewCount ?? 0).toLocaleString("vi-VN")} lượt xem</span>
                    </span>

                    {/* Likes */}
                    <span className="inline-flex items-center gap-1.5" title="Lượt thích">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>{(post.likeCount ?? 0).toLocaleString("vi-VN")} thích</span>
                    </span>

                    {/* Shares */}
                    <span className="inline-flex items-center gap-1.5" title="Lượt chia sẻ">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>{(post.shareCount ?? 0).toLocaleString("vi-VN")} chia sẻ</span>
                    </span>
                  </div>

                  <Link
                    href={`/dien-dan/${post._id}`}
                    className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:text-sky-700 transition"
                  >
                    Xem chi tiết bài viết
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </article>
            );
          })}

          {/* Pagination */}
          {posts.data && posts.data.pagination.totalPages > 1 && (
            <div className="pt-2">
              <ForumPagination
                page={page}
                totalPages={posts.data.pagination.totalPages}
                disabled={posts.isFetching || busy}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
