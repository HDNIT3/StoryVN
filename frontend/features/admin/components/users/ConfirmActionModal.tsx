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
    : "bg-sky-500 hover:bg-sky-600 text-white";

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto ${isBan ? "bg-red-100" : modal.action === "unban" ? "bg-emerald-100" : "bg-sky-100"}`}>
          {isBan ? (
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ) : modal.action === "unban" ? (
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-slate-500 text-center mb-6">{desc}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={modal.isLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-60"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={modal.isLoading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-60 ${confirmColor}`}
          >
            {modal.isLoading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};
