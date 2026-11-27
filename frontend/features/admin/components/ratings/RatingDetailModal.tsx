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
      className="admin-dialog-overlay fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-950/50 animate-in fade-in duration-150"
    >
      <div
        className="admin-dialog bg-white rounded-2xl max-w-xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-3rem)] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="admin-dialog-header flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base">
              ★
            </div>
            <div>
              <h3 className="admin-dialog-title text-sm font-semibold text-gray-900">Chi tiết đánh giá</h3>
              <p className="text-xs text-gray-400">ID: {rating._id}</p>
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
          {/* Người đánh giá */}
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 flex items-center gap-3.5">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-200 border border-gray-300 shrink-0">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName || "Avatar"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-medium text-amber-700 bg-amber-100">
                  {(user?.displayName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-gray-900 text-sm">
                {user?.displayName || "Ẩn danh"}
              </span>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Tác phẩm được đánh giá */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-white">
            <span className="text-xs font-medium text-gray-500 block mb-1">
              Tác phẩm được đánh giá
            </span>
            {story ? (
              <Link
                href={`/truyen/${story.slug}`}
                target="_blank"
                className="font-semibold text-admin-brand-600 hover:text-admin-brand-800 hover:underline flex items-center gap-1.5"
              >
                <span>{story.title}</span>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            ) : (
              <span className="text-gray-400 italic">Không rõ tác phẩm</span>
            )}
          </div>

          {/* Điểm sao */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-amber-900 block">Số sao đánh giá</span>
              <div className="flex items-center gap-1 text-lg text-amber-400 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= rating.rating ? "text-amber-500" : "text-gray-300"}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-semibold text-amber-700">{rating.rating}</span>
              <span className="text-xs font-medium text-amber-600"> / 5.0</span>
            </div>
          </div>

          {/* Nội dung nhận xét */}
          <div>
            <span className="text-xs font-medium text-gray-500 block mb-2">
              Nội dung bài viết nhận xét
            </span>
            <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-200 whitespace-pre-wrap leading-relaxed text-gray-800 font-normal min-h-[70px]">
              {rating.review ? rating.review : <span className="text-gray-400 italic">Người dùng chỉ để lại số sao, không viết nhận xét văn bản.</span>}
            </div>
          </div>

          {/* Thời gian & Trạng thái */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div>
              <span>Ngày gửi: </span>
              <span className="font-semibold text-gray-700">
                {new Date(rating.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <div>
              <span>Trạng thái: </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
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
        <div className="admin-dialog-footer flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này? Hệ thống sẽ tính toán lại điểm trung bình cho truyện.")) {
                onDeletePermanent(rating._id);
                onClose();
              }
            }}
            className="px-3.5 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Xóa vĩnh viễn
          </button>

          <div className="flex items-center gap-2">
            {rating.status !== "VISIBLE" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(rating._id, "VISIBLE")}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-admin-card disabled:opacity-50"
              >
                Hiện đánh giá
              </button>
            )}

            {rating.status === "VISIBLE" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(rating._id, "HIDDEN")}
                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Ẩn đánh giá
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

