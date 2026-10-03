"use client";

import React, { useState } from "react";
import {
  type AdminUserItem,
  type QueryAdminUsersParams,
} from "@/lib/services/admin-user.service";
import {
  useAdminUsers,
  useAdminUserStats,
  useUpdateUserStatus,
  useUpdateUserRole,
} from "@/lib/hooks/queries/useAdminQuery";
import { useAuth } from "@/lib/context/AuthContext";
import type { UserRole, UserStatus } from "@/types/user";

// ─── Types ────────────────────────────────────────────────────────

type RoleFilter = UserRole | "ALL";
type StatusFilter = UserStatus | "ALL";

interface StatsData {
  totalUsers: number;
  status?: {
    active: number;
    banned: number;
  };
  roles?: {
    user: number;
    author: number;
    manager: number;
    admin: number;
  };
  newUsersToday?: number;
  byRole?: Record<string, number>;
  byStatus?: Record<string, number>;
}

interface ConfirmModal {
  open: boolean;
  userId: string;
  username: string;
  action: "ban" | "unban" | "role";
  newStatus?: UserStatus;
  newRole?: UserRole;
  isLoading: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  USER: "Người dùng",
  AUTHOR: "Tác giả",
  MANAGER: "Quản lý",
  ADMIN: "Admin",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  BANNED: "Bị cấm",
};

