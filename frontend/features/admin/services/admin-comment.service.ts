import api, { type ApiResponse } from "@/lib/api";
import type {
  AdminCommentCounts,
  AdminCommentItem,
  AdminCommentStatus,
  AdminCommentsListResponse,
  QueryAdminCommentsParams,
} from "../types/comment.types";

export const adminCommentService = {
  /**
   * Lấy danh sách bình luận (phân trang, lọc, tìm kiếm)
   */
  async getComments(
    params?: QueryAdminCommentsParams
  ): Promise<ApiResponse<AdminCommentsListResponse>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.status && params.status !== "ALL") {
      searchParams.append("status", params.status);
    }
    if (params?.search) searchParams.append("search", params.search.trim());
    if (params?.storyId) searchParams.append("storyId", params.storyId);
    if (params?.sort) searchParams.append("sort", params.sort);

    const qs = searchParams.toString();
    const endpoint = qs ? `/admin/comments?${qs}` : "/admin/comments";
    return api.get<ApiResponse<AdminCommentsListResponse>>(endpoint);
  },

  /**
   * Thống kê số lượng bình luận theo trạng thái
   */
  async getCounts(): Promise<ApiResponse<AdminCommentCounts>> {
    return api.get<ApiResponse<AdminCommentCounts>>("/admin/comments/counts");
  },

  /**
   * Cập nhật trạng thái bình luận (VISIBLE, HIDDEN, DELETED)
   */
  async updateStatus(
    commentId: string,
    status: AdminCommentStatus
  ): Promise<ApiResponse<AdminCommentItem>> {
    return api.patch<ApiResponse<AdminCommentItem>>(
      `/admin/comments/${commentId}/status`,
      { status }
    );
  },

  /**
   * Xóa vĩnh viễn bình luận
   */
  async deletePermanent(commentId: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/admin/comments/${commentId}/permanent`);
  },
};

