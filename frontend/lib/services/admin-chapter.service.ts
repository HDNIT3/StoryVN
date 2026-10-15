import api from '../api';
import type { ApiResponse } from './chapter.service';
import type {
  AdminChapterCounts,
  AdminChapterItem,
  PaginatedAdminChapters,
  QueryAdminChaptersParams,
} from '../../types/chapter';

export const adminChapterService = {
  /**
   * Lấy danh sách chương cho Quản lý & Admin (hỗ trợ phân trang, lọc theo truyện, trạng thái, tìm kiếm, sắp xếp)
   */
  async findAll(
    params?: QueryAdminChaptersParams,
  ): Promise<ApiResponse<PaginatedAdminChapters>> {
    const searchParams = new URLSearchParams();
    if (params?.storyId) searchParams.append('storyId', params.storyId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/chapters?${queryString}` : '/admin/chapters';
    return api.get<ApiResponse<PaginatedAdminChapters>>(endpoint);
  },

  /**
   * Lấy danh sách chương chờ duyệt
   */
  async findPending(
    params?: Omit<QueryAdminChaptersParams, 'status'>,
  ): Promise<ApiResponse<PaginatedAdminChapters>> {
    const searchParams = new URLSearchParams();
    if (params?.storyId) searchParams.append('storyId', params.storyId);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/admin/chapters/pending?${queryString}`
      : '/admin/chapters/pending';
    return api.get<ApiResponse<PaginatedAdminChapters>>(endpoint);
  },

  /**
   * Lấy số lượng thống kê chương theo từng tab (Tất cả, Chờ duyệt, Đã duyệt, Từ chối, Bản nháp)
   */
  async getCounts(storyId?: string): Promise<ApiResponse<AdminChapterCounts>> {
    const qs = storyId ? `?storyId=${storyId}` : '';
    return api.get<ApiResponse<AdminChapterCounts>>(`/admin/chapters/counts${qs}`);
  },

  /**
   * Xem chi tiết chương truyện (kèm toàn bộ nội dung, tác phẩm và tác giả)
   */
  async findById(id: string): Promise<ApiResponse<AdminChapterItem>> {
    return api.get<ApiResponse<AdminChapterItem>>(`/admin/chapters/${id}`);
  },

  /**
   * Phê duyệt chương truyện (chuyển sang PUBLISHED và gửi thông báo)
   */
  async approve(id: string): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/approve`,
      {},
    );
  },

  /**
   * Hủy duyệt / Từ chối duyệt chương truyện kèm lý do
   */
  async reject(
    id: string,
    reason: string,
  ): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/reject`,
      { reason },
    );
  },

  /**
   * Gỡ duyệt chương truyện (chuyển từ PUBLISHED về DRAFT)
   */
  async unpublish(
    id: string,
    reason?: string,
  ): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/unpublish`,
      { reason: reason?.trim() || undefined },
    );
  },

  /**
   * Ẩn chương truyện khỏi công khai (chuyển sang HIDDEN)
   */
  async hide(
    id: string,
    reason?: string,
  ): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/hide`,
      { reason: reason?.trim() || undefined },
    );
  },

  /**
   * Mở lại chương truyện bị ẩn (chuyển sang PUBLISHED)
   */
  async unhide(id: string): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/unhide`,
      {},
    );
  },

  /**
   * Chuyển chương truyện (bị từ chối) quay lại hàng đợi chờ duyệt (PENDING_REVIEW)
   */
  async resetPending(id: string): Promise<ApiResponse<AdminChapterItem>> {
    return api.patch<ApiResponse<AdminChapterItem>>(
      `/admin/chapters/${id}/reset-pending`,
      {},
    );
  },
};
