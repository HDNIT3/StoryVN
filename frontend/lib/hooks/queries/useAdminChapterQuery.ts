import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { adminChapterService } from "@/lib/services/admin-chapter.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type { QueryAdminChaptersParams } from "@/types/chapter";

/**
 * Hook lấy danh sách tất cả chương dành cho Admin với phân trang, bộ lọc & tìm kiếm
 */
export function useAdminChapters(params: QueryAdminChaptersParams) {
  return useQuery({
    queryKey: queryKeys.admin.chapters(params),
    queryFn: async () => {
      const res = await adminChapterService.findAll(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook lấy danh sách chương chờ duyệt
 */
export function useAdminPendingChapters(params?: Omit<QueryAdminChaptersParams, "status">) {
  return useQuery({
    queryKey: queryKeys.admin.chapters({ ...params, status: "PENDING_REVIEW" }),
    queryFn: async () => {
      const res = await adminChapterService.findPending(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook lấy thống kê số lượng chương theo từng tab (Badge đếm)
 */
export function useAdminChapterCounts(storyId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.chapterCounts(storyId),
    queryFn: async () => {
      const res = await adminChapterService.getCounts(storyId);
      return res.data;
    },
    refetchInterval: 1000 * 30, // Cập nhật tự động mỗi 30s
  });
}

/**
 * Hook lấy chi tiết chương truyện theo ID (kèm toàn bộ nội dung text, tác phẩm, tác giả)
 */
export function useAdminChapterDetail(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.admin.chapterDetail(id) : ["admin", "chapters", "detail", "empty"],
    queryFn: async () => {
      if (!id) return null;
      const res = await adminChapterService.findById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

/**
 * Mutation Phê duyệt chương truyện
 */
export function useApproveChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await adminChapterService.approve(id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã phê duyệt Chương ${data.chapterNumber}${data.title ? `: "${data.title}"` : ""} thành công!`
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Phê duyệt chương thất bại");
    },
  });
}

/**
 * Mutation Từ chối duyệt chương truyện kèm lý do
 */
export function useRejectChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await adminChapterService.reject(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã từ chối Chương ${data.chapterNumber}${data.title ? `: "${data.title}"` : ""}!`
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Từ chối chương thất bại");
    },
  });
}

/**
 * Mutation Gỡ duyệt chương truyện (chuyển về DRAFT)
 */
export function useUnpublishChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await adminChapterService.unpublish(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã gỡ duyệt Chương ${data.chapterNumber} (chuyển về bản nháp)!`
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Gỡ duyệt chương thất bại");
    },
  });
}

/**
 * Mutation Ẩn chương truyện khỏi công khai (chuyển sang HIDDEN)
 */
export function useHideChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await adminChapterService.hide(id, reason);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã ẩn Chương ${data.chapterNumber}${data.title ? `: "${data.title}"` : ""} khỏi công khai!`
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Ẩn chương thất bại");
    },
  });
}

/**
 * Mutation Mở lại chương truyện bị ẩn (chuyển sang PUBLISHED)
 */
export function useUnhideChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await adminChapterService.unhide(id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Đã mở lại Chương ${data.chapterNumber}${data.title ? `: "${data.title}"` : ""} hiển thị công khai!`
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Mở lại chương thất bại");
    },
  });
}
