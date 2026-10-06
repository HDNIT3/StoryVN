import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { categoryService } from "@/lib/services/category.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type {
  CreateCategoryPayload,
  QueryCategoryParams,
  UpdateCategoryPayload,
} from "@/types/category";

/**
 * Hook lấy danh sách thể loại / danh mục với phân trang, lọc và tìm kiếm
 */
export function useCategories(params: QueryCategoryParams) {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: async () => {
      const res = await categoryService.findAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook lấy chi tiết thể loại theo ID
 */
export function useCategoryDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: async () => {
      const res = await categoryService.findById(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

/**
 * Mutation tạo mới thể loại
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const res = await categoryService.create(payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Tạo thể loại mới thành công!");
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể tạo thể loại");
    },
  });
}

/**
 * Mutation cập nhật thể loại
 */
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
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể cập nhật thể loại");
    },
  });
}

/**
 * Mutation xóa thể loại
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await categoryService.delete(id);
      return res;
    },
    onSuccess: () => {
      toast.success("Đã xóa thể loại thành công!");
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể xóa thể loại");
    },
  });
}

/**
 * Mutation nạp dữ liệu thể loại mẫu (Seed)
 */
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
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Khởi tạo dữ liệu thể loại thất bại");
    },
  });
}
