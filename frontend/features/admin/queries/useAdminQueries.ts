"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  adminUserService,
  type QueryAdminUsersParams,
} from "../services/admin-user.service";
import { authorRequestService } from "@/features/author";
import { adminKeys } from "./admin.keys";
import { toast } from "@/lib/toast";
import type { UserRole } from "@/features/user";
import type { QueryAuthorRequestsParams } from "@/features/author";

export function useAdminUsers(params: QueryAdminUsersParams) {
  return useQuery({
    queryKey: adminKeys.users(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await adminUserService.findAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserStats() {
  return useQuery({
    queryKey: adminKeys.userStats,
    queryFn: async () => {
      const res = await adminUserService.getStats();
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

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
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể cập nhật trạng thái";
      toast.error(msg);
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const res = await adminUserService.updateRole(userId, { role });
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật vai trò thành công");
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể cập nhật vai trò";
      toast.error(msg);
    },
  });
}

export function useAdminAuthorRequests(params: QueryAuthorRequestsParams) {
  return useQuery({
    queryKey: adminKeys.authorRequests(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await authorRequestService.findAllRequests(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

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
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Xử lý yêu cầu thất bại";
      toast.error(msg);
    },
  });
}

