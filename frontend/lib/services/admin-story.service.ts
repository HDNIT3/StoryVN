import api from "../api";
import type {
  AdminStoryItem,
  AdminStoryStatsData,
  AppealStoryPayload,
  PaginatedAdminStories,
  QueryAdminStoriesParams,
  ReviewStoryPayload,
  StoryApiResponse,
} from "../../types/story";

export const adminStoryService = {
  /**
   * Lấy danh sách tác phẩm cho Admin / Manager kiểm duyệt (phân trang, lọc trạng thái, tìm kiếm)
   */
  async findAll(
    params?: QueryAdminStoriesParams
  ): Promise<StoryApiResponse<PaginatedAdminStories>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.status) {
      searchParams.append("status", params.status);
    }
    if (params?.search?.trim()) searchParams.append("search", params.search.trim());
    if (params?.hasAppeal !== undefined) {
      searchParams.append("hasAppeal", params.hasAppeal.toString());
    }
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/admin/stories?${queryString}`
      : "/admin/stories";

    return api.get<StoryApiResponse<PaginatedAdminStories>>(endpoint);
  },

  /**
   * Lấy thống kê số lượng tác phẩm theo trạng thái kiểm duyệt
   */
  async getStats(): Promise<StoryApiResponse<AdminStoryStatsData>> {
    return api.get<StoryApiResponse<AdminStoryStatsData>>("/admin/stories/stats");
  },

  /**
   * Lấy chi tiết tác phẩm theo ID để thẩm định nội dung, văn án, bìa
   */
  async findById(id: string): Promise<StoryApiResponse<AdminStoryItem>> {
    return api.get<StoryApiResponse<AdminStoryItem>>(`/admin/stories/${id}`);
  },

  /**
   * Phê duyệt hoặc từ chối tác phẩm kèm lý do
   */
  async review(
    id: string,
    payload: ReviewStoryPayload
  ): Promise<StoryApiResponse<AdminStoryItem>> {
    return api.patch<StoryApiResponse<AdminStoryItem>>(
      `/admin/stories/${id}/review`,
      payload
    );
  },

  /**
   * Tác giả gửi phản hồi / giải trình khi tác phẩm bị từ chối duyệt
   */
  async appeal(
    id: string,
    payload: AppealStoryPayload
  ): Promise<StoryApiResponse<AdminStoryItem>> {
    return api.post<StoryApiResponse<AdminStoryItem>>(
      `/stories/my/${id}/appeal`,
      payload
    );
  },
};

export default adminStoryService;
