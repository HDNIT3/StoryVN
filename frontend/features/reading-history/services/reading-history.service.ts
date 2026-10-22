import api from "@/lib/api";
import type {
  PaginatedReadingHistory,
  QueryReadingHistoryParams,
  ReadingHistoryStoryDetail,
  RecordReadingHistoryResult,
} from "../types";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const readingHistoryService = {
  /**
   * Ghi nhận một lần đọc chương (gọi khi người dùng mở chương).
   */
  async recordReading(
    chapterId: string
  ): Promise<ApiResponse<RecordReadingHistoryResult>> {
    return api.post<ApiResponse<RecordReadingHistoryResult>>("/reading-history", {
      chapterId,
    });
  },

  /**
   * Lấy danh sách lịch sử đọc gom theo truyện (mỗi truyện 1 dòng, mới đọc nhất trước)
   */
  async getMyHistory(
    params?: QueryReadingHistoryParams
  ): Promise<ApiResponse<PaginatedReadingHistory>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.genre) searchParams.append("genre", params.genre);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.minChapterNumber)
      searchParams.append("minChapterNumber", params.minChapterNumber.toString());
    if (params?.from) searchParams.append("from", params.from);
    if (params?.to) searchParams.append("to", params.to);
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/reading-history?${queryString}`
      : "/reading-history";

    return api.get<ApiResponse<PaginatedReadingHistory>>(endpoint);
  },

  /**
   * Lấy chi tiết lịch sử đọc của 1 truyện (mỗi chương 1 dòng, đã gộp trùng).
   */
  async getMyStoryHistory(
    storyId: string
  ): Promise<ApiResponse<ReadingHistoryStoryDetail | null>> {
    return api.get<ApiResponse<ReadingHistoryStoryDetail | null>>(
      `/reading-history/${storyId}`
    );
  },
};

export default readingHistoryService;
