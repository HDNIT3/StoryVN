import api from "../api";
import type {
  PaginatedPublicStories,
  PublicStoryDetail,
  PublicStoryItem,
  QueryPublicStoriesParams,
  StoryFollowResult,
  StoryInteractionResult,
  StoryRatingResult,
} from "../../types/public-story";
import type { StoryApiResponse } from "../../types/story";

export const publicStoryService = {
  async getPublicStories(
    params?: QueryPublicStoriesParams
  ): Promise<StoryApiResponse<PaginatedPublicStories>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.genre) searchParams.append("genre", params.genre);
    if (params?.tag) searchParams.append("tag", params.tag);
    if (params?.ageRating) searchParams.append("ageRating", params.ageRating);
    if (params?.progressState) searchParams.append("progressState", params.progressState);
    if (params?.originType) searchParams.append("originType", params.originType);
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const qs = searchParams.toString();
    return api.get<StoryApiResponse<PaginatedPublicStories>>(
      `/public/stories${qs ? `?${qs}` : ""}`
    );
  },

  async getTopByViews(limit = 10): Promise<StoryApiResponse<PublicStoryItem[]>> {
    return api.get<StoryApiResponse<PublicStoryItem[]>>(
      `/public/stories/top-views?limit=${limit}`
    );
  },

  async getTopByLikes(limit = 10): Promise<StoryApiResponse<PublicStoryItem[]>> {
    return api.get<StoryApiResponse<PublicStoryItem[]>>(
      `/public/stories/top-likes?limit=${limit}`
    );
  },

  async getStoryDetail(slugOrId: string): Promise<StoryApiResponse<PublicStoryDetail>> {
    return api.get<StoryApiResponse<PublicStoryDetail>>(
      `/public/stories/${slugOrId}`
    );
  },

  async recordView(id: string): Promise<void> {
    try {
      await api.post(`/public/stories/${id}/view`, {});
    } catch {
      // ignore silently
    }
  },

  async toggleLike(id: string): Promise<StoryApiResponse<StoryInteractionResult>> {
    return api.post<StoryApiResponse<StoryInteractionResult>>(
      `/public/stories/${id}/like`,
      {}
    );
  },

  async toggleFollow(id: string): Promise<StoryApiResponse<StoryFollowResult>> {
    return api.post<StoryApiResponse<StoryFollowResult>>(
      `/public/stories/${id}/follow`,
      {}
    );
  },

  async rateStory(
    id: string,
    score: number
  ): Promise<StoryApiResponse<StoryRatingResult>> {
    return api.post<StoryApiResponse<StoryRatingResult>>(
      `/public/stories/${id}/rate`,
      { score }
    );
  },

  async getMyLikes(): Promise<StoryApiResponse<PublicStoryItem[]>> {
    return api.get<StoryApiResponse<PublicStoryItem[]>>("/public/stories/user/likes");
  },

  async getMyFollows(): Promise<StoryApiResponse<PublicStoryItem[]>> {
    return api.get<StoryApiResponse<PublicStoryItem[]>>("/public/stories/user/follows");
  },

  async getMyRatings(): Promise<StoryApiResponse<(PublicStoryItem & { userRatingScore: number })[]>> {
    return api.get<StoryApiResponse<(PublicStoryItem & { userRatingScore: number })[]>>("/public/stories/user/ratings");
  },
};

export default publicStoryService;
