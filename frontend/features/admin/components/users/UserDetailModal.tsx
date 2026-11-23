import React from "react";
import type { AdminUserItem, AdminUserDetail } from "@/features/admin";
import type { UserRole } from "@/features/user";
import { ROLE_COLOR, ROLE_LABEL, STATUS_COLOR, STATUS_LABEL, formatDate } from "./UserTypes";

interface UserDetailModalProps {
  user: AdminUserItem | null;
  detail?: AdminUserDetail;
  isLoadingDetail?: boolean;
  currentUserRole: UserRole;
  onClose: () => void;
  onBan: (u: AdminUserItem) => void;
  onUnban: (u: AdminUserItem) => void;
  onChangeRole: (u: AdminUserItem, role: UserRole) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  currentUserRole,
  detail,
  isLoadingDetail = false,
  onClose,
  onBan,
  onUnban,
  onChangeRole,
}) => {
  if (!user) return null;

  const canChangeRole = currentUserRole === "ADMIN";
  const isBanned = user.status === "BANNED";

  return (
    <div
      className="admin-dialog-overlay fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/50 p-4"
      onClick={onClose}
    >
      <div
        className="admin-dialog bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-7 max-h-[calc(100dvh-3rem)] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="admin-dialog-close absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-admin-brand-500 text-white flex items-center justify-center text-xl sm:text-2xl font-semibold shadow-admin-card shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              (user.displayName || user.username || "?").charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="admin-dialog-title text-lg sm:text-xl font-semibold text-gray-900 truncate">{user.displayName}</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">@{user.username}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_COLOR[user.role] || "bg-gray-100 text-gray-600"}`}>
                {ROLE_LABEL[user.role] || user.role}
              </span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLOR[user.status] || "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABEL[user.status] || user.status}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 text-sm">
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Email</p>
            <p className="font-semibold text-gray-800 truncate">{user.email}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">ID</p>
            <p className="font-mono text-xs text-gray-600 truncate">{user._id}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Ngày tạo</p>
            <p className="font-semibold text-gray-800">{formatDate(user.createdAt)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Cập nhật</p>
            <p className="font-semibold text-gray-800">{formatDate(user.updatedAt)}</p>
          </div>
        </div>

        {isLoadingDetail ? <p className="mb-5 text-sm text-gray-500">Đang tải hồ sơ đầy đủ...</p> : detail && <section className="mb-4 rounded-xl border border-gray-200 p-3.5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Full account details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">{Object.entries(detail.user).filter(([key]) => !["_id", "__v", "passwordHash", "displayName", "username", "email", "role", "status", "avatarUrl", "createdAt", "updatedAt"].includes(key)).map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-xs text-gray-400">{key}</dt><dd className="break-words text-xs font-medium text-gray-700">{typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "Not provided")}</dd></div>)}</dl>
        </section>}
        {isLoadingDetail ? null : (detail?.authorProfile || detail?.authorRequest || detail?.managerProfile) && <div className="space-y-3 mb-6">
          {([["Hồ sơ tác giả", detail?.authorProfile], ["Yêu cầu tác giả", detail?.authorRequest], ["Hồ sơ quản lý", detail?.managerProfile]] as const).map(([title, profile]) => profile && <section key={title} className="rounded-xl border border-gray-200 p-3.5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">{Object.entries(profile).filter(([key]) => key !== "_id" && key !== "__v" && key !== "userId").map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-xs text-gray-400">{key}</dt><dd className="break-words text-xs font-medium text-gray-700">{typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "Not provided")}</dd></div>)}</dl>
          </section>)}
        </div>}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Đổi vai trò — chỉ ADMIN */}
          {canChangeRole && user.role !== "ADMIN" && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Đổi vai trò</p>
              <div className="flex flex-wrap gap-2">
                {(["USER", "AUTHOR", "MANAGER"] as UserRole[])
                  .filter((r) => r !== user.role)
                  .map((role) => (
                    <button
                      key={role}
                      onClick={() => onChangeRole(user, role)}
                      className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${ROLE_COLOR[role]} border-current/20 hover:opacity-80`}
                    >
                      → {ROLE_LABEL[role]}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Ban / Unban */}
          <div className="flex gap-3 pt-1">
            {isBanned ? (
              <button
                onClick={() => onUnban(user)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                ✅ Mở khóa tài khoản
              </button>
            ) : (
              <button
                disabled={user.role === "ADMIN"}
                onClick={() => onBan(user)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🚫 Cấm tài khoản
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
