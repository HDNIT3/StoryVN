import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chapterService } from '../../services/chapter.service';
import { queryKeys } from '../../query-keys';
import { toast } from '../../toast';
import type {
  CreateChapterPayload,
  QueryChaptersParams,
  ReorderChaptersPayload,
  UpdateChapterPayload,
} from '../../../types/chapter';

/**
   * Hook lấy danh sách chương của tác phẩm (UC-16)
   */
export function useStoryChapters(params: QueryChaptersParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chapters.byStory(params),
    queryFn: async () => {
      const res = await chapterService.getChapters(params);
      return res.data;
    },
    enabled: Boolean(params.storyId) && enabled,
  });
}

/**
 * Hook lấy chi tiết một chương (UC-16)
 */
export function useChapterDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chapters.detail(id),
    queryFn: async () => {
      const res = await chapterService.getChapterDetail(id);
      return res.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

/**
 * Hook lấy lịch sử các bản sửa đổi của chương (UC-15 & UC-16)
 */
export function useChapterHistory(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chapters.history(id),
    queryFn: async () => {
      const res = await chapterService.getChapterHistory(id);
      return res.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

/**
 * Hook lấy toàn bộ danh sách lịch sử sửa đổi chương (UC-15 & UC-16)
 */
export function useAllChapterHistory(
  params?: {
    storyId?: string;
    chapterId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
  enabled = true
) {
  return useQuery({
    queryKey: ['chapters', 'allHistory', params],
    queryFn: async () => {
      const res = await chapterService.getAllChapterHistory(params);
      return res.data;
    },
    enabled,
  });
}

/**
 * Hook lấy thống kê các chương của tác phẩm (UC-16)
 */
export function useStoryChaptersStats(storyId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chapters.stats(storyId),
    queryFn: async () => {
      const res = await chapterService.getStoryChaptersStats(storyId);
      return res.data;
    },
    enabled: Boolean(storyId) && enabled,
  });
}

/**
 * Hook tạo chương mới (UC-14 & UC-15)
 */
export function useCreateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateChapterPayload) => {
      const res = await chapterService.createChapter(payload);
      return res;
    },
    onSuccess: (res) => {
      toast.success(
        res.message || 'Tạo chương thành công!'
      );
      // Invalidate chapter list and story list
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Tạo chương thất bại!';
      toast.error(msg);
    },
  });
}

/**
 * Hook chỉnh sửa chương (UC-15 & UC-16)
 */
export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateChapterPayload;
    }) => {
      const res = await chapterService.updateChapter(id, payload);
      return res;
    },
    onSuccess: (res, variables) => {
      toast.success(
        res.message || 'Cập nhật chương thành công!'
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chapters.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Cập nhật chương thất bại!';
      toast.error(msg);
    },
  });
}

/**
 * Hook xóa chương (UC-16)
 */
export function useDeleteChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await chapterService.deleteChapter(id);
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Xóa chương thành công!');
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Xóa chương thất bại!';
      toast.error(msg);
    },
  });
}

/**
 * Hook sắp xếp lại thứ tự chương (UC-16)
 */
export function useReorderChapters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storyId,
      payload,
    }: {
      storyId: string;
      payload: ReorderChaptersPayload;
    }) => {
      const res = await chapterService.reorderChapters(storyId, payload);
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Cập nhật thứ tự chương thành công!');
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Sắp xếp thứ tự chương thất bại!';
      toast.error(msg);
    },
  });
}

/**
 * Hook gửi duyệt hàng loạt các chương truyện
 */
export function useBulkSubmitChapters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapterIds: string[]) => {
      const res = await chapterService.bulkSubmitChapters(chapterIds);
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Gửi phê duyệt hàng loạt thành công!');
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Gửi phê duyệt hàng loạt thất bại!';
      toast.error(msg);
    },
  });
}
