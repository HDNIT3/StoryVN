"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { AdminRatingItem, AdminRatingStatus } from "../../types/rating.types";

interface RatingDetailModalProps {
  rating: AdminRatingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (ratingId: string, status: AdminRatingStatus) => void;
  onDeletePermanent: (ratingId: string) => void;
  isUpdating?: boolean;
}

export function RatingDetailModal({
  rating,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeletePermanent,
  isUpdating,
}: RatingDetailModalProps) {
  if (!isOpen || !rating) return null;

  const user = rating.userId;
  const story = rating.storyId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base">
              ★
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chi tiết đánh giá</h3>
              <p className="text-[11px] text-slate-400">ID: {rating._id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Người đánh giá */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3.5">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName || "Avatar"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-amber-700 bg-amber-100">
                  {(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-slate-900 text-sm">
                {user?.displayName || user?.username || "Ẩn danh"}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                @{user?.username || "username"} {user?.email ? `• ${user.email}` : ""}
              </p>
            </div>
          </div>

          {/* Tác phẩm được đánh giá */}
          <div className="p-3.5 rounded-xl border border-slate-200/70 bg-white">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tác phẩm được đánh giá
            </span>
            {story ? (
              <Link
                href={`/truyen/${story.slug}`}
                target="_blank"
                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5"
              >
                <span>{story.title}</span>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            ) : (
              <span className="text-slate-400 italic">Không rõ tác phẩm</span>
            )}
          </div>

          {/* Điểm sao */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-900 block">Số sao đánh giá</span>
              <div className="flex items-center gap-1 text-lg text-amber-400 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= rating.rating ? "text-amber-500" : "text-slate-300"}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-700">{rating.rating}</span>
              <span className="text-xs font-bold text-amber-600"> / 5.0</span>
            </div>
          </div>

          {/* Nội dung nhận xét */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Nội dung bài viết nhận xét
            </span>
            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/80 whitespace-pre-wrap leading-relaxed text-slate-800 font-normal min-h-[70px]">
              {rating.review ? rating.review : <span className="text-slate-400 italic">Người dùng chỉ để lại số sao, không viết nhận xét văn bản.</span>}
            </div>
          </div>

          {/* Thời gian & Trạng thái */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div>
              <span>Ngày gửi: </span>
              <span className="font-semibold text-slate-700">
                {new Date(rating.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <div>
              <span>Trạng thái: </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  rating.status === "VISIBLE"
                    ? "bg-emerald-100 text-emerald-800"
                    : rating.status === "HIDDEN"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {rating.status === "VISIBLE"
                  ? "Hiển thị"
                  : rating.status === "HIDDEN"
                  ? "Đang ẩn"
                  : "Đã xóa"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này? Hệ thống sẽ tính toán lại điểm trung bình cho truyện.")) {
                onDeletePermanent(rating._id);
                onClose();
              }
            }}
            className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Xóa vĩnh viễn
          </button>

          <div className="flex items-center gap-2">
            {rating.status !== "VISIBLE" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(rating._id, "VISIBLE")}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                Hiện đánh giá
              </button>
            )}

            {rating.status === "VISIBLE" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(rating._id, "HIDDEN")}
                className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Ẩn đánh giá
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

