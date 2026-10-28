import api, { type ApiResponse } from "@/lib/api";
import type {
  CreateRatingInput,
  PaginatedRatingsResponse,
  QueryRatingsParams,
  RatingSummaryData,
  StoryRatingItem,
} from "../types";

export const ratingService = {
  /**
   * Đánh giá hoặc cập nhật đánh giá truyện
   */
  async rateStory(
    storyId: string,
    payload: CreateRatingInput
  ): Promise<ApiResponse<StoryRatingItem>> {
    return api.post<ApiResponse<StoryRatingItem>>(
      `/stories/${storyId}/ratings`,
      payload
    );
  },

  /**
   * Lấy danh sách đánh giá của truyện
   */
  async getStoryRatings(
    storyId: string,
    params?: QueryRatingsParams
  ): Promise<ApiResponse<PaginatedRatingsResponse>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.rating) searchParams.append("rating", params.rating.toString());
    if (params?.sort) searchParams.append("sort", params.sort);

    const qs = searchParams.toString();
    const endpoint = qs
      ? `/stories/${storyId}/ratings?${qs}`
      : `/stories/${storyId}/ratings`;

    return api.get<ApiResponse<PaginatedRatingsResponse>>(endpoint);
  },

  /**
   * Lấy tóm tắt phân bổ sao của truyện
   */
  async getRatingSummary(
    storyId: string
  ): Promise<ApiResponse<RatingSummaryData>> {
    return api.get<ApiResponse<RatingSummaryData>>(
      `/stories/${storyId}/ratings/summary`
    );
  },

  /**
   * Lấy đánh giá của người dùng hiện tại
   */
  async getMyRating(
    storyId: string
  ): Promise<ApiResponse<StoryRatingItem | null>> {
    return api.get<ApiResponse<StoryRatingItem | null>>(
      `/stories/${storyId}/ratings/me`
    );
  },

  /**
   * Xóa đánh giá của chính mình
   */
  async deleteMyRating(storyId: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/stories/${storyId}/ratings/me`);
  },

  /**
   * [Admin/Manager] Cập nhật trạng thái hiển thị đánh giá
   */
  async adminUpdateStatus(
    ratingId: string,
    status: string
  ): Promise<ApiResponse<StoryRatingItem>> {
    return api.patch<ApiResponse<StoryRatingItem>>(
      `/admin/ratings/${ratingId}/status`,
      { status }
    );
  },
};

