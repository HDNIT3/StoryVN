import api from "../api";
import type {
  PublicAuthorProfile,
  PaginatedAuthorStories,
  QueryAuthorPublicStoriesParams,
} from "../../types/author";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export const authorService = {
  /**
   * Lấy thông tin hồ sơ công khai của tác giả theo username
   */
  getPublicProfile(username: string) {
    return api.get<ApiResponse<{ author: PublicAuthorProfile }>>(
      `/authors/${encodeURIComponent(username)}`
    );
  },

  /**
   * Lấy danh sách tác phẩm công khai của tác giả (lọc tiến độ, sắp xếp, phân trang)
   */
  getPublicStories(username: string, params?: QueryAuthorPublicStoriesParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.progressState)
      searchParams.append("progressState", params.progressState);
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);

    const qs = searchParams.toString();
    const endpoint = qs
      ? `/authors/${encodeURIComponent(username)}/stories?${qs}`
      : `/authors/${encodeURIComponent(username)}/stories`;

    return api.get<ApiResponse<PaginatedAuthorStories>>(endpoint);
  },
};

export default authorService;
