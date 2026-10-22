import api from "@/lib/api";
import type { ApiResponse } from "@/features/chapters";
import type {
  AdminChapterCounts,
  AdminChapterItem,
  PaginatedAdminChapters,
  QueryAdminChaptersParams,
} from "@/features/chapters";

export const adminChapterService = {
  /**
   * Lấy danh sách chương cho Quản lý & Admin
   */
  async findAll(
    params?: QueryAdminChaptersParams
  ): Promise<ApiResponse<PaginatedAdminChapters>> {
    const searchParams = new URLSearchParams();
    if (params?.storyId) searchParams.append("storyId", params.storyId);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/chapters?${queryString}` : "/admin/chapters";
    return api.get<ApiResponse<PaginatedAdminChapters>>(endpoint);
  },

  /**
   * Lấy danh sách chương chờ duyệt
   */
  async findPending(
    params?: Omit<QueryAdminChaptersParams, "status">
  ): Promise<ApiResponse<PaginatedAdminChapters>> {
    const searchParams = new URLSearchParams();
    if (params?.storyId) searchParams.append("storyId", params.storyId);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/admin/chapters/pending?${queryString}`
      : "/admin/chapters/pending";
    return api.get<ApiResponse<PaginatedAdminChapters>>(endpoint);
  },

  /**
   * Lấy số lượng thống kê chương theo từng tab
   */
  async getCounts(storyId?: string): Promise<ApiResponse<AdminChapterCounts>> {
    const qs = storyId ? `?storyId=${storyId}` : "";
    return api.get<ApiResponse<AdminChapterCounts>>(`/admin/chapters/counts${qs}`);
  },

  /**
   * Xem chi tiết chương truyện
   */
  async findById(id: string): Promise<ApiResponse<AdminChapterItem>> {
    return api.get<ApiResponse<AdminChapterItem>>(`/admin/chapters/${id}`);
  },

  /**
   * Phê duyệt chương truyện
   */
  async approve(id: string): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/approve`,
      {}
    );
  },

  /**
   * Hủy duyệt / Từ chối duyệt chương truyện kèm lý do
   */
  async reject(
    id: string,
    reason: string
  ): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/reject`,
      { reason }
    );
  },

  /**
   * Gỡ duyệt chương truyện
   */
  async unpublish(
    id: string,
    reason?: string
  ): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/unpublish`,
      { reason: reason?.trim() || undefined }
    );
  },

  /**
   * Ẩn chương truyện khỏi công khai
   */
  async hide(
    id: string,
    reason?: string
  ): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/hide`,
      { reason: reason?.trim() || undefined }
    );
  },

  /**
   * Mở lại chương truyện bị ẩn
   */
  async unhide(id: string): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/unhide`,
      {}
    );
  },

  /**
   * Chuyển chương truyện (bị từ chối) quay lại hàng đợi chờ duyệt
   */
  async resetPending(id: string): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/reset-pending`,
      {}
    );
  },
};

export default adminChapterService;

