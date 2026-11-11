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
  useAdminDashboardOverview,
  AdminAreaChart,
  AdminDonutChart,
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
  const [showCharts, setShowCharts] = useState(true);

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

  const { data: dashboardData } = useAdminDashboardOverview(14);

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-2xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{showCharts ? "Ẩn biểu đồ" : "Xem biểu đồ"}</span>
          </button>
          <button
            onClick={() => {
              refetchUsers();
              refetchStats();
            }}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white rounded-xl border border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-60 cursor-pointer shadow-2xs"
          >
            <svg className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <UserStatsCards
        statsLoading={statsLoading}
        totalUsers={stats?.totalUsers ?? 0}
        totalActive={totalActive}
        totalAuthors={totalAuthors}
        totalBanned={totalBanned}
      />

      {/* Biểu đồ phân tích tài khoản & tăng trưởng người dùng */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminAreaChart
              title="Xu Hướng Đăng Ký Tài Khoản Mới (14 ngày qua)"
              subtitle="Lượng thành viên mới gia nhập cộng đồng StoryVN theo ngày"
              data={(dashboardData?.charts.timeline || []).map((t) => ({
                label: t.label,
                value: t.newUsers,
                tooltipTitle: `Ngày ${t.date}`,
              }))}
              height={220}
              valueSuffix=" thành viên"
              colorScheme="emerald"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <AdminDonutChart
              title="Cơ Cấu Vai Trò Người Dùng"
              subtitle="Phân bổ tài khoản theo quyền hệ thống"
              data={[
                { id: "user", name: "Độc giả", value: stats?.roles?.user ?? 0, color: "#0ea5e9" },
                { id: "author", name: "Tác giả", value: stats?.roles?.author ?? 0, color: "#8b5cf6" },
                { id: "manager", name: "Quản lý", value: stats?.roles?.manager ?? 0, color: "#f59e0b" },
                { id: "admin", name: "Quản trị viên", value: stats?.roles?.admin ?? 0, color: "#4f46e5" },
              ]}
              size={170}
              thickness={24}
              centerLabel="Tổng User"
              centerValue={stats?.totalUsers ?? 0}
            />
          </div>
        </div>
      )}

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
