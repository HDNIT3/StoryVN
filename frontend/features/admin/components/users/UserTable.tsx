import React from "react";
import type { AdminUserItem } from "@/features/admin";
import { ROLE_COLOR, ROLE_LABEL, STATUS_COLOR, STATUS_LABEL, formatDate } from "./UserTypes";

interface UserTableProps {
  items: AdminUserItem[];
  isLoading: boolean;
  totalItems: number;
  hasFilter: boolean;
  onClearFilter: () => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  onViewUser: (u: AdminUserItem) => void;
  onBanUser: (u: AdminUserItem) => void;
  onUnbanUser: (u: AdminUserItem) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  items,
  isLoading,
  totalItems,
  hasFilter,
  onClearFilter,
  limit,
  onLimitChange,
  onViewUser,
  onBanUser,
  onUnbanUser,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table header info */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-slate-600">
            {isLoading ? "Đang tải..." : `${totalItems.toLocaleString("vi-VN")} người dùng`}
            {hasFilter && <span className="ml-1.5 text-sky-600">(đang lọc)</span>}
          </p>
          {hasFilter && (
            <button
              onClick={onClearFilter}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline cursor-pointer"
            >
              Xoá bộ lọc
            </button>
          )}
        </div>

        {/* Limit selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="select-limit" className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Hiển thị:
          </label>
          <select
            id="select-limit"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400/40 cursor-pointer"
          >
            <option value={10}>10 / trang</option>
            <option value={12}>12 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <svg className="w-14 h-14 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="font-semibold">Không tìm thấy người dùng nào</p>
          <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <th className="px-6 py-3.5 text-left">Người dùng</th>
                <th className="px-4 py-3.5 text-left">Email</th>
                <th className="px-4 py-3.5 text-center">Vai trò</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-center">Ngày tạo</th>
                <th className="px-4 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60 transition-colors group">
                  {/* Avatar + Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          (u.displayName || u.username || "?").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate max-w-[140px]">{u.displayName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">@{u.username}</p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-4 text-slate-600 truncate max-w-[180px]">{u.email}</td>

                  {/* Role */}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_COLOR[u.role] || "bg-slate-100 text-slate-600"}`}>
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[u.status] || "bg-slate-100 text-slate-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`} />
                      {STATUS_LABEL[u.status] || u.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 text-center text-slate-500">{formatDate(u.createdAt)}</td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        id={`btn-view-user-${u._id}`}
                        onClick={() => onViewUser(u)}
                        className="w-7 h-7 rounded-md border border-slate-700/80 bg-white text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Xem chi tiết người dùng"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {u.status === "BANNED" ? (
                        <button
                          id={`btn-unban-user-${u._id}`}
                          onClick={() => onUnbanUser(u)}
                          disabled={u.role === "ADMIN"}
                          className="w-7 h-7 rounded-md border border-slate-700/80 bg-white text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Mở khóa tài khoản"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          id={`btn-ban-user-${u._id}`}
                          onClick={() => onBanUser(u)}
                          disabled={u.role === "ADMIN"}
                          className="w-7 h-7 rounded-md border border-slate-700/80 bg-white text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Khóa tài khoản người dùng"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
