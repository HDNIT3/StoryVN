"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userService,
  type UpdateProfilePayload,
  type UpdateAvatarPayload,
  type ChangePasswordPayload,
} from "../services/user.service";
import { authorRequestService } from "@/features/author";
import { userKeys } from "./user.keys";
import { authKeys } from "@/features/auth/queries/auth.keys";
import { toast } from "@/lib/toast";

export function useUserProfile(enabled = true) {
  return useQuery({
    queryKey: userKeys.profile,
    queryFn: async () => {
      const res = await userService.getProfile();
      return res.data?.user ?? null;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserAuthorStatus(enabled = true) {
  return useQuery({
    queryKey: userKeys.authorStatus,
    queryFn: async () => {
      const res = await authorRequestService.getAuthorProfileAndRequestStatus();
      return res.data;
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

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
      queryClient.invalidateQueries({ queryKey: userKeys.profile });
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Cập nhật hồ sơ thất bại";
      toast.error(msg);
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: userKeys.profile });
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Cập nhật ảnh đại diện thất bại";
      toast.error(msg);
    },
  });
}

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
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Đổi mật khẩu thất bại";
      toast.error(msg);
    },
  });
}
