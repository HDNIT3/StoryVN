import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userService,
  type UpdateProfilePayload,
  type UpdateAvatarPayload,
  type ChangePasswordPayload,
} from "@/lib/services/user.service";
import { authorRequestService } from "@/lib/services/author-request.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";

/**
 * Hook lấy profile người dùng hiện tại
 */
export function useUserProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: async () => {
      const res = await userService.getProfile();
      return res.data?.user ?? null;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

/**
 * Hook lấy hồ sơ tác giả & trạng thái yêu cầu của người dùng hiện tại
 */
export function useUserAuthorStatus(enabled = true) {
  return useQuery({
    queryKey: queryKeys.user.authorStatus,
    queryFn: async () => {
      const res = await authorRequestService.getAuthorProfileAndRequestStatus();
      return res.data;
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Mutation Cập nhật thông tin profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const res = await userService.updateProfile(payload);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật hồ sơ thành công!");
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Cập nhật hồ sơ thất bại");
    },
  });
}

/**
 * Mutation Cập nhật ảnh đại diện
 */
export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateAvatarPayload) => {
      const res = await userService.updateAvatar(payload);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật ảnh đại diện thành công!");
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Cập nhật ảnh đại diện thất bại");
    },
  });
}

/**
 * Mutation Đổi mật khẩu
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const res = await userService.changePassword(payload);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Đổi mật khẩu thất bại");
    },
  });
}

/**
 * Mutation Cập nhật ảnh bìa
 */
export function useUpdateCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coverUrl: string) => {
      const res = await userService.updateCover(coverUrl);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật ảnh bìa thành công!");
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Cập nhật ảnh bìa thất bại");
    },
  });
}

/**
 * Mutation Cập nhật hồ sơ tác giả
 */
export function useUpdateAuthorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      penName?: string;
      biography?: string;
      website?: string;
      socialLinks?: Record<string, any>;
      bankName?: string;
      bankAccountNumber?: string;
      bankAccountName?: string;
    }) => {
      const res = await authorRequestService.updateAuthorProfile(payload);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật hồ sơ tác giả thành công!");
      queryClient.invalidateQueries({ queryKey: queryKeys.user.authorStatus });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Cập nhật hồ sơ tác giả thất bại");
    },
  });
}
