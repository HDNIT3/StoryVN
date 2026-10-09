import api from "../api";
import type {
  PublicAuthorProfile,
  PaginatedAuthorStories,
  QueryAuthorPublicStoriesParams,
  AuthorCommunityStats,
  PaginatedAuthorsList,
  QueryAuthorsParams,
} from "../../types/author";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export const authorService = {
  /**
   * Lấy thống kê cộng đồng tác giả StoryVN (số tác giả, truyện, chương)
   */
  getCommunityStats() {
    return api.get<ApiResponse<AuthorCommunityStats>>("/authors/stats");
  },

  /**
   * Lấy danh sách tác giả (kèm tìm kiếm, lọc theo thể loại, tiến độ, tiểu sử, sắp xếp & phân trang)
   */
  getAuthorsList(params?: QueryAuthorsParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.genreId) searchParams.append("genreId", params.genreId);
    if (params?.progressState)
      searchParams.append("progressState", params.progressState);
    if (params?.hasBio) searchParams.append("hasBio", params.hasBio);

    const qs = searchParams.toString();
    const endpoint = qs ? `/authors?${qs}` : "/authors";

    return api.get<ApiResponse<PaginatedAuthorsList>>(endpoint);
  },

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
