import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  adminUserService,
  type QueryAdminUsersParams,
} from "@/lib/services/admin-user.service";
import { authorRequestService } from "@/lib/services/author-request.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type { UserRole } from "@/types/user";
import type { QueryAuthorRequestsParams, AuthorRequestStatus } from "@/types/author";

// ─── ADMIN USERS QUERIES & MUTATIONS ─────────────────────────────

/**
 * Hook lấy danh sách người dùng cho Admin với phân trang & lọc
 */
export function useAdminUsers(params: QueryAdminUsersParams) {
  return useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: async () => {
      const res = await adminUserService.findAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData, // Giữ dữ liệu trang cũ khi chuyển trang
  });
}

/**
 * Hook lấy thống kê người dùng cho Admin
 */
export function useAdminUserStats() {
  return useQuery({
    queryKey: queryKeys.admin.userStats,
    queryFn: async () => {
      const res = await adminUserService.getStats();
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

/**
 * Mutation Cập nhật trạng thái người dùng (ACTIVE / BANNED)
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      status,
      reason,
    }: {
      userId: string;
      status: "ACTIVE" | "BANNED";
      reason?: string;
    }) => {
      const res = await adminUserService.updateStatus(userId, { status, reason });
      return res;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "BANNED"
          ? "Đã cấm tài khoản thành công!"
          : "Đã mở khóa tài khoản thành công!"
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể cập nhật trạng thái");
    },
  });
}

/**
 * Mutation Thay đổi vai trò người dùng
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const res = await adminUserService.updateRole(userId, { role });
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật vai trò thành công");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể cập nhật vai trò");
    },
  });
}

// ─── ADMIN AUTHOR REQUESTS QUERIES & MUTATIONS ───────────────────

/**
 * Hook lấy danh sách yêu cầu nâng cấp tác giả
 */
export function useAdminAuthorRequests(params: QueryAuthorRequestsParams) {
  return useQuery({
    queryKey: queryKeys.admin.authorRequests(params),
    queryFn: async () => {
      const res = await authorRequestService.findAllRequests(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Mutation Duyệt hoặc Từ chối yêu cầu tác giả
 */
export function useReviewAuthorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      adminNote?: string;
    }) => {
      const res = await authorRequestService.reviewRequest(id, {
        status,
        adminNote: adminNote?.trim() || undefined,
      });
      return res;
    },
    onSuccess: (_, variables) => {
      const isApproved = variables.status === "APPROVED";
      toast.success(
        isApproved
          ? "Đã duyệt yêu cầu thành công, tài khoản đã được nâng cấp!"
          : "Đã từ chối yêu cầu thành công!"
      );
      // Invalidate danh sách yêu cầu + danh sách users admin
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Xử lý yêu cầu thất bại");
    },
  });
}
