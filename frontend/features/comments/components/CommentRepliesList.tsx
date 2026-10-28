"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import {
  useCommentReplies,
  useDeleteComment,
  useToggleCommentVisibility,
  useUpdateComment,
} from "../queries/useCommentQueries";
import type { CommentItem, CommentUser } from "../types";

interface CommentRepliesListProps {
  parentId: string;
  storyAuthorId?: string | null;
  onReplyTo: (user: CommentUser, replyId: string) => void;
  targetCommentId?: string | null;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Vừa xong";
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return "Vừa xong";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  } catch {
    return dateStr;
  }
}

export const CommentRepliesList: React.FC<CommentRepliesListProps> = ({
  parentId,
  storyAuthorId,
  onReplyTo,
  targetCommentId,
}) => {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");

  const { data: repliesRes, isLoading } = useCommentReplies(parentId, {
    limit: 50,
  });

  const replies = repliesRes?.data?.items || [];

  useEffect(() => {
    if (targetCommentId && replies.length > 0) {
      const hasTarget = replies.some((r) => r._id === targetCommentId);
      if (hasTarget) {
        setTimeout(() => {
          const el = document.getElementById(`comment-${targetCommentId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);
      }
    }
  }, [targetCommentId, replies]);

  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();
  const { mutate: toggleVisibility, isPending: isToggling } =
    useToggleCommentVisibility();

  if (isLoading) {
    return (
      <div className="pl-6 pt-2 space-y-2">
        <div className="h-12 bg-zinc-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (replies.length === 0) {
    return null;
  }

  const handleStartEdit = (item: CommentItem) => {
    setEditingId(item._id);
    setEditContent(item.content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;
    updateComment(
      { commentId, payload: { content: editContent.trim() } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditContent("");
        },
      }
    );
  };

  const handleDelete = (commentId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa phản hồi này?")) {
      deleteComment(commentId);
    }
  };

  return (
    <div className="pl-6 sm:pl-10 pt-3 space-y-3 border-l-2 border-zinc-100 ml-4 sm:ml-5">
      {replies.map((reply) => {
        const commenter = reply.userId;
        const displayName =
          commenter?.displayName || commenter?.username || "Độc giả";
        const replyToUser = reply.replyToUserId;
        const replyToDisplayName =
          replyToUser?.displayName || replyToUser?.username;
        const avatarUrl = commenter?.avatarUrl;
        const isOwner = user && user._id === commenter?._id;
        const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";
        const isStoryAuthor = user && storyAuthorId && user._id === storyAuthorId;
        const canModerate = isAdmin || isStoryAuthor;
        const isHidden = reply.status === "HIDDEN";
        const isTargeted = reply._id === targetCommentId;

        return (
          <div
            key={reply._id}
            id={`comment-${reply._id}`}
            className={`p-3 rounded-2xl bg-zinc-50/80 border transition-all ${
              isTargeted
                ? "ring-2 ring-emerald-500 bg-emerald-50/70 border-emerald-300 shadow-sm"
                : isHidden
                ? "border-amber-300 bg-amber-50/40"
                : "border-zinc-200/60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="relative w-7 h-7 rounded-full overflow-hidden bg-zinc-200 shrink-0">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-emerald-800 bg-emerald-100">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-zinc-900">
                    {displayName}
                  </span>

                  {/* Hiển thị "đã trả lời @Ai" */}
                  {replyToDisplayName && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                      <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span className="text-zinc-500">đã trả lời</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/60">
                        @{replyToDisplayName}
                      </span>
                    </span>
                  )}
                  {/* Chỉ tác giả chính của truyện mới hiện badge Tác giả */}
                  {(reply.isStoryAuthor || (storyAuthorId && commenter?._id === storyAuthorId)) && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Tác giả
                    </span>
                  )}
                  {/* Quản trị viên / Quản lý (nếu không phải tác giả chính) */}
                  {!(reply.isStoryAuthor || (storyAuthorId && commenter?._id === storyAuthorId)) &&
                    commenter?.role &&
                    (commenter.role === "ADMIN" || commenter.role === "MANAGER") && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 uppercase">
                        {commenter.role}
                      </span>
                    )}
                  <span className="text-[10px] text-zinc-400">
                    • {formatRelativeTime(reply.createdAt)}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              {isHidden && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Đã bị ẩn
                </span>
              )}
            </div>

            {/* Content or Edit Form */}
            {editingId === reply._id ? (
              <div className="mt-2 space-y-2">
                <textarea
                  rows={2}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-zinc-200 bg-white resize-none focus:outline-hidden focus:border-emerald-600"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-2.5 py-1 text-[11px] font-medium text-zinc-600 bg-zinc-200 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleSaveEdit(reply._id)}
                    className="px-3 py-1 text-[11px] font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-800 mt-1.5 whitespace-pre-line leading-relaxed pl-9">
                {reply.content}
              </p>
            )}

            {/* Actions */}
            {editingId !== reply._id && (
              <div className="flex items-center gap-3 mt-2 pl-9 text-[11px]">
                <button
                  type="button"
                  onClick={() => onReplyTo(commenter, reply._id)}
                  className="font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Trả lời</span>
                </button>

                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(reply)}
                      className="text-zinc-500 hover:text-zinc-800 cursor-pointer"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(reply._id)}
                      className="text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      Xóa
                    </button>
                  </>
                )}

                {canModerate && (
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() =>
                      toggleVisibility({
                        commentId: reply._id,
                        status: isHidden ? "VISIBLE" : "HIDDEN",
                      })
                    }
                    className={`font-medium cursor-pointer ${
                      isHidden
                        ? "text-emerald-700 hover:text-emerald-800"
                        : "text-amber-600 hover:text-amber-700"
                    }`}
                  >
                    {isHidden ? "Cho hiện lại" : "Ẩn phản hồi"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
