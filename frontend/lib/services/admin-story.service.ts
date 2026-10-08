import api from "../api";
import type {
  AdminStoryCounts,
  AdminStoryItem,
  PaginatedAdminStories,
  QueryAdminStoriesParams,
  StoryApiResponse,
} from "../../types/story";

export const adminStoryService = {
  /**
   * Lấy danh sách tác phẩm cho Admin (phân trang, lọc status, visibility, search, genreId, sắp xếp)
   */
  async findAll(
    params?: QueryAdminStoriesParams
  ): Promise<StoryApiResponse<PaginatedAdminStories>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.visibility) searchParams.append("visibility", params.visibility);
    if (params?.genreId) searchParams.append("genreId", params.genreId);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/stories?${queryString}` : "/admin/stories";
    return api.get<StoryApiResponse<PaginatedAdminStories>>(endpoint);
  },

  /**
   * Lấy thống kê số lượng truyện theo từng tab (all, pending, published, rejected, draft, hidden)
   */
  async getCounts(): Promise<StoryApiResponse<AdminStoryCounts>> {
    return api.get<StoryApiResponse<AdminStoryCounts>>("/admin/stories/counts");
  },

  /**
   * Xem chi tiết tác phẩm theo ID (kèm thông tin tác giả, author profile, thể loại, tag, lý do từ chối nếu có)
   */
  async findById(id: string): Promise<StoryApiResponse<AdminStoryItem>> {
    return api.get<StoryApiResponse<AdminStoryItem>>(`/admin/stories/${id}`);
  },

  /**
   * Phê duyệt tác phẩm (chuyển sang PUBLISHED và gửi thông báo)
   */
  async approve(id: string): Promise<StoryApiResponse<AdminStoryItem>> {
    return api.patch<StoryApiResponse<AdminStoryItem>>(
      `/admin/stories/${id}/approve`,
      {}
    );
  },

  /**
   * Từ chối duyệt tác phẩm kèm lý do (chuyển sang REJECTED và gửi thông báo)
   */
  async reject(
    id: string,
    reason: string
  ): Promise<StoryApiResponse<AdminStoryItem>> {
    return api.patch<StoryApiResponse<AdminStoryItem>>(
      `/admin/stories/${id}/reject`,
      { reason }
    );
  },

  /**
   * Gỡ duyệt tác phẩm (chuyển PUBLISHED về DRAFT và gửi thông báo)
   */
  async unpublish(
    id: string,
    reason?: string
  ): Promise<StoryApiResponse<AdminStoryItem>> {
    return api.patch<StoryApiResponse<AdminStoryItem>>(
      `/admin/stories/${id}/unpublish`,
      { reason: reason?.trim() || undefined }
    );
  },

  /**
   * Cấm / Ẩn tác phẩm khỏi chế độ công khai (chuyển visibility sang PRIVATE và gửi thông báo)
   */
  async hide(
    id: string,
    reason?: string
  ): Promise<StoryApiResponse<AdminStoryItem>> {
    return api.patch<StoryApiResponse<AdminStoryItem>>(
      `/admin/stories/${id}/hide`,
      { reason: reason?.trim() || undefined }
    );
  },

  /**
   * Mở lại hiển thị công khai cho tác phẩm (chuyển visibility sang PUBLIC và gửi thông báo)
   */
  async unhide(id: string): Promise<StoryApiResponse<AdminStoryItem>> {
    return api.patch<StoryApiResponse<AdminStoryItem>>(
      `/admin/stories/${id}/unhide`,
      {}
    );
  },
};

export default adminStoryService;
