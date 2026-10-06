import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { storyService } from "@/lib/services/story.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type {
  CreateStoryPayload,
  QueryMyStoriesParams,
  StoryAction,
  UpdateStoryPayload,
} from "@/types/story";

/**
 * Hook lấy danh sách tác phẩm của chính tác giả (hỗ trợ phân trang, lọc status, search)
 */
export function useMyStories(params?: QueryMyStoriesParams) {
  return useQuery({
    queryKey: queryKeys.stories.myList(params),
    queryFn: async () => {
      const res = await storyService.getMyStories(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook lấy thông tin chi tiết tác phẩm theo slug hoặc ID của chính tác giả
 */
export function useMyStoryDetail(slugOrId: string) {
  return useQuery({
    queryKey: queryKeys.stories.detail(slugOrId),
    queryFn: async () => {
      const res = await storyService.getMyStories({ limit: 100 });
      const found = res.data?.items?.find(
        (s) => s.slug === slugOrId || s._id === slugOrId || s.id === slugOrId
      );
      if (!found) {
        throw new Error("Không tìm thấy tác phẩm trong danh sách của bạn");
      }
      return found;
    },
    enabled: Boolean(slugOrId),
  });
}

/**
 * Mutation tạo mới tác phẩm (action: DRAFT | SUBMIT)
 */
export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payload,
      action,
    }: {
      payload: CreateStoryPayload;
      action?: StoryAction;
    }) => {
      const res = await storyService.createStory(payload, action);
      return res;
    },
    onSuccess: (_, variables) => {
      const isSubmit = variables.action === "SUBMIT";
      toast.success(
        isSubmit
          ? "Đã tạo và gửi duyệt tác phẩm thành công!"
          : "Đã lưu bản nháp tác phẩm thành công!"
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể tạo tác phẩm");
    },
  });
}

/**
 * Mutation cập nhật tác phẩm của chính tác giả (action: DRAFT | SUBMIT)
 */
export function useUpdateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
      action,
    }: {
      id: string;
      payload: UpdateStoryPayload;
      action?: StoryAction;
    }) => {
      const res = await storyService.updateMyStory(id, payload, action);
      return res;
    },
    onSuccess: (_, variables) => {
      const isSubmit = variables.action === "SUBMIT";
      toast.success(
        isSubmit
          ? "Đã cập nhật và gửi duyệt tác phẩm!"
          : "Đã cập nhật tác phẩm thành công!"
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể cập nhật tác phẩm");
    },
  });
}
