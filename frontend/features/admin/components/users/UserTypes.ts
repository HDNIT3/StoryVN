import React from "react";
import type { UserRole, UserStatus } from "@/features/user";

export type RoleFilter = UserRole | "ALL";
export type StatusFilter = UserStatus | "ALL";

export interface ConfirmModalState {
  open: boolean;
  userId: string;
  username: string;
  action: "ban" | "unban" | "role";
  newStatus?: UserStatus;
  newRole?: UserRole;
  isLoading: boolean;
}

export const ROLE_LABEL: Record<string, string> = {
  USER: "Người dùng",
  AUTHOR: "Tác giả",
  MANAGER: "Quản lý",
  ADMIN: "Admin",
};

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  BANNED: "Bị cấm",
};

export const ROLE_COLOR: Record<string, string> = {
  USER: "bg-slate-100 text-slate-700",
  AUTHOR: "bg-violet-100 text-violet-700",
  MANAGER: "bg-amber-100 text-amber-700",
  ADMIN: "bg-rose-100 text-rose-700",
};

export const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  BANNED: "bg-red-100 text-red-700",
};

export function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}
