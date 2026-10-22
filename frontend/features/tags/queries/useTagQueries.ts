"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { tagService } from "../services/tag.service";
import { tagKeys } from "./tag.keys";
import { toast } from "@/lib/toast";
import type {
  CreateTagPayload,
  QueryTagParams,
  UpdateTagPayload,
} from "../types";

export function useTags(params: QueryTagParams) {
  return useQuery({
    queryKey: tagKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await tagService.findAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useTagDetail(id: string) {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: async () => {
      const res = await tagService.findById(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTagPayload) => {
      const res = await tagService.create(payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Tạo thẻ tag mới thành công!");
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể tạo thẻ tag";
      toast.error(msg);
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTagPayload;
    }) => {
      const res = await tagService.update(id, payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật thẻ tag thành công!");
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể cập nhật thẻ tag";
      toast.error(msg);
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await tagService.delete(id);
      return res;
    },
    onSuccess: () => {
      toast.success("Đã xóa thẻ tag thành công!");
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể xóa thẻ tag";
      toast.error(msg);
    },
  });
}

export function useSeedTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await tagService.seed();
      return res;
    },
    onSuccess: (res) => {
      const { createdCount, skippedCount } = res.data;
      toast.success(
        `Nạp tag mẫu hoàn tất: ${createdCount} mới, ${skippedCount} đã có sẵn!`
      );
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Khởi tạo dữ liệu tag thất bại";
      toast.error(msg);
    },
  });
}
