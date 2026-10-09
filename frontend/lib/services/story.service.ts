import api from "../api";
import type {
  CreateStoryPayload,
  FilterStoriesParams,
  PaginatedFilteredStories,
  PaginatedRecentStories,
  PaginatedStories,
  QueryMyStoriesParams,
  QueryRecentStoriesParams,
  StoryAction,
  StoryApiResponse,
  StoryItem,
  TopViewStoryItem,
  UpdateStoryPayload,
} from "../../types/story";

export const storyService = {
  /**
   * Lấy danh sách truyện có bộ lọc (Công khai): thể loại, trạng thái, sắp xếp, tìm kiếm, phân trang
   */
  async getStories(
    params?: FilterStoriesParams
  ): Promise<StoryApiResponse<PaginatedFilteredStories>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.genre) searchParams.append("genre", params.genre);
    if (params?.progressState) searchParams.append("progressState", params.progressState);
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/stories?${queryString}` : "/stories";
    return api.get<StoryApiResponse<PaginatedFilteredStories>>(endpoint);
  },

  /**
   * Lấy top truyện nổi bật có nhiều lượt xem nhất (Công khai)
   * Phục vụ cột 'Truyện nổi bật'
   */
  async getTopViews(limit = 10): Promise<StoryApiResponse<TopViewStoryItem[]>> {
    return api.get<StoryApiResponse<TopViewStoryItem[]>>(`/stories/top-views?limit=${limit}`);
  },

  /**
   * Lấy danh sách truyện mới cập nhật (Công khai)
   * Yêu cầu: Thể loại, Tên, Số chương, Tác giả, Ngày giờ cập nhật
   */
  async getLatestUpdated(
    params?: QueryRecentStoriesParams
  ): Promise<StoryApiResponse<PaginatedRecentStories>> {
    const searchParams = new URLSearchParams();
    if (params?.genreId) searchParams.append("genreId", params.genreId);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/stories/latest-updated?${queryString}`
      : "/stories/latest-updated";
    return api.get<StoryApiResponse<PaginatedRecentStories>>(endpoint);
  },

  /**
   * Tạo tác phẩm mới (quyền Author)
   * action: DRAFT (lưu nháp) hoặc SUBMIT (gửi duyệt ngay)
   */
  async createStory(
    payload: CreateStoryPayload,
    action?: StoryAction
  ): Promise<StoryApiResponse<StoryItem>> {
    const act = action || payload.action;
    const query = act ? `?action=${act}` : "";
    return api.post<StoryApiResponse<StoryItem>>(`/stories${query}`, payload);
  },

  /**
   * Lấy danh sách tác phẩm của chính tác giả (quyền Author)
   */
  async getMyStories(
    params?: QueryMyStoriesParams
  ): Promise<StoryApiResponse<PaginatedStories>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/stories/my?${queryString}` : "/stories/my";
    return api.get<StoryApiResponse<PaginatedStories>>(endpoint);
  },

  /**
   * Chỉnh sửa tác phẩm của chính tác giả theo slug hoặc id (quyền Author)
   */
  async updateMyStory(
    slugOrId: string,
    payload: UpdateStoryPayload,
    action?: StoryAction
  ): Promise<StoryApiResponse<StoryItem>> {
    const act = action || payload.action;
    const query = act ? `?action=${act}` : "";
    return api.patch<StoryApiResponse<StoryItem>>(
      `/stories/my/${slugOrId}${query}`,
      payload
    );
  },
};

export default storyService;
