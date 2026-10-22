"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { categoryService } from "../services/category.service";
import { categoryKeys } from "./category.keys";
import { toast } from "@/lib/toast";
import type {
  CreateCategoryPayload,
  QueryCategoryParams,
  UpdateCategoryPayload,
} from "../types";

export function useCategories(params: QueryCategoryParams) {
  return useQuery({
    queryKey: categoryKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await categoryService.findAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: categoryKeys.list({ all: true }),
    queryFn: async () => {
      const res = await categoryService.findAll({ all: true });
      return res.data?.items ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoryDetail(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: async () => {
      const res = await categoryService.findById(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const res = await categoryService.create(payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Tạo thể loại mới thành công!");
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể tạo thể loại";
      toast.error(msg);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryPayload;
    }) => {
      const res = await categoryService.update(id, payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật thể loại thành công!");
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể cập nhật thể loại";
      toast.error(msg);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await categoryService.delete(id);
      return res;
    },
    onSuccess: () => {
      toast.success("Đã xóa thể loại thành công!");
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể xóa thể loại";
      toast.error(msg);
    },
  });
}

export function useSeedCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await categoryService.seed();
      return res;
    },
    onSuccess: (res) => {
      const { createdCount, skippedCount } = res.data;
      toast.success(
        `Nạp thể loại mẫu hoàn tất: ${createdCount} mới, ${skippedCount} đã có sẵn!`
      );
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Khởi tạo dữ liệu thể loại thất bại";
      toast.error(msg);
    },
  });
}
