import React from "react";
import type { RoleFilter, StatusFilter } from "./UserTypes";

interface UserFilterBarProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  search: string;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  roleFilter: RoleFilter;
  onRoleFilterChange: (val: RoleFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (val: StatusFilter) => void;
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  searchInput,
  setSearchInput,
  search,
  onSearchSubmit,
  onClearSearch,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
      {/* Search */}
      <form onSubmit={onSearchSubmit} className="flex-1 flex items-center gap-2">
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
            onClick={onClearSearch}
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
          onChange={(e) => onRoleFilterChange(e.target.value as RoleFilter)}
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
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          className="flex-1 sm:flex-initial text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/40 cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="BANNED">Bị cấm</option>
        </select>
      </div>
    </div>
  );
};
