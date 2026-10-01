import api from "../api";
import type { UserRole, UserStatus } from "../../types/user";

// ─── Response Types ───────────────────────────────────────────────

export interface AdminUserItem {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserStats {
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

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedAdminUsers {
  items: AdminUserItem[];
  pagination: PaginationMeta;
}

export interface AdminUserApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Query Params ─────────────────────────────────────────────────

export interface QueryAdminUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

// ─── Update Payloads ─────────────────────────────────────────────

export interface UpdateUserStatusPayload {
  status: UserStatus;
  reason?: string;
}

export interface UpdateUserRolePayload {
  role: UserRole;
}

// ─── Service ─────────────────────────────────────────────────────

export const adminUserService = {
  /**
   * Lấy danh sách người dùng với phân trang, lọc và tìm kiếm (Admin/Manager)
   */
  findAll(params?: QueryAdminUsersParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.role) searchParams.append("role", params.role);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/admin/users?${queryString}`
      : "/admin/users";

    return api.get<AdminUserApiResponse<PaginatedAdminUsers>>(endpoint);
  },

  /**
   * Lấy thống kê tổng quan người dùng theo vai trò và trạng thái (Admin/Manager)
   */
  getStats() {
    return api.get<AdminUserApiResponse<AdminUserStats>>("/admin/users/stats");
  },

  /**
   * Xem chi tiết thông tin một người dùng theo ID (Admin/Manager)
   */
  findById(id: string) {
    return api.get<AdminUserApiResponse<{ user: AdminUserItem }>>(
      `/admin/users/${id}`
    );
  },

  /**
   * Thay đổi trạng thái tài khoản người dùng: ACTIVE hoặc BANNED (Admin/Manager)
   */
  updateStatus(id: string, payload: UpdateUserStatusPayload) {
    return api.patch<AdminUserApiResponse<{ user: AdminUserItem }>>(
      `/admin/users/${id}/status`,
      payload
    );
  },

  /**
   * Thay đổi vai trò người dùng (Chỉ ADMIN)
   */
  updateRole(id: string, payload: UpdateUserRolePayload) {
    return api.patch<AdminUserApiResponse<{ user: AdminUserItem }>>(
      `/admin/users/${id}/role`,
      payload
    );
  },
};

export default adminUserService;
