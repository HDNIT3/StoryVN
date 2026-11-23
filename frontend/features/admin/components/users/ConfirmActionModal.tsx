import React from "react";
import { ROLE_LABEL, type ConfirmModalState } from "./UserTypes";

interface ConfirmActionModalProps {
  modal: ConfirmModalState;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  modal,
  onClose,
  onConfirm,
}) => {
  if (!modal.open) return null;

  const isBan = modal.action === "ban";

  const title = isBan
    ? "Xác nhận cấm tài khoản"
    : modal.action === "unban"
    ? "Xác nhận mở khóa tài khoản"
    : `Đổi vai trò → ${ROLE_LABEL[modal.newRole || ""] || modal.newRole}`;

  const desc = isBan
    ? `Tài khoản @${modal.username} sẽ bị cấm và không thể đăng nhập.`
    : modal.action === "unban"
    ? `Tài khoản @${modal.username} sẽ được mở khóa và có thể đăng nhập lại.`
    : `Vai trò của @${modal.username} sẽ thay đổi thành "${ROLE_LABEL[modal.newRole || ""] || modal.newRole}".`;

  const confirmColor = isBan
    ? "bg-red-500 hover:bg-red-600 text-white"
    : modal.action === "unban"
    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
    : "bg-admin-brand-500 hover:bg-admin-brand-600 text-white";

  return (
    <div
      className="admin-dialog-overlay fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/50 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="admin-dialog bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm p-7 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto border shadow-admin-card ${
          isBan
            ? "bg-rose-50 text-rose-600 border-rose-200"
            : modal.action === "unban"
            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
            : "bg-admin-brand-50 text-admin-brand-600 border-admin-brand-200"
        }`}>
          {isBan ? (
            <svg className="w-7 h-7 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ) : modal.action === "unban" ? (
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-admin-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <h3 className="admin-dialog-title text-lg font-semibold text-gray-900 text-center mb-1.5">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-500 text-center leading-relaxed mb-6">{desc}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={modal.isLoading}
            className="flex-1 py-2.5 rounded-lg text-sm sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-60"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={modal.isLoading}
            className={`flex-1 py-2.5 rounded-lg text-sm sm:text-sm font-medium shadow-admin-card transition-all cursor-pointer disabled:opacity-60 ${confirmColor}`}
          >
            {modal.isLoading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};
