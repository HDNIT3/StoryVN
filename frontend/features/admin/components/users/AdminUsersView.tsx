"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  type AdminUserItem,
  type QueryAdminUsersParams,
  useAdminUsers,
  useAdminUserStats,
  useUpdateUserStatus,
  useUpdateUserRole,
} from "@/features/admin";
import type { UserRole, UserStatus } from "@/features/user";
import { UserStatsCards } from "./UserStatsCards";
import { UserFilterBar } from "./UserFilterBar";
import { UserTable } from "./UserTable";
import { UserDetailModal } from "./UserDetailModal";
import { ConfirmActionModal } from "./ConfirmActionModal";
import type { RoleFilter, StatusFilter, ConfirmModalState } from "./UserTypes";

export const AdminUsersView: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  // Modals
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    open: false,
    userId: "",
    username: "",
    action: "ban",
    isLoading: false,
  });

  // Query params
  const queryParams: QueryAdminUsersParams = {
    page,
    limit,
  };
  if (search.trim()) queryParams.search = search.trim();
  if (roleFilter !== "ALL") queryParams.role = roleFilter;
  if (statusFilter !== "ALL") queryParams.status = statusFilter;

  // React Query hooks
  const {
    data: usersData,
    isLoading,
    refetch: refetchUsers,
  } = useAdminUsers(queryParams);

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useAdminUserStats();

  const items = usersData?.items ?? [];
  const totalItems = usersData?.pagination?.totalItems ?? 0;
  const totalPages = usersData?.pagination?.totalPages ?? 1;

  // Mutations
  const updateStatusMutation = useUpdateUserStatus();
  const updateRoleMutation = useUpdateUserRole();

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // Filter change handlers
  const handleRoleFilterChange = (val: RoleFilter) => {
    setRoleFilter(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: StatusFilter) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Action openers
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

  // Confirm action
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

  // Stats values
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

  const hasFilter = Boolean(search || roleFilter !== "ALL" || statusFilter !== "ALL");

  return (
    <div className="space-y-7">
      {/* Tiêu đề */}
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

      {/* Stats Cards */}
      <UserStatsCards
        statsLoading={statsLoading}
        totalUsers={stats?.totalUsers ?? 0}
        totalActive={totalActive}
        totalAuthors={totalAuthors}
        totalBanned={totalBanned}
      />

      {/* Filter + Search */}
      <UserFilterBar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        search={search}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={() => {
          setSearch("");
          setSearchInput("");
        }}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
      />

      {/* Table */}
      <UserTable
        items={items}
        isLoading={isLoading}
        totalItems={totalItems}
        hasFilter={hasFilter}
        onClearFilter={() => {
          setSearch("");
          setSearchInput("");
          setRoleFilter("ALL");
          setStatusFilter("ALL");
          setPage(1);
        }}
        limit={limit}
        onLimitChange={handleLimitChange}
        onViewUser={(u) => setSelectedUser(u)}
        onBanUser={openBan}
        onUnbanUser={openUnban}
      />

      {/* Pagination */}
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

      {/* Detail Modal */}
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

      {/* Confirm Modal */}
      <ConfirmActionModal
        modal={confirmModal}
        onClose={() => setConfirmModal({ open: false, userId: "", username: "", action: "ban", isLoading: false })}
        onConfirm={handleConfirm}
      />
    </div>
  );
};
