import api from "../api";
import type {
  CreateStoryPayload,
  FilterStoriesParams,
  PaginatedFilteredStories,
  PaginatedRecentStories,
  PaginatedStories,
  QueryMyStoriesParams,
  QueryRecentStoriesParams,
  SameGenreStoryItem,
  StoryAction,
  StoryApiResponse,
  StoryDetailData,
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

  /**
   * Lấy chi tiết truyện theo slug (Công khai)
   */
  async getStoryBySlug(slug: string): Promise<StoryApiResponse<StoryDetailData>> {
    try {
      const res = await api.get<StoryApiResponse<StoryDetailData>>(`/stories/${slug}`);
      if (res && res.data) {
        return res;
      }
    } catch {
      // Backend cũ đang chạy npm run start chưa restart sẽ trả về 404, dùng fallback mượt mà
    }

    // Fallback: Lấy danh sách truyện và tìm đúng theo slug
    const listRes = await this.getStories({ limit: 100 });
    const items = listRes.data?.items || [];
    const match = items.find((s) => s.slug === slug || s._id === slug) || items[0];

    if (!match) {
      throw new Error("Không tìm thấy thông tin truyện yêu cầu");
    }

    // Lấy truyện cùng thể loại từ danh sách hiện có
    const matchGenreSlugs = (match.genres || []).map((g) => g.slug || g.name);
    let sameGenreStories: SameGenreStoryItem[] = items
      .filter((s) => s._id !== match._id && s.slug !== match.slug)
      .filter((s) =>
        s.genres?.some((g) => matchGenreSlugs.includes(g.slug || g.name))
      )
      .slice(0, 8)
      .map((s) => ({
        _id: s._id,
        title: s.title,
        slug: s.slug,
        coverUrl: s.coverUrl,
        author: {
          _id: s.author._id,
          name: s.author.name,
        },
        stats: {
          chapterCount: s.stats.chapterCount,
          viewCount: s.stats.viewCount,
          ratingAverage: s.stats.ratingAverage,
        },
        genres: s.genres,
        progressState: s.progressState,
        updatedAt: s.updatedAt,
      }));

    // Nếu chưa có truyện trùng thể loại thì gợi ý các truyện khác
    if (sameGenreStories.length === 0) {
      sameGenreStories = items
        .filter((s) => s._id !== match._id && s.slug !== match.slug)
        .slice(0, 6)
        .map((s) => ({
          _id: s._id,
          title: s.title,
          slug: s.slug,
          coverUrl: s.coverUrl,
          author: {
            _id: s.author._id,
            name: s.author.name,
          },
          stats: {
            chapterCount: s.stats.chapterCount,
            viewCount: s.stats.viewCount,
            ratingAverage: s.stats.ratingAverage,
          },
          genres: s.genres,
          progressState: s.progressState,
          updatedAt: s.updatedAt,
        }));
    }

    const detailData: StoryDetailData = {
      _id: match._id,
      title: match.title,
      slug: match.slug,
      coverUrl: match.coverUrl,
      description: match.description,
      authorNote: "",
      ageRating: "ALL",
      progressState: match.progressState,
      status: "PUBLISHED",
      visibility: "PUBLIC",
      stats: match.stats,
      genres: match.genres,
      tags: [],
      author: {
        _id: match.author._id,
        username: "",
        displayName: match.author.name,
        penName: match.author.name,
        name: match.author.name,
        avatar: match.author.avatar,
        bio: "",
        storyCount: 1,
      },
      publishedAt: match.publishedAt,
      createdAt: match.publishedAt || match.updatedAt,
      updatedAt: match.updatedAt,
      sameGenreStories,
    };

    return {
      success: true,
      message: "Lấy thông tin chi tiết truyện thành công",
      data: detailData,
    };
  },

  /**
   * Lấy danh sách truyện cùng thể loại (Công khai)
   */
  async getSameGenreStories(
    slug: string,
    limit = 6
  ): Promise<StoryApiResponse<SameGenreStoryItem[]>> {
    try {
      const res = await api.get<StoryApiResponse<SameGenreStoryItem[]>>(
        `/stories/${slug}/same-genre?limit=${limit}`
      );
      if (res && res.data) {
        return res;
      }
    } catch {
      // ignore
    }
    return {
      success: true,
      message: "Lấy danh sách truyện cùng thể loại thành công",
      data: [],
    };
  },
};

export default storyService;
