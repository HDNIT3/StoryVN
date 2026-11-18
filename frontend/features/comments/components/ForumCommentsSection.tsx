"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCreateComment, useForumPostComments } from "../queries/useCommentQueries";
import { CommentInputBox } from "./CommentInputBox";
import { CommentItemCard } from "./CommentItemCard";
import type { QueryCommentsParams } from "../types";

interface ForumCommentsSectionProps {
  forumPostId: string;
  postAuthorId?: string | null;
}

export const ForumCommentsSection: React.FC<ForumCommentsSectionProps> = ({
  forumPostId,
  postAuthorId,
}) => {
  const searchParams = useSearchParams();
  const targetCommentId = searchParams.get("commentId");
  const targetParentId = searchParams.get("parentId");
  const containerRef = useRef<HTMLElement>(null);

  const [page, setPage] = useState<number>(1);
  const [sort, setSort] = useState<QueryCommentsParams["sort"]>("NEWEST");

  useEffect(() => {
    if (targetCommentId && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [targetCommentId]);

  const { data: commentsRes, isLoading, isError } = useForumPostComments(
    forumPostId,
    {
      page,
      limit: 15,
      sort,
    }
  );

  const { mutate: createComment, isPending: isSubmitting } =
    useCreateComment();

  const commentsData = commentsRes?.data;
  const items = commentsData?.items || [];
  const pagination = commentsData?.pagination;

  const handlePostComment = (content: string) => {
    createComment({
      forumPostId,
      parentId: null,
      content,
    });
  };

  return (
    <section
      ref={containerRef}
      id="forum-comments"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-9 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Bình luận & Thảo luận</span>
              {pagination?.totalItems !== undefined && (
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 border border-sky-200/70">
                  {pagination.totalItems}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Trao đổi văn minh, tôn trọng tác giả và cộng đồng đọc truyện
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Sắp xếp:</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as QueryCommentsParams["sort"]);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 font-semibold text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Input box */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5">
        <CommentInputBox
          onSubmit={handlePostComment}
          isSubmitting={isSubmitting}
          placeholder="Chia sẻ suy nghĩ, góc nhìn của bạn về bài viết này..."
        />
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-5"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center text-sm text-rose-600">
          Không thể tải bình luận của bài viết vào lúc này.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-800">
            Chưa có bình luận nào cho bài viết này
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Hãy là người đầu tiên để lại bình luận giao lưu cùng tác giả nhé!
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {items.map((item) => (
            <CommentItemCard
              key={item._id}
              comment={item}
              forumPostId={forumPostId}
              storyAuthorId={postAuthorId}
              targetCommentId={targetCommentId}
              targetParentId={targetParentId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Trang trước
          </button>
          <span className="px-2 text-xs font-medium text-slate-500">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Trang sau
          </button>
        </div>
      )}
    </section>
  );
};
