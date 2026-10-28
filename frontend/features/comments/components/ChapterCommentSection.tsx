"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCreateComment, useStoryComments } from "../queries/useCommentQueries";
import { CommentInputBox } from "./CommentInputBox";
import { CommentItemCard } from "./CommentItemCard";

interface ChapterCommentSectionProps {
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  storyAuthorId?: string | null;
  storySlug?: string;
  theme?: "vintage" | "light" | "dark";
}

export const ChapterCommentSection: React.FC<ChapterCommentSectionProps> = ({
  storyId,
  chapterId,
  chapterNumber,
  storyAuthorId,
  storySlug,
  theme = "vintage",
}) => {
  const searchParams = useSearchParams();
  const targetCommentId = searchParams.get("commentId");
  const targetParentId = searchParams.get("parentId");
  const sectionRef = useRef<HTMLElement>(null);

  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    if (targetCommentId && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [targetCommentId]);

  const { data: commentsRes, isLoading, isError } = useStoryComments(storyId, {
    page,
    limit: 15,
    chapterId,
    sort: "NEWEST",
  });

  const { mutate: createComment, isPending: isSubmitting } =
    useCreateComment(storyId);

  const commentsData = commentsRes?.data;
  const items = commentsData?.items || [];
  const pagination = commentsData?.pagination;

  const handlePostComment = (content: string) => {
    createComment({
      storyId,
      chapterId,
      parentId: null,
      content,
    });
  };

  const isDark = theme === "dark";

  return (
    <section
      ref={sectionRef}
      id="chapter-comments"
      className={`mt-12 mb-16 p-5 sm:p-8 rounded-3xl border transition-colors ${
        isDark
          ? "bg-zinc-900/80 border-zinc-800 text-zinc-100"
          : "bg-white/80 border-zinc-200/80 shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <span>Bình luận chương {chapterNumber}</span>
          {pagination?.totalItems !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {pagination.totalItems}
            </span>
          )}
        </h3>
      </div>

      {/* Input box */}
      <div className="mb-6">
        <CommentInputBox
          onSubmit={handlePostComment}
          isSubmitting={isSubmitting}
          placeholder={`Bình luận về chương ${chapterNumber}...`}
        />
      </div>

      {/* Danh sách bình luận */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-zinc-100/60 animate-pulse h-24"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl bg-zinc-100/50 text-center text-xs text-zinc-500">
          Không thể tải bình luận của chương.
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 rounded-2xl bg-zinc-50/50 border border-dashed border-zinc-200 text-center">
          <p className="text-xs sm:text-sm font-semibold text-zinc-600">
            Chưa có ai bình luận về chương này.
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Bạn vừa đọc xong, hãy để lại cảm nghĩ đầu tiên nhé!
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
        <div className="flex items-center justify-center gap-2 pt-6">
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
    </section>
  );
};
