import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { adminStoryService } from "@/lib/services/admin-story.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type { QueryAdminStoriesParams } from "@/types/story";

/**
 * Hook lấy danh sách tác phẩm cho Admin với phân trang & lọc
 */
export function useAdminStories(params: QueryAdminStoriesParams) {
  return useQuery({
    queryKey: queryKeys.admin.stories(params),
    queryFn: async () => {
      const res = await adminStoryService.findAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook lấy thống kê số lượng truyện theo từng tab (Badge đếm)
 */
export function useAdminStoryCounts() {
  return useQuery({
    queryKey: queryKeys.admin.storyCounts,
    queryFn: async () => {
      const res = await adminStoryService.getCounts();
      return res.data;
    },
    refetchInterval: 1000 * 30, // Cập nhật tự động mỗi 30s
  });
}

/**
 * Hook lấy chi tiết tác phẩm theo ID
 */
export function useAdminStoryDetail(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.admin.storyDetail(id) : ["admin", "stories", "detail", "empty"],
    queryFn: async () => {
      if (!id) return null;
      const res = await adminStoryService.findById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

/**
 * Mutation Phê duyệt tác phẩm
 */
export function useApproveStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string) => {
      const res = await adminStoryService.approve(storyId);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã phê duyệt tác phẩm "${data.title}" thành công!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Phê duyệt tác phẩm thất bại");
    },
  });
}

/**
 * Mutation Từ chối duyệt tác phẩm
 */
export function useRejectStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await adminStoryService.reject(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã từ chối tác phẩm "${data.title}" thành công!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Từ chối tác phẩm thất bại");
    },
  });
}

/**
 * Mutation Gỡ duyệt tác phẩm (chuyển về DRAFT)
 */
export function useUnpublishStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await adminStoryService.unpublish(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã gỡ duyệt tác phẩm "${data.title}" (chuyển về bản nháp)!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Gỡ duyệt tác phẩm thất bại");
    },
  });
}

/**
 * Mutation Cấm / Ẩn tác phẩm khỏi chế độ công khai
 */
export function useHideStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await adminStoryService.hide(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã ẩn tác phẩm "${data.title}" khỏi chế độ công khai!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Ẩn tác phẩm thất bại");
    },
  });
}

/**
 * Mutation Mở lại hiển thị công khai cho tác phẩm
 */
export function useUnhideStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await adminStoryService.unhide(id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Đã khôi phục hiển thị công khai tác phẩm "${data.title}"!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Khôi phục hiển thị thất bại");
    },
  });
}
