import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { readingHistoryService } from "../../services/reading-history.service";
import { queryKeys } from "../../query-keys";
import type { QueryReadingHistoryParams } from "../../../types/reading-history";

/**
 * Hook lấy danh sách lịch sử đọc gom theo truyện (mỗi truyện 1 dòng, mới đọc nhất trước)
 */
export function useMyReadingHistory(
  params: QueryReadingHistoryParams,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.readingHistory.list(params),
    queryFn: async () => {
      const res = await readingHistoryService.getMyHistory(params);
      return res.data;
    },
    enabled,
    // Giữ dữ liệu trang cũ khi đổi bộ lọc/trang để danh sách không nhấp nháy
    placeholderData: keepPreviousData,
    // Lịch sử đọc thay đổi liên tục nên luôn coi là cũ để lấy bản mới khi vào trang
    staleTime: 0,
  });
}

/**
 * Hook lấy chi tiết lịch sử đọc của 1 truyện (chỉ gọi khi người dùng mở rộng)
 */
export function useMyStoryReadingHistory(storyId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.readingHistory.story(storyId),
    queryFn: async () => {
      const res = await readingHistoryService.getMyStoryHistory(storyId);
      return res.data;
    },
    enabled: Boolean(storyId) && enabled,
  });
}

/**
 * Hook ghi nhận một lần đọc chương (gọi khi mở chương).
 * Chạy nền nên không hiện toast lỗi để không làm gián đoạn việc đọc.
 */
export function useRecordReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapterId: string) => {
      const res = await readingHistoryService.recordReading(chapterId);
      return res.data;
    },
    onSuccess: (data) => {
      // Bị bỏ qua do trùng trong 5 phút thì không cần làm mới danh sách
      if (!data?.recorded) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.readingHistory.all });
    },
  });
}
