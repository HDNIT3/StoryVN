"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { coinPackageService } from "../services/coin-package.service";
import { coinPackageKeys } from "./coin-package.keys";
import { toast } from "@/lib/toast";
import type {
  CreateCoinPackagePayload,
  QueryCoinPackageParams,
  UpdateCoinPackagePayload,
} from "../types";

export function useActiveCoinPackages() {
  return useQuery({
    queryKey: coinPackageKeys.userList(),
    queryFn: async () => {
      const res = await coinPackageService.getActivePackages();
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminCoinPackages(params: QueryCoinPackageParams) {
  return useQuery({
    queryKey: coinPackageKeys.adminList(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await coinPackageService.findAdminAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCoinPackageDetail(id: string) {
  return useQuery({
    queryKey: coinPackageKeys.detail(id),
    queryFn: async () => {
      const res = await coinPackageService.findById(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCoinPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCoinPackagePayload) => {
      const res = await coinPackageService.create(payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Tạo gói nạp mới thành công!");
      queryClient.invalidateQueries({ queryKey: coinPackageKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể tạo gói nạp, vui lòng thử lại!");
    },
  });
}

export function useUpdateCoinPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCoinPackagePayload;
    }) => {
      const res = await coinPackageService.update(id, payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật gói nạp thành công!");
      queryClient.invalidateQueries({ queryKey: coinPackageKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể cập nhật gói nạp, vui lòng thử lại!");
    },
  });
}

export function useToggleCoinPackageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await coinPackageService.toggleStatus(id);
      return res;
    },
    onSuccess: (res) => {
      toast.success(res?.message || "Thay đổi trạng thái gói nạp thành công!");
      queryClient.invalidateQueries({ queryKey: coinPackageKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể thay đổi trạng thái gói nạp!");
    },
  });
}

export function useDeleteCoinPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await coinPackageService.delete(id);
      return res;
    },
    onSuccess: () => {
      toast.success("Xóa gói nạp thành công!");
      queryClient.invalidateQueries({ queryKey: coinPackageKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể xóa gói nạp!");
    },
  });
}

export function useSeedCoinPackages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await coinPackageService.seed();
      return res;
    },
    onSuccess: (res) => {
      toast.success(res?.message || "Khởi tạo dữ liệu mẫu thành công!");
      queryClient.invalidateQueries({ queryKey: coinPackageKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể khởi tạo dữ liệu mẫu!");
    },
  });
}
