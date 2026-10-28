"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { AdminCommentItem, AdminCommentStatus } from "../../types/comment.types";

interface CommentTableProps {
  comments: AdminCommentItem[];
  isLoading?: boolean;
  onViewDetail: (comment: AdminCommentItem) => void;
  onUpdateStatus: (commentId: string, status: AdminCommentStatus) => void;
  onDeletePermanent: (commentId: string) => void;
  isUpdating?: boolean;
}

export function CommentTable({
  comments,
  isLoading,
  onViewDetail,
  onUpdateStatus,
  onDeletePermanent,
  isUpdating,
}: CommentTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
            <div className="w-20 h-6 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-800">Không tìm thấy bình luận nào</p>
        <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 px-4">Người bình luận</th>
              <th className="py-3.5 px-4">Tác phẩm / Vị trí</th>
              <th className="py-3.5 px-4 min-w-[200px]">Nội dung</th>
              <th className="py-3.5 px-4">Ngày đăng</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comments.map((comment) => {
              const commenter = comment.userId;
              const replyTo = comment.replyToUserId;
              const story = comment.storyId;
              const chapter = comment.chapterId;
              const isHidden = comment.status === "HIDDEN";
              const isDeleted = comment.status === "DELETED";

              return (
                <tr
                  key={comment._id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {/* Người bình luận */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                        {commenter?.avatarUrl ? (
                          <Image
                            src={commenter.avatarUrl}
                            alt={commenter.displayName || "Avatar"}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[11px] text-indigo-700 bg-indigo-100">
                            {(commenter?.displayName || commenter?.username || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate max-w-[130px]">
                          {commenter?.displayName || commenter?.username || "Ẩn danh"}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                          @{commenter?.username || "user"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Tác phẩm / Vị trí */}
                  <td className="py-3.5 px-4 align-top max-w-[160px]">
                    {story ? (
                      <Link
                        href={`/truyen/${story.slug}`}
                        target="_blank"
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 block text-xs"
                        title={story.title}
                      >
                        {story.title}
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Không rõ</span>
                    )}

                    {chapter ? (
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Chương {chapter.chapterNumber}
                      </span>
                    ) : (
                      <span className="inline-block mt-1 text-[10px] text-slate-400">
                        Trang truyện
                      </span>
                    )}
                  </td>

                  {/* Nội dung */}
                  <td className="py-3.5 px-4 align-top">
                    {replyTo && (
                      <div className="inline-flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50/70 px-1.5 py-0.2 rounded mb-1 border border-indigo-100">
                        <span className="text-slate-400">Trả lời</span>
                        <span className="font-semibold">@{replyTo.displayName || replyTo.username}</span>
                      </div>
                    )}
                    <p className={`line-clamp-2 text-xs leading-relaxed ${isDeleted ? "text-slate-400 italic" : "text-slate-800"}`}>
                      {comment.content}
                    </p>
                    {comment.replyCount > 0 && (
                      <span className="inline-block mt-1 text-[10px] text-slate-400 font-medium">
                        💬 {comment.replyCount} phản hồi
                      </span>
                    )}
                  </td>

                  {/* Ngày đăng */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs text-slate-500">
                    {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        comment.status === "VISIBLE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isHidden
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          comment.status === "VISIBLE"
                            ? "bg-emerald-500"
                            : isHidden
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      {comment.status === "VISIBLE"
                        ? "Hiển thị"
                        : isHidden
                        ? "Đang ẩn"
                        : "Đã xóa"}
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetail(comment)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Nút Ẩn / Hiện */}
                      {comment.status === "VISIBLE" ? (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => onUpdateStatus(comment._id, "HIDDEN")}
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Ẩn bình luận"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => onUpdateStatus(comment._id, "VISIBLE")}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Cho hiện lại"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}

                      {/* Xóa vĩnh viễn */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => {
                          if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bình luận này khỏi hệ thống?")) {
                            onDeletePermanent(comment._id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Xóa vĩnh viễn"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

