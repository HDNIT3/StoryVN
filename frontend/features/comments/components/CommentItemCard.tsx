"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import {
  useCreateComment,
  useDeleteComment,
  useToggleCommentVisibility,
  useUpdateComment,
} from "../queries/useCommentQueries";
import { CommentInputBox } from "./CommentInputBox";
import { CommentRepliesList } from "./CommentRepliesList";
import type { CommentItem, CommentUser } from "../types";

interface CommentItemCardProps {
  comment: CommentItem;
  storyId: string;
  storyAuthorId?: string | null;
  storySlug?: string;
  targetCommentId?: string | null;
  targetParentId?: string | null;
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

export const CommentItemCard: React.FC<CommentItemCardProps> = ({
  comment,
  storyId,
  storyAuthorId,
  storySlug,
  targetCommentId,
  targetParentId,
}) => {
  const { user } = useAuth();
  const isParentOfTarget = Boolean(targetParentId && comment._id === targetParentId);
  const [showReplies, setShowReplies] = useState(isParentOfTarget);

  useEffect(() => {
    if (isParentOfTarget) {
      setShowReplies(true);
    }
  }, [isParentOfTarget]);

  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (comment._id === targetCommentId && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [comment._id, targetCommentId]);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{
    user: CommentUser;
    commentId: string;
    isReplyToReply: boolean;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const commenter = comment.userId;
  const displayName = commenter?.displayName || commenter?.username || "Độc giả";
  const replyToUser = comment.replyToUserId;
  const replyToDisplayName = replyToUser?.displayName || replyToUser?.username;
  const avatarUrl = commenter?.avatarUrl;
  const isOwner = user && user._id === commenter?._id;
  const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";
  const isStoryAuthor = user && storyAuthorId && user._id === storyAuthorId;
  const canModerate = isAdmin || isStoryAuthor;
  const isHidden = comment.status === "HIDDEN";
  const isDeleted = comment.status === "DELETED";

  const { mutate: createReply, isPending: isSubmittingReply } =
    useCreateComment(storyId);
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();
  const { mutate: toggleVisibility, isPending: isToggling } =
    useToggleCommentVisibility();

  const handleReplySubmit = async (text: string) => {
    createReply(
      {
        storyId,
        chapterId: comment.chapterId?._id || null,
        parentId: replyTarget?.commentId || comment._id,
        replyToUserId: replyTarget?.isReplyToReply ? replyTarget.user._id : null,
        content: text,
      },
      {
        onSuccess: () => {
          setShowReplyInput(false);
          setReplyTarget(null);
          setShowReplies(true);
        },
      }
    );
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    updateComment(
      { commentId: comment._id, payload: { content: editContent.trim() } },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      deleteComment(comment._id);
    }
  };

  const handleRootReplyClick = () => {
    setReplyTarget({
      user: comment.userId,
      commentId: comment._id,
      isReplyToReply: false,
    });
    setShowReplyInput(true);
  };

  const handleChildReplyClick = (targetUser: CommentUser, targetCommentId: string) => {
    setReplyTarget({
      user: targetUser,
      commentId: targetCommentId,
      isReplyToReply: true,
    });
    setShowReplyInput(true);
  };

  const handleClearReplyTarget = () => {
    setReplyTarget(null);
  };

  const isTargeted = comment._id === targetCommentId;

  return (
    <div
      ref={cardRef}
      id={`comment-${comment._id}`}
      className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all ${
        isTargeted
          ? "ring-2 ring-emerald-500 bg-emerald-50/60 border-emerald-300 shadow-md"
          : isHidden
          ? "border-amber-300 bg-amber-50/20"
          : "border-zinc-200/80 shadow-2xs"
      }`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-emerald-800 bg-emerald-100">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-zinc-900 truncate">
                {displayName}
              </span>

              {replyToDisplayName && (
                <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                  <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span className="text-zinc-500 text-[11px]">đã trả lời</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/60">
                    @{replyToDisplayName}
                  </span>
                </span>
              )}

              {/* Chỉ tác giả chính của truyện mới hiện badge Tác giả */}
              {(comment.isStoryAuthor || (storyAuthorId && commenter?._id === storyAuthorId)) && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Tác giả
                </span>
              )}

              {/* Quản trị viên / Quản lý (nếu không phải tác giả chính) */}
              {!(comment.isStoryAuthor || (storyAuthorId && commenter?._id === storyAuthorId)) &&
                commenter?.role &&
                (commenter.role === "ADMIN" || commenter.role === "MANAGER") && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">
                    {commenter.role}
                  </span>
                )}

              {/* Chapter Tag nếu bình luận trong chương */}
              {comment.chapterId && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200/80">
                  {storySlug ? (
                    <Link
                      href={`/truyen/${storySlug}/chuong/${comment.chapterId.chapterNumber}`}
                      className="hover:text-emerald-700 transition-colors"
                    >
                      Chương {comment.chapterId.chapterNumber}
                    </Link>
                  ) : (
                    `Chương ${comment.chapterId.chapterNumber}`
                  )}
                </span>
              )}
            </div>

            <div className="text-[11px] text-zinc-400 mt-0.5">
              {formatRelativeTime(comment.createdAt)}
            </div>
          </div>
        </div>

        {/* Trạng thái Ẩn badge */}
        {isHidden && (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Đã bị ẩn
          </span>
        )}
      </div>

      {/* Nội dung bình luận */}
      <div className="mt-3 pl-13">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 bg-white resize-none focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 cursor-pointer"
              >
                {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
              isDeleted ? "text-zinc-400 italic" : "text-zinc-800"
            }`}
          >
            {comment.content}
          </p>
        )}

