"use client";

import React from "react";
import Link from "next/link";
import { useForumPosts } from "@/features/forum/queries/useForumQueries";
import { ForumStatus } from "@/features/forum/components/ForumShared";

export function ProfileForumPostsSection() {
  const postsQuery = useForumPosts("me", 1);
  const posts = postsQuery.data?.items ?? [];
  const total = postsQuery.data?.pagination.total ?? 0;

  return (
    <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </span>
            <h2 className="text-lg font-bold text-slate-900">Bài viết diễn đàn của tôi</h2>
            {total > 0 && (
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                {total} bài
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi trạng thái duyệt bài, tương tác và quản lý những chia sẻ của bạn trên diễn đàn.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/tai-khoan/bai-viet/them-moi"
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Viết bài mới
          </Link>

          <Link
            href="/tai-khoan/bai-viet"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Quản lý tất cả bài viết →
          </Link>
        </div>
      </div>

      {/* Content list */}
      {postsQuery.isPending ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-50 p-4" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">Bạn chưa có bài viết nào trên diễn đàn</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Hãy chia sẻ cảm nhận về những cuốn tiểu thuyết bạn yêu thích hoặc giao lưu cùng cộng đồng tác giả và độc giả.
          </p>
          <Link
            href="/tai-khoan/bai-viet/them-moi"
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 transition"
          >
            Tạo bài viết đầu tiên
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {posts.slice(0, 4).map((post) => (
            <div
              key={post._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/dien-dan/${post._id}`}
                    className="font-bold text-sm text-slate-900 hover:text-sky-600 transition truncate"
                  >
                    {post.title}
                  </Link>
                  <ForumStatus status={post.status} />
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                  <span>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
                  <span>•</span>
                  <span>{(post.viewCount ?? 0).toLocaleString("vi-VN")} lượt xem</span>
                  <span>•</span>
                  <span>{(post.likeCount ?? 0).toLocaleString("vi-VN")} thích</span>
                  <span>•</span>
                  <span>{(post.shareCount ?? 0).toLocaleString("vi-VN")} chia sẻ</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/dien-dan/${post._id}`}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Xem bài
                </Link>
                <Link
                  href={`/tai-khoan/bai-viet/${post._id}/chinh-sua`}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Sửa
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
