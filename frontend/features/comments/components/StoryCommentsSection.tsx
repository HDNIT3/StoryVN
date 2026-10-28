"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCreateComment, useStoryComments } from "../queries/useCommentQueries";
import { CommentInputBox } from "./CommentInputBox";
import { CommentItemCard } from "./CommentItemCard";
import type { QueryCommentsParams } from "../types";

interface StoryCommentsSectionProps {
  storyId: string;
  storyAuthorId?: string | null;
  storySlug?: string;
}

export const StoryCommentsSection: React.FC<StoryCommentsSectionProps> = ({
  storyId,
  storyAuthorId,
  storySlug,
}) => {
  const searchParams = useSearchParams();
  const targetCommentId = searchParams.get("commentId");
  const targetParentId = searchParams.get("parentId");
  const containerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState<number>(1);
  const [onlyStoryLevel, setOnlyStoryLevel] = useState<boolean>(false);
  const [sort, setSort] = useState<QueryCommentsParams["sort"]>("NEWEST");

  useEffect(() => {
    if (targetCommentId && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [targetCommentId]);

  const { data: commentsRes, isLoading, isError } = useStoryComments(storyId, {
    page,
    limit: 15,
    onlyStoryLevel,
    sort,
  });

  const { mutate: createComment, isPending: isSubmitting } =
    useCreateComment(storyId);

  const commentsData = commentsRes?.data;
  const items = commentsData?.items || [];
  const pagination = commentsData?.pagination;

  const handlePostComment = (content: string) => {
    createComment({
      storyId,
      chapterId: null,
      parentId: null,
      content,
    });
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Box nhập bình luận mới */}
      <div className="bg-zinc-50/70 p-4 sm:p-5 rounded-2xl border border-zinc-200/80">
        <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">
          Viết bình luận của bạn
        </h4>
        <CommentInputBox
          onSubmit={handlePostComment}
          isSubmitting={isSubmitting}
          placeholder="Cảm nhận của bạn về tác phẩm này thế nào? Hãy chia sẻ cùng mọi người nhé..."
        />
      </div>

      {/* Bộ lọc và sắp xếp */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOnlyStoryLevel(false);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              !onlyStoryLevel
                ? "bg-emerald-700 text-white"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            Tất cả bình luận {pagination?.totalItems ? `(${pagination.totalItems})` : ""}
          </button>
          <button
            type="button"
            onClick={() => {
              setOnlyStoryLevel(true);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              onlyStoryLevel
                ? "bg-emerald-700 text-white"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            Chỉ tại trang truyện
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-medium">Sắp xếp:</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as any);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 font-semibold focus:outline-hidden focus:border-emerald-600"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Danh sách bình luận */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 animate-pulse h-28"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 text-center text-sm text-zinc-500">
          Không thể tải danh sách bình luận vào lúc này.
        </div>
      ) : items.length === 0 ? (
        <div className="p-10 rounded-2xl bg-zinc-50/60 border border-zinc-200/80 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-zinc-800">
            Chưa có bình luận nào cho tác phẩm này
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Hãy là người đầu tiên mở đầu cuộc thảo luận nhé!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <CommentItemCard
              key={item._id}
              comment={item}
              storyId={storyId}
              storyAuthorId={storyAuthorId}
              storySlug={storySlug}
              targetCommentId={targetCommentId}
              targetParentId={targetParentId}
            />
          ))}
        </div>
      )}

      {/* Phân trang */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Trang trước
          </button>
          <span className="text-xs text-zinc-500 font-medium px-2">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};