        {/* Action bar */}
        {!isEditing && !isDeleted && (
          <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
            <button
              type="button"
              onClick={handleRootReplyClick}
              className="font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Trả lời</span>
            </button>

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="font-medium text-zinc-500 hover:text-zinc-800 cursor-pointer"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="font-medium text-rose-500 hover:text-rose-700 cursor-pointer"
                >
                  Xóa
                </button>
              </>
            )}

            {/* Quyền ẨN / HIỆN LẠI dành cho Admin, Quản lý, và Tác giả truyện */}
            {canModerate && (
              <button
                type="button"
                disabled={isToggling}
                onClick={() =>
                  toggleVisibility({
                    commentId: comment._id,
                    status: isHidden ? "VISIBLE" : "HIDDEN",
                  })
                }
                className={`font-semibold cursor-pointer ${
                  isHidden
                    ? "text-emerald-700 hover:text-emerald-800"
                    : "text-amber-600 hover:text-amber-700"
                }`}
              >
                {isHidden ? "Cho hiện lại" : "Ẩn bình luận"}
              </button>
            )}

            {comment.replyCount > 0 && (
              <button
                type="button"
                onClick={() => setShowReplies(!showReplies)}
                className="font-semibold text-emerald-800/80 hover:text-emerald-900 ml-auto cursor-pointer"
              >
                {showReplies
                  ? "Thu gọn phản hồi"
                  : `Xem ${comment.replyCount} phản hồi...`}
              </button>
            )}
          </div>
        )}

        {/* Input trả lời */}
        {showReplyInput && (
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <CommentInputBox
              autoFocus
              replyToName={
                replyTarget?.isReplyToReply
                  ? replyTarget.user.displayName || replyTarget.user.username
                  : undefined
              }
              onClearReplyTo={handleClearReplyTarget}
              placeholder={
                replyTarget?.isReplyToReply
                  ? `Trả lời @${replyTarget.user.displayName || replyTarget.user.username}...`
                  : `Trả lời @${displayName}...`
              }
              onSubmit={handleReplySubmit}
              isSubmitting={isSubmittingReply}
              onCancel={() => {
                setShowReplyInput(false);
                setReplyTarget(null);
              }}
            />
          </div>
        )}

        {/* Danh sách câu trả lời con */}
        {showReplies && (
          <CommentRepliesList
            parentId={comment._id}
            storyAuthorId={storyAuthorId}
            onReplyTo={handleChildReplyClick}
            targetCommentId={targetCommentId}
          />
        )}
      </div>
    </div>
  );
};
