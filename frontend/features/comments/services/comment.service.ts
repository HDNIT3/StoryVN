import api, { type ApiResponse } from "@/lib/api";
import type {
  CommentItem,
  CreateCommentInput,
  PaginatedCommentsResponse,
  QueryCommentsParams,
  QueryRepliesParams,
  UpdateCommentInput,
} from "../types";

export const commentService = {
  /**
   * Đăng bình luận mới
   */
  async createComment(
    payload: CreateCommentInput
  ): Promise<ApiResponse<CommentItem>> {
    return api.post<ApiResponse<CommentItem>>("/comments", payload);
  },

  /**
   * Lấy danh sách bình luận gốc của truyện hoặc chương
   */
  async getStoryComments(
    storyId: string,
    params?: QueryCommentsParams
  ): Promise<ApiResponse<PaginatedCommentsResponse>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.chapterId) searchParams.append("chapterId", params.chapterId);
    if (params?.onlyStoryLevel !== undefined) {
      searchParams.append("onlyStoryLevel", params.onlyStoryLevel.toString());
    }
    if (params?.sort) searchParams.append("sort", params.sort);

    const qs = searchParams.toString();
    const endpoint = qs
      ? `/stories/${storyId}/comments?${qs}`
      : `/stories/${storyId}/comments`;

    return api.get<ApiResponse<PaginatedCommentsResponse>>(endpoint);
  },

  /**
   * Lấy danh sách các câu trả lời con của một bình luận
   */
  async getCommentReplies(
    parentId: string,
    params?: QueryRepliesParams
  ): Promise<ApiResponse<PaginatedCommentsResponse>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const qs = searchParams.toString();
    const endpoint = qs
      ? `/comments/${parentId}/replies?${qs}`
      : `/comments/${parentId}/replies`;

    return api.get<ApiResponse<PaginatedCommentsResponse>>(endpoint);
  },

  /**
   * Chỉnh sửa nội dung bình luận
   */
  async updateComment(
    commentId: string,
    payload: UpdateCommentInput
  ): Promise<ApiResponse<CommentItem>> {
    return api.patch<ApiResponse<CommentItem>>(
      `/comments/${commentId}`,
      payload
    );
  },

  /**
   * Xóa bình luận
   */
  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/comments/${commentId}`);
  },

  /**
   * Lấy thông tin chi tiết một bình luận
   */
  async getCommentById(commentId: string): Promise<ApiResponse<CommentItem>> {
    return api.get<ApiResponse<CommentItem>>(`/comments/${commentId}`);
  },

  /**
   * [Admin / Quản lý / Tác giả truyện] Ẩn hoặc cho hiện lại bình luận
   */
  async toggleCommentVisibility(
    commentId: string,
    status: "VISIBLE" | "HIDDEN"
  ): Promise<ApiResponse<CommentItem>> {
    return api.patch<ApiResponse<CommentItem>>(
      `/comments/${commentId}/visibility`,
      { status }
    );
  },
};