const ROLE_COLOR: Record<string, string> = {
  USER: "bg-slate-100 text-slate-700",
  AUTHOR: "bg-violet-100 text-violet-700",
  MANAGER: "bg-amber-100 text-amber-700",
  ADMIN: "bg-rose-100 text-rose-700",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  BANNED: "bg-red-100 text-red-700",
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

// ─── Stat Card ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 bg-white shadow-xs ${color}`}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white/70 shadow-xs">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight">{value.toLocaleString("vi-VN")}</p>
        <p className="text-xs font-semibold opacity-70 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── User Detail Modal ─────────────────────────────────────────────

function UserDetailModal({
  user,
  currentUserRole,
  onClose,
  onBan,
  onUnban,
  onChangeRole,
}: {
  user: AdminUserItem | null;
  currentUserRole: UserRole;
  onClose: () => void;
  onBan: (u: AdminUserItem) => void;
  onUnban: (u: AdminUserItem) => void;
  onChangeRole: (u: AdminUserItem, role: UserRole) => void;
}) {
  if (!user) return null;

  const canChangeRole = currentUserRole === "ADMIN";
  const isBanned = user.status === "BANNED";
  const isSelf = false; // không thể tự xác định ở đây nhưng BE đã guard

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-7 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-sm shrink-0">
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
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{user.displayName}</h2>
            <p className="text-xs sm:text-sm text-slate-500 truncate">@{user.username}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${ROLE_COLOR[user.role] || "bg-slate-100 text-slate-600"}`}>
                {ROLE_LABEL[user.role] || user.role}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLOR[user.status] || "bg-slate-100 text-slate-600"}`}>
                {STATUS_LABEL[user.status] || user.status}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 text-sm">
          <div className="bg-slate-50 rounded-xl p-3.5">
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Email</p>
            <p className="font-semibold text-slate-800 truncate">{user.email}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5">
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">ID</p>
            <p className="font-mono text-xs text-slate-600 truncate">{user._id}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5">
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Ngày tạo</p>
            <p className="font-semibold text-slate-800">{formatDate(user.createdAt)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5">
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Cập nhật</p>
            <p className="font-semibold text-slate-800">{formatDate(user.updatedAt)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Đổi vai trò — chỉ ADMIN */}
          {canChangeRole && user.role !== "ADMIN" && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Đổi vai trò</p>
              <div className="flex flex-wrap gap-2">
                {(["USER", "AUTHOR", "MANAGER"] as UserRole[])
                  .filter((r) => r !== user.role)
                  .map((role) => (
                    <button
                      key={role}
                      onClick={() => onChangeRole(user, role)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${ROLE_COLOR[role]} border-current/20 hover:opacity-80`}
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
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                ✅ Mở khóa tài khoản
              </button>
            ) : (
              <button
                disabled={user.role === "ADMIN"}
                onClick={() => onBan(user)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🚫 Cấm tài khoản
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────

function ConfirmActionModal({
  modal,
  onClose,
  onConfirm,
}: {
  modal: ConfirmModal;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!modal.open) return null;

  const isBan = modal.action === "ban";
  const isRole = modal.action === "role";

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
}

// ─── Main Page ────────────────────────────────────────────────────

// ─── Main Page ────────────────────────────────────────────────────

export default function QuanLyNguoiDungPage() {
  const { user: currentUser } = useAuth();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    open: false,
    userId: "",
    username: "",
    action: "ban",
    isLoading: false,
  });

  // ── TanStack Query: Stats & List ──
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminUserStats();

  const queryParams: QueryAdminUsersParams = {
    page,
    limit,
    role: roleFilter !== "ALL" ? (roleFilter as UserRole) : undefined,
    status: statusFilter !== "ALL" ? (statusFilter as UserStatus) : undefined,
    search: search.trim() || undefined,
  };

  const {
    data: usersData,
    isLoading,
    refetch: refetchUsers,
  } = useAdminUsers(queryParams);

  const items = usersData?.items ?? [];
  const totalPages = usersData?.pagination?.totalPages ?? 1;
  const totalItems = usersData?.pagination?.totalItems ?? 0;

  // ── TanStack Mutations ──
  const updateStatusMutation = useUpdateUserStatus();
  const updateRoleMutation = useUpdateUserRole();

  // ── Search submit ──
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // ── Filter change handlers ──
  const handleRoleFilterChange = (val: RoleFilter) => {
    setRoleFilter(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: StatusFilter) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleLimitChange = (val: number) => {
    setLimit(val);
    setPage(1);
  };

  // ── Open confirm modals ──
  const openBan = (u: AdminUserItem) => {
    setSelectedUser(null);
    setConfirmModal({
      open: true,
      userId: u._id,
      username: u.username,
      action: "ban",
      newStatus: "BANNED",
      isLoading: false,
    });
  };

  const openUnban = (u: AdminUserItem) => {
    setSelectedUser(null);
    setConfirmModal({
      open: true,
      userId: u._id,
      username: u.username,
      action: "unban",
      newStatus: "ACTIVE",
      isLoading: false,
    });
  };

  const openChangeRole = (u: AdminUserItem, role: UserRole) => {
    setSelectedUser(null);
    setConfirmModal({
      open: true,
      userId: u._id,
      username: u.username,
      action: "role",
      newRole: role,
      isLoading: false,
    });
  };

  // ── Confirm action ──
  const handleConfirm = async () => {
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      if (confirmModal.action === "ban" || confirmModal.action === "unban") {
        await updateStatusMutation.mutateAsync({
          userId: confirmModal.userId,
          status: confirmModal.newStatus!,
        });
      } else if (confirmModal.action === "role") {
        await updateRoleMutation.mutateAsync({
          userId: confirmModal.userId,
          role: confirmModal.newRole!,
        });
      }
      setConfirmModal({ open: false, userId: "", username: "", action: "ban", isLoading: false });
    } catch {
      setConfirmModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // ── Stats values ──
  const totalActive =
    stats?.status?.active ??
    stats?.byStatus?.ACTIVE ??
    (stats as any)?.status?.ACTIVE ??
    0;
  const totalBanned =
    stats?.status?.banned ??
    stats?.byStatus?.BANNED ??
    (stats as any)?.status?.BANNED ??
    0;
  const totalAuthors =
    stats?.roles?.author ??
    stats?.byRole?.AUTHOR ??
    (stats as any)?.roles?.AUTHOR ??
    0;

  return (
    <div className="space-y-7">
      {/* ── Tiêu đề ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem, tìm kiếm, lọc và quản lý toàn bộ tài khoản trên StoryVN
          </p>
        </div>
        <button
          onClick={() => {
            refetchUsers();
            refetchStats();
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60 cursor-pointer shadow-xs"
        >
          <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>


      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng người dùng"
          value={statsLoading ? 0 : (stats?.totalUsers ?? 0)}
          color="border-sky-100 text-sky-800"
          icon={
            <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Đang hoạt động"
          value={statsLoading ? 0 : totalActive}
          color="border-emerald-100 text-emerald-800"
          icon={
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Tác giả"
          value={statsLoading ? 0 : totalAuthors}
          color="border-violet-100 text-violet-800"
          icon={
            <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <StatCard
          label="Bị cấm"
          value={statsLoading ? 0 : totalBanned}
          color="border-red-100 text-red-800"
          icon={
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
      </div>

      {/* ── Filter + Search Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search-users"
              type="text"
              placeholder="Tìm theo tên, username, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 sm:px-4 py-2.5 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
          >
            Tìm
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); }}
              className="px-3 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Xoá
            </button>
          )}
        </form>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {/* Role filter */}
          <select
            id="filter-role"
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value as RoleFilter)}
            className="flex-1 sm:flex-initial text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/40 cursor-pointer"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="USER">Người dùng</option>
            <option value="AUTHOR">Tác giả</option>
            <option value="MANAGER">Quản lý</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* Status filter */}
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value as StatusFilter)}
            className="flex-1 sm:flex-initial text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/40 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="BANNED">Bị cấm</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table header info */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-slate-600">
              {isLoading ? "Đang tải..." : `${totalItems.toLocaleString("vi-VN")} người dùng`}
              {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
                <span className="ml-1.5 text-sky-600">(đang lọc)</span>
              )}
            </p>
            {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                  setPage(1);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                Xoá bộ lọc
              </button>
            )}
          </div>

          {/* Chọn số lượng item mỗi trang */}
          <div className="flex items-center gap-2">
            <label htmlFor="select-limit" className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Hiển thị:
            </label>
            <select
              id="select-limit"
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
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
                  <tr
                    key={u._id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
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
                    <td className="px-4 py-4 text-slate-600 truncate max-w-[180px]">
                      {u.email}
                    </td>

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
                    <td className="px-4 py-4 text-center text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          id={`btn-view-user-${u._id}`}
                          onClick={() => setSelectedUser(u)}
                          className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors cursor-pointer"
                        >
                          Chi tiết
                        </button>
                        {u.status === "BANNED" ? (
                          <button
                            id={`btn-unban-user-${u._id}`}
                            onClick={() => openUnban(u)}
                            disabled={u.role === "ADMIN"}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Mở khóa
                          </button>
                        ) : (
                          <button
                            id={`btn-ban-user-${u._id}`}
                            onClick={() => openBan(u)}
                            disabled={u.role === "ADMIN"}
                            className="text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Cấm
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

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Trước
          </button>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i < 6 ? i + 1 : totalPages;
              } else if (page >= totalPages - 3) {
                p = i === 0 ? 1 : totalPages - 6 + i;
              } else {
                const opts = [1, page - 1, page, page + 1, totalPages];
                p = opts[Math.min(i, opts.length - 1)];
              }
              return (
                <button
                  key={`page-${p}-${i}`}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-xs border ${
                    p === page
                      ? "bg-sky-500 text-white border-sky-500 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
          >
            Tiếp
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          currentUserRole={currentUser?.role as UserRole}
          onClose={() => setSelectedUser(null)}
          onBan={openBan}
          onUnban={openUnban}
          onChangeRole={openChangeRole}
        />
      )}

      {/* ── Confirm Modal ── */}
      <ConfirmActionModal
        modal={confirmModal}
        onClose={() => setConfirmModal({ open: false, userId: "", username: "", action: "ban", isLoading: false })}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
