import api from "@/lib/api";
import type {
  FollowTargetType,
  PaginatedFollowedStories,
  PaginatedFollowedAuthors,
  QueryFollowedStoriesParams,
  QueryFollowedAuthorsParams,
  ToggleFollowPayload,
  ToggleFollowResult,
} from "../types";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

export const followsService = {
  /**
   * Toggle theo dõi / bỏ theo dõi
   */
  toggleFollow(
    payload: ToggleFollowPayload
  ): Promise<ApiResponse<ToggleFollowResult>> {
    return api.post<ApiResponse<ToggleFollowResult>>(
      "/follows/toggle",
      payload
    );
  },

  /**
   * Theo dõi truyện hoặc tác giả (idempotent)
   */
  follow(
    payload: ToggleFollowPayload
  ): Promise<ApiResponse<ToggleFollowResult>> {
    return api.post<ApiResponse<ToggleFollowResult>>(
      "/follows",
      payload
    );
  },

  /**
   * Bỏ theo dõi truyện hoặc tác giả (idempotent)
   */
  unfollow(
    targetType: FollowTargetType,
    targetId: string
  ): Promise<ApiResponse<ToggleFollowResult>> {
    return api.delete<ApiResponse<ToggleFollowResult>>(
      `/follows/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`
    );
  },

  /**
   * Kiểm tra trạng thái follow của một đối tượng cụ thể
   */
  checkStatus(
    targetType: FollowTargetType,
    targetId: string
  ): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return api.get<ApiResponse<{ isFollowing: boolean }>>(
      `/follows/status?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`
    );
  },

  /**
   * Kiểm tra trạng thái follow hàng loạt
   */
  checkBatchStatus(
    targetType: FollowTargetType,
    targetIds: string[]
  ): Promise<ApiResponse<Record<string, boolean>>> {
    return api.post<ApiResponse<Record<string, boolean>>>(
      "/follows/status/batch",
      { targetType, targetIds }
    );
  },

  /**
   * Lấy danh sách truyện đang theo dõi
   */
  getFollowedStories(
    params?: QueryFollowedStoriesParams
  ): Promise<ApiResponse<PaginatedFollowedStories>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);

    const qs = searchParams.toString();
    const endpoint = qs ? `/follows/stories?${qs}` : "/follows/stories";

    return api.get<ApiResponse<PaginatedFollowedStories>>(endpoint);
  },

  /**
   * Lấy danh sách tác giả đang theo dõi
   */
  getFollowedAuthors(
    params?: QueryFollowedAuthorsParams
  ): Promise<ApiResponse<PaginatedFollowedAuthors>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);

    const qs = searchParams.toString();
    const endpoint = qs ? `/follows/authors?${qs}` : "/follows/authors";

    return api.get<ApiResponse<PaginatedFollowedAuthors>>(endpoint);
  },
};

export default followsService;
