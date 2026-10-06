"use client";

import React from "react";
import type { AuthorRequestItem } from "@/types/author";

interface Props {
  open: boolean;
  request: AuthorRequestItem | null;
  action: "APPROVED" | "REJECTED" | null;
  adminNote: string;
  isLoading: boolean;
  onAdminNoteChange: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function AuthorRequestReviewModal({
  open,
  request,
  action,
  adminNote,
  isLoading,
  onAdminNoteChange,
  onClose,
  onSubmit,
}: Props) {
  if (!open || !request || !action) return null;

  const isApproved = action === "APPROVED";
  const userInfo = typeof request.userId === "object" && request.userId !== null ? request.userId : null;
  const displayName = userInfo?.displayName || userInfo?.username || "Người dùng";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isApproved ? "bg-emerald-50/70 border-emerald-100" : "bg-rose-50/70 border-rose-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                isApproved ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {isApproved ? "✓" : "✕"}
            </span>
            <h3 className={`text-base font-bold ${isApproved ? "text-emerald-900" : "text-rose-900"}`}>
              {isApproved ? "Xác nhận duyệt yêu cầu" : "Xác nhận từ chối yêu cầu"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          {/* Thông tin vắn tắt */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Tài khoản:</span>
              <span className="font-semibold text-slate-800">{displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bút danh đăng ký:</span>
              <span className="font-bold text-sky-600">{request.penName}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isApproved
              ? "Tài khoản người dùng sẽ được tự động nâng cấp vai trò thành TÁC GIẢ (AUTHOR) và tạo hồ sơ tác giả tương ứng trên hệ thống."
              : "Yêu cầu sẽ chuyển sang trạng thái TỪ CHỐI. Người dùng có thể xem lý do và cập nhật lại thông tin để gửi xét duyệt lại."}
          </p>

          {/* Ghi chú kiểm duyệt */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ghi chú kiểm duyệt {isApproved ? "(Không bắt buộc)" : "(Nên ghi rõ lý do)"}
            </label>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => onAdminNoteChange(e.target.value)}
              placeholder={
                isApproved
                  ? "Lời chúc mừng hoặc lưu ý thêm cho tác giả..."
                  : "Nêu rõ lý do chưa đạt (ví dụ: bút danh trùng, thiếu thông tin ngân hàng...)"
              }
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all flex items-center gap-2 ${
              isApproved
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
            } disabled:opacity-50`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isApproved ? "Đồng ý phê duyệt" : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}
