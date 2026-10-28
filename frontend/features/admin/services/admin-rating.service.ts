import api, { type ApiResponse } from "@/lib/api";
import type {
  AdminRatingCounts,
  AdminRatingItem,
  AdminRatingStatus,
  AdminRatingsListResponse,
  QueryAdminRatingsParams,
} from "../types/rating.types";

export const adminRatingService = {
  /**
   * Lấy danh sách đánh giá (phân trang, lọc, tìm kiếm)
   */
  async getRatings(
    params?: QueryAdminRatingsParams
  ): Promise<ApiResponse<AdminRatingsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.status && params.status !== "ALL") {
      searchParams.append("status", params.status);
    }
    if (params?.rating) searchParams.append("rating", params.rating.toString());
    if (params?.search) searchParams.append("search", params.search.trim());
    if (params?.storyId) searchParams.append("storyId", params.storyId);
    if (params?.sort) searchParams.append("sort", params.sort);

    const qs = searchParams.toString();
    const endpoint = qs ? `/admin/ratings?${qs}` : "/admin/ratings";
    return api.get<ApiResponse<AdminRatingsListResponse>>(endpoint);
  },

  /**
   * Thống kê số lượng đánh giá theo trạng thái và điểm TB
   */
  async getCounts(): Promise<ApiResponse<AdminRatingCounts>> {
    return api.get<ApiResponse<AdminRatingCounts>>("/admin/ratings/counts");
  },

  /**
   * Cập nhật trạng thái đánh giá (VISIBLE, HIDDEN, DELETED)
   */
  async updateStatus(
    ratingId: string,
    status: AdminRatingStatus
  ): Promise<ApiResponse<AdminRatingItem>> {
    return api.patch<ApiResponse<AdminRatingItem>>(
      `/admin/ratings/${ratingId}/status`,
      { status }
    );
  },

  /**
   * Xóa vĩnh viễn đánh giá
   */
  async deletePermanent(ratingId: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/admin/ratings/${ratingId}`);
  },
};

