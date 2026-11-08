"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCreateComment, useStoryComments } from "@/features/comments";
import { CommentInputBox } from "@/features/comments";
import { CommentItemCard } from "@/features/comments";
import { type ReaderThemeMode } from "./ReaderThemes";

interface ReaderCommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  chapterId: string;
  chapterNumber: number | string;
  storyAuthorId?: string | null;
  storySlug?: string;
  theme?: ReaderThemeMode;
}

export const ReaderCommentDrawer: React.FC<ReaderCommentDrawerProps> = ({
  isOpen,
  onClose,
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

  const [page, setPage] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lắng nghe phím ESC để đóng khung bình luận
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
  const totalComments = pagination?.totalItems ?? 0;

  const handlePostComment = (content: string) => {
    createComment({
      storyId,
      chapterId,
      parentId: null,
      content,
    });
  };

  const themeClasses = {
    vintage: {
      panelBg: "bg-[#fcfbf7] text-[#2c2725] border-l border-[#ede7de]",
      headerBg: "bg-[#f7f3ea] border-b border-[#ede7de]",
      inputBg: "bg-[#f9f6ef] border-b border-[#ede7de]",
      border: "border-[#ede7de]",
      closeBtn: "text-[#5a524c] hover:bg-[#ede7de] hover:text-[#8b1e17]",
      subText: "text-[#7c726a]",
      iconBg: "bg-[#faedd9] text-[#8b1e17]",
      badge: "bg-[#8b1e17] text-white",
      emptyBox: "bg-[#f8f5ee] border-[#ede7de] text-[#5a524c]",
      pageBtn: "border-[#ede7de] bg-white text-[#2c2725] hover:bg-[#f5f0e6]",
    },
    light: {
      panelBg: "bg-white text-zinc-900 border-l border-zinc-200",
      headerBg: "bg-zinc-50 border-b border-zinc-200",
      inputBg: "bg-zinc-50/60 border-b border-zinc-200",
      border: "border-zinc-200",
      closeBtn: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
      subText: "text-zinc-500",
      iconBg: "bg-sky-50 text-sky-600",
      badge: "bg-emerald-700 text-white",
      emptyBox: "bg-zinc-50 border-zinc-200 text-zinc-600",
      pageBtn: "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
    },
    dark: {
      panelBg: "bg-[#1d1f25] text-zinc-100 border-l border-zinc-800",
      headerBg: "bg-[#23262f] border-b border-zinc-800",
      inputBg: "bg-[#181a1f] border-b border-zinc-800",
      border: "border-zinc-800",
      closeBtn: "text-zinc-400 hover:bg-zinc-800 hover:text-white",
      subText: "text-zinc-400",
      iconBg: "bg-zinc-800 text-amber-400",
      badge: "bg-amber-500 text-zinc-950 font-bold",
      emptyBox: "bg-zinc-900/60 border-zinc-800 text-zinc-400",
      pageBtn: "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
    },
  }[theme];

  return (
    /* Khung bình luận cạnh phải màn hình (Không dùng lớp mờ backdrop để người đọc vừa xem truyện vừa chat/bình luận) */
    <aside
      ref={containerRef}
      aria-label="Khung bình luận chương"
      aria-hidden={!isOpen}
      className={`fixed top-0 right-0 bottom-0 z-40 w-full sm:w-[380px] md:w-[420px] lg:w-[420px] xl:w-[460px] h-full flex flex-col shadow-[-8px_0_30px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out select-none ${
        isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
      } ${themeClasses.panelBg}`}
    >
      {/* Header khung bình luận */}
      <div
        className={`flex items-center justify-between px-4 sm:px-5 py-3.5 shrink-0 ${themeClasses.headerBg}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${themeClasses.iconBg}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold truncate">
                Bình luận
              </h2>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${themeClasses.badge}`}
              >
                {totalComments}
              </span>
            </div>
            <p className={`text-xs truncate ${themeClasses.subText}`}>
              Chương {chapterNumber}
            </p>
          </div>
        </div>

        {/* Nút đóng (X) */}
        <button
          type="button"
          onClick={onClose}
          className={`p-2 rounded-xl transition-all cursor-pointer ${themeClasses.closeBtn}`}
          title="Đóng bình luận (Esc)"
          aria-label="Đóng bình luận"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Khung nhập bình luận (cố định ở đầu danh sách như Shorts) */}
      <div className={`p-4 shrink-0 select-text ${themeClasses.inputBg}`}>
        <CommentInputBox
          onSubmit={handlePostComment}
          isSubmitting={isSubmitting}
          placeholder={`Bình luận về chương ${chapterNumber}...`}
        />
      </div>

      {/* Danh sách bình luận cuộn dọc */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text custom-scrollbar">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse h-20"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 text-center text-xs opacity-70">
            Không thể tải bình luận của chương.
          </div>
        ) : items.length === 0 ? (
          <div
            className={`p-6 rounded-2xl border border-dashed text-center ${themeClasses.emptyBox}`}
          >
            <p className="text-xs sm:text-sm font-semibold">
              Chưa có ai bình luận về chương này.
            </p>
            <p className="text-xs opacity-75 mt-1">
              Hãy là người đầu tiên để lại cảm nghĩ nhé!
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

        {/* Phân trang danh sách */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 pt-3 pb-1 border-t border-inherit/20 text-xs">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1.5 rounded-lg border font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${themeClasses.pageBtn}`}
            >
              Trang trước
            </button>
            <span className={`font-medium ${themeClasses.subText}`}>
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              className={`px-3 py-1.5 rounded-lg border font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${themeClasses.pageBtn}`}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
