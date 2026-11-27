"use client";

import React from "react";
import type { AuthorRequestItem } from "@/features/author";

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
  const displayName = userInfo?.displayName || "Người dùng";

  return (
    <div className="admin-dialog-overlay fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-950/50 animate-in fade-in duration-200">
      <div className="admin-dialog bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div
          className={`admin-dialog-header flex items-center justify-between px-6 py-4 border-b ${
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
            <h3 className={`admin-dialog-title text-base font-semibold ${isApproved ? "text-emerald-900" : "text-rose-900"}`}>
              {isApproved ? "Xác nhận duyệt yêu cầu" : "Xác nhận từ chối yêu cầu"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="admin-dialog-close text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-sm text-gray-700">
          {/* Thông tin vắn tắt */}
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Tài khoản:</span>
              <span className="font-semibold text-gray-800">{displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bút danh đăng ký:</span>
              <span className="font-medium text-admin-brand-600">{request.penName}</span>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            {isApproved
              ? "Tài khoản người dùng sẽ được tự động nâng cấp vai trò thành TÁC GIẢ (AUTHOR) và tạo hồ sơ tác giả tương ứng trên hệ thống."
              : "Yêu cầu sẽ chuyển sang trạng thái TỪ CHỐI. Người dùng có thể xem lý do và cập nhật lại thông tin để gửi xét duyệt lại."}
          </p>

          {/* Ghi chú của Admin */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Ghi chú của Ban Quản Trị {isApproved ? "(Không bắt buộc)" : "(Nên ghi rõ lý do)"}
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
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-admin-brand-500/20 focus:border-admin-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="admin-dialog-footer px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-admin-card transition-all flex items-center gap-2 ${
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

