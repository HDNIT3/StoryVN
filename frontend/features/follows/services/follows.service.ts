import api from "@/lib/api";
import type {
  FollowTargetType,
  FollowedUpdatesSummary,
  PaginatedFollowedAuthors,
  PaginatedFollowedStories,
  PaginatedFollowedStoryUpdates,
  QueryFollowedAuthorsParams,
  QueryFollowedStoriesParams,
  QueryFollowedUpdatesParams,
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

  /**
   * Lấy danh sách cập nhật chương mới của các truyện đang theo dõi
   */
  getFollowedUpdates(
    params?: QueryFollowedUpdatesParams
  ): Promise<ApiResponse<PaginatedFollowedStoryUpdates>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.onlyUnread !== undefined) {
      searchParams.append("onlyUnread", String(params.onlyUnread));
    }

    const qs = searchParams.toString();
    const endpoint = qs ? `/follows/updates?${qs}` : "/follows/updates";

    return api.get<ApiResponse<PaginatedFollowedStoryUpdates>>(endpoint);
  },

  /**
   * Lấy số lượng truyện / chương mới chưa đọc hoặc chưa xem trong tủ truyện
   */
  getFollowedUpdatesUnreadCount(): Promise<ApiResponse<FollowedUpdatesSummary>> {
    return api.get<ApiResponse<FollowedUpdatesSummary>>(
      "/follows/updates/unread-count"
    );
  },

  /**
   * Đánh dấu đã xem chương mới cho 1 truyện hoặc toàn bộ tủ truyện
   */
  markFollowedUpdatesRead(
    storyId?: string
  ): Promise<ApiResponse<{ updatedCount: number; seenAt: string }>> {
    return api.patch<ApiResponse<{ updatedCount: number; seenAt: string }>>(
      "/follows/updates/read",
      storyId ? { storyId } : {}
    );
  },
};

export default followsService;
