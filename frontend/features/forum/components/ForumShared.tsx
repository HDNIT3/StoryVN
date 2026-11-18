"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import type { ForumPost, ForumPostStatus } from "../types";

export function ForumBanner({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-100 via-white to-slate-100 px-6 py-8 sm:px-9 sm:py-10">
    <div aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[28px] border-sky-200/30" />
    <p className="relative mb-3 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">{eyebrow}</p>
    <h1 className="relative text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
    <p className="relative mt-3 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
  </header>;
}

export function ForumAuthor({ post }: { post: ForumPost }) {
  const name = post.userId?.displayName || post.userId?.username || "Người dùng";
  const avatarUrl = post.userId?.avatarUrl;
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className="flex items-center gap-3 min-w-0">
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={name}
          className="h-10 w-10 shrink-0 rounded-full object-cover border border-slate-200 shadow-2xs"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
        <p className="mt-0.5 text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString("vi-VN")}</p>
      </div>
    </div>
  );
}

export function ForumStatus({ status }: { status: ForumPostStatus }) {
  const colors: Record<ForumPostStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    VISIBLE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    HIDDEN: "bg-slate-100 text-slate-600 border border-slate-200",
    REJECTED: "bg-rose-50 text-rose-700 border border-rose-200",
    DELETED: "bg-zinc-100 text-zinc-500 border border-zinc-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || "bg-slate-100 text-slate-600"}`}>
      {postStatusLabels[status] || status}
    </span>
  );
}

export const postStatusLabels: Record<ForumPostStatus, string> = {
  PENDING: "Chờ duyệt",
  VISIBLE: "Đang hiển thị",
  HIDDEN: "Đã ẩn",
  REJECTED: "Từ chối",
  DELETED: "Đã xóa",
};

export function ForumError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <p className="mb-3">Không tải được dữ liệu. Vui lòng thử lại.</p>
      <Button size="sm" variant="outline" onClick={retry}>Thử lại</Button>
    </div>
  );
}

export function ForumPagination({ page, totalPages, disabled, onChange }: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1 && page === 1) return null;
  return (
    <nav aria-label="Phân trang bài viết" className="flex flex-wrap items-center justify-center gap-3 pt-4">
      <Button size="sm" variant="outline" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>Trước</Button>
      <span className="text-sm text-slate-600">Trang {page} / {Math.max(page, totalPages)}</span>
      <Button size="sm" variant="outline" disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>Sau</Button>
    </nav>
  );
}
