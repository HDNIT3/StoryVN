import api from "../api";
import type {
  CreateStoryPayload,
  PaginatedStories,
  QueryMyStoriesParams,
  StoryAction,
  StoryApiResponse,
  StoryItem,
  UpdateStoryPayload,
} from "../../types/story";

export const storyService = {
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
