"use client";

import React from "react";
import Image from "next/image";
import type { AdminStoryItem } from "@/types/story";

interface Props {
  story: AdminStoryItem | null;
  onClose: () => void;
  onOpenReview: (story: AdminStoryItem, action: "APPROVED" | "REJECTED") => void;
}

export function StoryReviewDetailModal({
  story,
  onClose,
  onOpenReview,
}: Props) {
  if (!story) return null;

  const authorPenName =
    story.author?.penName ||
    (typeof story.authorId === "object"
      ? story.authorId?.displayName
      : "Tác giả");
  const authorEmail =
    story.author?.email ||
    (typeof story.authorId === "object" ? story.authorId?.email : "");

  const isPending = story.status === "PENDING_REVIEW";
  const hasAppeal = Boolean(story.authorFeedback?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">
              📖
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Thẩm định chi tiết tác phẩm
              </h3>
              <p className="text-xs text-slate-500">
                Kiểm duyệt nội dung, văn án, thể loại và ảnh bìa truyện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cảnh báo khiếu nại nếu có */}
          {hasAppeal && (
            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-800">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  Tác giả gửi phản hồi giải trình (Khiếu nại)
                </span>
                {story.appealedAt && (
                  <span className="text-[11px] text-indigo-600 font-medium">
                    {new Date(story.appealedAt).toLocaleString("vi-VN")}
                  </span>
                )}
              </div>
              <div className="text-xs bg-white/80 p-3 rounded-lg border border-indigo-100 leading-relaxed text-slate-800">
                <strong className="text-indigo-900 block mb-1">Nội dung giải trình:</strong>
                {story.authorFeedback}
              </div>
              {story.rejectReason && (
                <div className="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded border border-rose-200">
                  <strong>Lý do từ chối trước đó:</strong> {story.rejectReason}
                </div>
              )}
            </div>
          )}

          {/* Phần ảnh bìa và thông tin cơ bản */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Ảnh bìa (Cover) */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative w-40 h-56 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-md">
                {story.coverUrl ? (
                  <Image
                    src={story.coverUrl}
                    alt={story.title}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 p-2 text-center">
                    <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Chưa có ảnh bìa</span>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-2 font-medium">
                Ảnh bìa tác phẩm
              </span>
            </div>

            {/* Thông tin metadata */}
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {story.title}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Đường dẫn (slug): <strong className="text-slate-600">/{story.slug}</strong>
                </p>
              </div>

              {/* Tác giả */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Bút danh tác giả:</span>
                  <span className="font-bold text-sky-700 text-sm">{authorPenName}</span>
                </div>
                {authorEmail && (
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Email liên hệ:</span>
                    <span className="text-slate-700 font-medium">{authorEmail}</span>
                  </div>
                )}
              </div>

              {/* Thể loại & Tags */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 block">
                  Thể loại truyện:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {story.genreIds && story.genreIds.length > 0 ? (
                    story.genreIds.map((g) => (
                      <span
                        key={g._id}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60"
                      >
                        {g.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Chưa gắn thể loại</span>
                  )}
                </div>
              </div>

              {/* Thẻ tags */}
              {story.tagIds && story.tagIds.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Thẻ tag:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {story.tagIds.map((t) => (
                      <span
                        key={t._id}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600"
                      >
                        #{t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Phân loại phụ */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Độ tuổi:</span>
                  <span className="font-bold text-slate-800">{story.ageRating || "ALL"}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Tiến độ:</span>
                  <span className="font-bold text-slate-800">{story.progressState || "ONGOING"}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Nguồn gốc:</span>
                  <span className="font-bold text-slate-800">{story.originType || "ORIGINAL"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Văn án / Nội dung giới thiệu */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>📝</span> Văn án & Giới thiệu nội dung
            </h4>
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto font-sans">
              {story.description || "Tác phẩm chưa có văn án giới thiệu."}
            </div>
          </div>

          {/* Ghi chú của tác giả */}
          {story.authorNote && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                💬 Lời nhắn từ tác giả
              </h4>
              <p className="text-xs bg-amber-50/60 border border-amber-200/70 p-3 rounded-lg text-amber-900 leading-relaxed italic">
                {story.authorNote}
              </p>
            </div>
          )}

          {/* Người duyệt trước đó nếu có */}
          {story.reviewedBy && story.reviewedAt && (
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>
                Người duyệt gần nhất: <strong>{story.reviewedBy.displayName}</strong>
              </span>
              <span>
                Thời gian: {new Date(story.reviewedAt).toLocaleString("vi-VN")}
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>

          {isPending ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenReview(story, "REJECTED")}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                ✕ Từ chối tác phẩm
              </button>
              <button
                type="button"
                onClick={() => onOpenReview(story, "APPROVED")}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                ✓ Phê duyệt xuất bản
              </button>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500">
              Tác phẩm này đã hoàn tất kiểm duyệt ({story.status})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
