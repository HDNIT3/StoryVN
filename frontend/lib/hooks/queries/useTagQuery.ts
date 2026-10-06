import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { tagService } from "@/lib/services/tag.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type {
  CreateTagPayload,
  QueryTagParams,
  UpdateTagPayload,
} from "@/types/tag";

/**
 * Hook lấy danh sách tags với phân trang, lọc và tìm kiếm
 */
export function useTags(params: QueryTagParams) {
  return useQuery({
    queryKey: queryKeys.tags.list(params),
    queryFn: async () => {
      const res = await tagService.findAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook lấy chi tiết tag theo ID
 */
export function useTagDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.tags.detail(id),
    queryFn: async () => {
      const res = await tagService.findById(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

/**
 * Mutation tạo mới tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTagPayload) => {
      const res = await tagService.create(payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Tạo thẻ tag mới thành công!");
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể tạo thẻ tag");
    },
  });
}

/**
 * Mutation cập nhật tag
 */
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
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể cập nhật thẻ tag");
    },
  });
}

/**
 * Mutation xóa tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await tagService.delete(id);
      return res;
    },
    onSuccess: () => {
      toast.success("Đã xóa thẻ tag thành công!");
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể xóa thẻ tag");
    },
  });
}

/**
 * Mutation nạp dữ liệu tag mẫu (Seed)
 */
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
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Khởi tạo dữ liệu tag thất bại");
    },
  });
}
