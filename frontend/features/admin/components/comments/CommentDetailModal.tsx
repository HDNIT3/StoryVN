"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { AdminCommentItem, AdminCommentStatus } from "../../types/comment.types";

interface CommentDetailModalProps {
  comment: AdminCommentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (commentId: string, status: AdminCommentStatus) => void;
  onDeletePermanent: (commentId: string) => void;
  isUpdating?: boolean;
}

export function CommentDetailModal({
  comment,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeletePermanent,
  isUpdating,
}: CommentDetailModalProps) {
  if (!isOpen || !comment) return null;

  const commenter = comment.userId;
  const replyTo = comment.replyToUserId;
  const story = comment.storyId;
  const forumPost = comment.forumPostId;
  const chapter = comment.chapterId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="admin-dialog-overlay fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-950/50 animate-in fade-in duration-150"
    >
      <div
        className="admin-dialog bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-3rem)] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="admin-dialog-header flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-admin-brand-50 text-admin-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="admin-dialog-title text-sm font-semibold text-gray-900">Chi tiết bình luận</h3>
              <p className="text-xs text-gray-400">Kiểm duyệt nội dung thảo luận</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="admin-dialog-close p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content body */}
        <div className="admin-dialog-body p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Người bình luận */}
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 flex items-center gap-3.5">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-200 border border-gray-300 shrink-0">
              {commenter?.avatarUrl ? (
                <Image
                  src={commenter.avatarUrl}
                  alt={commenter.displayName || "Avatar"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-medium text-admin-brand-700 bg-admin-brand-100">
                  {(commenter?.displayName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">
                  {commenter?.displayName || "Không tên"}
                </span>
                {commenter?.role && (
                  <span className="px-1.5 py-0.2 rounded text-xs font-medium bg-admin-brand-50 text-admin-brand-700 border border-admin-brand-200/70">
                    {commenter.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {commenter?.email}
              </p>
            </div>
          </div>

          {/* Vị trí bình luận: Truyện / Bài viết & Chương */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white">
              <span className="text-xs font-medium text-gray-500 block mb-1">
                {forumPost ? "Bài viết diễn đàn" : "Tác phẩm"}
              </span>
              {story ? (
                <Link
                  href={`/truyen/${story.slug}`}
                  target="_blank"
                  className="font-semibold text-admin-brand-600 hover:text-admin-brand-800 hover:underline flex items-center gap-1.5 line-clamp-1"
                >
                  <span>{story.title}</span>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              ) : forumPost ? (
                <Link
                  href={`/dien-dan/${forumPost.slug || forumPost._id}`}
                  target="_blank"
                  className="font-semibold text-admin-brand-600 hover:text-admin-brand-800 hover:underline flex items-center gap-1.5 line-clamp-1"
                >
                  <span>{forumPost.title}</span>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              ) : (
                <span className="text-gray-400 italic">Không rõ</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 bg-white">
              <span className="text-xs font-medium text-gray-500 block mb-1">
                Vị trí đăng
              </span>
              {chapter && story ? (
                <Link
                  href={`/truyen/${story.slug}/chuong/${chapter.chapterNumber}`}
                  target="_blank"
                  className="font-semibold text-admin-brand-600 hover:text-admin-brand-800 hover:underline flex items-center gap-1.5 line-clamp-1"
                >
                  <span>Chương {chapter.chapterNumber}: {chapter.title}</span>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              ) : forumPost ? (
                <span className="text-gray-700 font-medium">Bình luận bài viết diễn đàn</span>
              ) : (
                <span className="text-gray-700 font-medium">Bình luận cấp truyện chính</span>
              )}
            </div>
          </div>

          {/* Phản hồi ai & số phản hồi con */}
          {(replyTo || comment.replyCount > 0) && (
            <div className="flex items-center gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
              {replyTo && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Trả lời:</span>
                  <span className="font-semibold text-admin-brand-700">@{replyTo.displayName}</span>
                </div>
              )}
              {comment.replyCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Số phản hồi con:</span>
                  <span className="font-medium text-gray-800">{comment.replyCount}</span>
                </div>
              )}
            </div>
          )}

          {/* Nội dung bình luận */}
          <div>
            <span className="text-xs font-medium text-gray-500 block mb-2">
              Nội dung bình luận
            </span>
            <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-200 whitespace-pre-wrap leading-relaxed text-gray-800 font-normal">
              {comment.content}
            </div>
          </div>

          {/* Thời gian & Trạng thái */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div>
              <span>Ngày đăng: </span>
              <span className="font-semibold text-gray-700">
                {new Date(comment.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <div>
              <span>Trạng thái: </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  comment.status === "VISIBLE"
                    ? "bg-emerald-100 text-emerald-800"
                    : comment.status === "HIDDEN"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {comment.status === "VISIBLE"
                  ? "Hiển thị"
                  : comment.status === "HIDDEN"
                  ? "Đang ẩn"
                  : "Đã xóa"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="admin-dialog-footer flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bình luận này khỏi hệ thống? Thao tác này không thể hoàn tác.")) {
                onDeletePermanent(comment._id);
                onClose();
              }
            }}
            className="px-3.5 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Xóa vĩnh viễn
          </button>

          <div className="flex items-center gap-2">
            {comment.status !== "VISIBLE" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(comment._id, "VISIBLE")}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-admin-card disabled:opacity-50"
              >
                Hiện bình luận
              </button>
            )}

            {comment.status === "VISIBLE" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(comment._id, "HIDDEN")}
                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Ẩn bình luận
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

