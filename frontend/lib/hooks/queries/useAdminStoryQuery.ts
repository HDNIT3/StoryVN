import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { adminStoryService } from "@/lib/services/admin-story.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type {
  QueryAdminStoriesParams,
  ReviewStoryPayload,
  AppealStoryPayload,
} from "@/types/story";

/**
 * Hook lấy danh sách tác phẩm cho Admin / Manager với phân trang & lọc
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
 * Hook lấy thống kê tác phẩm theo trạng thái duyệt cho dashboard
 */
export function useAdminStoryStats() {
  return useQuery({
    queryKey: queryKeys.admin.storyStats,
    queryFn: async () => {
      const res = await adminStoryService.getStats();
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 phút
  });
}

/**
 * Hook lấy chi tiết tác phẩm theo ID để thẩm định
 */
export function useAdminStoryDetail(id?: string | null) {
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
 * Mutation Duyệt / Từ chối tác phẩm
 */
export function useReviewStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      action,
      rejectReason,
    }: { id: string } & ReviewStoryPayload) => {
      const res = await adminStoryService.review(id, { action, rejectReason });
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "stories"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.storyStats,
      });
      if (variables.action === "APPROVED") {
        toast.success(
          "Tác phẩm đã được phê duyệt và xuất bản công khai.",
          { title: "Phê duyệt thành công" }
        );
      } else {
        toast.success(
          "Lý do từ chối đã được gửi email thông báo cho tác giả.",
          { title: "Đã từ chối tác phẩm" }
        );
      }
    },
    onError: (err: any) => {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Thao tác xét duyệt thất bại, vui lòng thử lại";

      // Bắt ngoại lệ 2.a: Tác phẩm không tồn tại / đã bị gỡ
      if (err?.response?.status === 404 || errorMsg.includes("STORY_NOT_FOUND")) {
        toast.error(
          "Tác phẩm này có thể đã bị tác giả gỡ bỏ hoặc không còn tồn tại.",
          { title: "Tác phẩm không tồn tại" }
        );
        queryClient.invalidateQueries({ queryKey: ["admin", "stories"] });
        return;
      }

      toast.error(errorMsg, { title: "Thao tác thất bại" });
    },
  });
}

/**
 * Mutation Tác giả gửi phản hồi / giải trình khi bị từ chối
 */
export function useAppealStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      feedback,
    }: { id: string } & AppealStoryPayload) => {
      const res = await adminStoryService.appeal(id, { feedback });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stories", "my"],
      });
      toast.success(
        "Lời giải trình của bạn đã được chuyển tới Ban quản trị để xem xét lại.",
        { title: "Gửi phản hồi thành công" }
      );
    },
    onError: (err: any) => {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Gửi phản hồi thất bại, vui lòng thử lại";
      toast.error(errorMsg, { title: "Lỗi khi gửi phản hồi" });
    },
  });
}
