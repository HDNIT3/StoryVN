"use client";

import React, { useState } from "react";
import type { AdminStoryItem } from "@/types/story";

interface Props {
  open: boolean;
  story: AdminStoryItem | null;
  action: "APPROVED" | "REJECTED" | null;
  rejectReason: string;
  isLoading: boolean;
  onRejectReasonChange: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function StoryReviewConfirmModal({
  open,
  story,
  action,
  rejectReason,
  isLoading,
  onRejectReasonChange,
  onClose,
  onSubmit,
}: Props) {
  const [errorMsg, setErrorMsg] = useState("");

  if (!open || !story || !action) return null;

  const isApproved = action === "APPROVED";
  const authorPenName =
    story.author?.penName ||
    (typeof story.authorId === "object"
      ? story.authorId?.displayName
      : "Tác giả");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApproved && !rejectReason.trim()) {
      setErrorMsg("Vui lòng nhập lý do từ chối tác phẩm để thông báo cho tác giả.");
      return;
    }
    setErrorMsg("");
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isApproved
              ? "bg-emerald-50/80 border-emerald-100"
              : "bg-rose-50/80 border-rose-100"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                isApproved
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {isApproved ? "✓" : "✕"}
            </span>
            <h3
              className={`text-base font-bold ${
                isApproved ? "text-emerald-900" : "text-rose-900"
              }`}
            >
              {isApproved
                ? "Xác nhận Phê duyệt tác phẩm"
                : "Xác nhận Từ chối tác phẩm"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tóm tắt tác phẩm */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Tác phẩm:</span>
              <span className="font-bold text-slate-800 line-clamp-1 max-w-[220px]">
                {story.title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tác giả:</span>
              <span className="font-semibold text-sky-700">{authorPenName}</span>
            </div>
          </div>

          {isApproved ? (
            <div className="text-xs text-slate-600 leading-relaxed bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/80 space-y-1.5">
              <p>
                Sau khi phê duyệt, tác phẩm sẽ ngay lập tức chuyển sang trạng thái{" "}
                <strong className="text-emerald-700">ĐÃ XUẤT BẢN (PUBLISHED)</strong>{" "}
                và hiển thị công khai trên nền tảng StoryVN.
              </p>
              <p className="text-slate-500 text-[11px]">
                Hệ thống sẽ tự động gửi email thông báo chúc mừng tới tác giả.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Lý do từ chối <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  onRejectReasonChange(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                rows={4}
                placeholder="Nhập lý do cụ thể (VD: Ảnh bìa vi phạm bản quyền / Văn án chứa từ ngữ phản cảm / Chọn sai thể loại...)"
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 placeholder-slate-400 resize-none leading-relaxed"
              />
              {errorMsg && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {errorMsg}
                </p>
              )}
              <p className="text-[11px] text-slate-500 leading-normal">
                Lý do này sẽ được gửi trực tiếp qua email cho tác giả và hiển thị trên màn hình quản lý tác phẩm của họ để chỉnh sửa hoặc gửi giải trình.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                isApproved
                  ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/20"
                  : "bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-500/20"
              }`}
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isApproved ? "Đồng ý Phê duyệt" : "Xác nhận Từ chối"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
