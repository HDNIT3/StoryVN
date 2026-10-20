import api from '../api';
import type {
  ChapterItem,
  ChapterStatsData,
  ChapterUpdateItem,
  CreateChapterPayload,
  QueryChaptersParams,
  ReorderChaptersPayload,
  StoryChaptersResponse,
  UpdateChapterPayload,
} from '../../types/chapter';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const chapterService = {
  /**
   * Lấy danh sách chương của tác phẩm (UC-16)
   */
  async getChapters(
    params: QueryChaptersParams
  ): Promise<ApiResponse<StoryChaptersResponse>> {
    const searchParams = new URLSearchParams();
    searchParams.append('storyId', params.storyId);
    if (params.status) searchParams.append('status', params.status);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.order) searchParams.append('order', params.order);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return api.get<ApiResponse<StoryChaptersResponse>>(
      `/chapters?${searchParams.toString()}`
    );
  },

  /**
   * Lấy chi tiết một chương truyện (UC-16)
   */
  async getChapterDetail(id: string): Promise<ApiResponse<ChapterItem>> {
    return api.get<ApiResponse<ChapterItem>>(`/chapters/${id}`);
  },

  /**
   * Lấy lịch sử các bản sửa đổi của chương (UC-15 & UC-16)
   */
  async getChapterHistory(id: string): Promise<ApiResponse<ChapterUpdateItem[]>> {
    return api.get<ApiResponse<ChapterUpdateItem[]>>(`/chapters/${id}/history`);
  },

  /**
   * Lấy danh sách tất cả lịch sử chỉnh sửa chương của tác giả (UC-15 & UC-16)
   */
  async getAllChapterHistory(params?: {
    storyId?: string;
    chapterId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<
    ApiResponse<{
      items: ChapterUpdateItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    const searchParams = new URLSearchParams();
    if (params?.storyId) searchParams.append('storyId', params.storyId);
    if (params?.chapterId) searchParams.append('chapterId', params.chapterId);
    if (params?.status && params.status !== 'ALL') searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    return api.get<
      ApiResponse<{
        items: ChapterUpdateItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/chapters/history?${searchParams.toString()}`);
  },

  /**
   * Tạo chương mới (UC-14 & UC-15)
   */
  async createChapter(
    payload: CreateChapterPayload
  ): Promise<ApiResponse<ChapterItem>> {
    return api.post<ApiResponse<ChapterItem>>('/chapters', payload);
  },

  /**
   * Chỉnh sửa chương truyện (UC-15 & UC-16)
   */
  async updateChapter(
    id: string,
    payload: UpdateChapterPayload
  ): Promise<ApiResponse<ChapterItem>> {
    return api.patch<ApiResponse<ChapterItem>>(`/chapters/${id}`, payload);
  },

  /**
   * Gửi duyệt hàng loạt các chương truyện
   */
  async bulkSubmitChapters(
    chapterIds: string[]
  ): Promise<ApiResponse<{ submittedCount: number; message: string }>> {
    return api.post<ApiResponse<{ submittedCount: number; message: string }>>(
      '/chapters/bulk-submit',
      { chapterIds }
    );
  },

  /**
   * Xóa chương truyện (UC-16)
   */
  async deleteChapter(
    id: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return api.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/chapters/${id}`
    );
  },

  /**
   * Sắp xếp lại thứ tự các chương (UC-16)
   */
  async reorderChapters(
    storyId: string,
    payload: ReorderChaptersPayload
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return api.patch<ApiResponse<{ success: boolean; message: string }>>(
      `/chapters/stories/${storyId}/reorder`,
      payload
    );
  },

  /**
   * Xem thống kê chi tiết các chương trong truyện (UC-16)
   */
  async getStoryChaptersStats(
    storyId: string
  ): Promise<ApiResponse<ChapterStatsData>> {
    return api.get<ApiResponse<ChapterStatsData>>(
      `/chapters/stories/${storyId}/stats`
    );
  },

  /**
   * Lấy danh sách chương theo slug truyện (công khai, mọi role)
   */
  async getChaptersBySlug(
    slug: string,
    params?: { page?: number; limit?: number; order?: 'asc' | 'desc' }
  ): Promise<ApiResponse<{
    items: { _id: string; chapterNumber: number; title: string; viewCount?: number; wordCount?: number; createdAt: string; updatedAt: string }[];
    total: number;
    page: number;
    limit: number;
    story: { _id: string; title: string; slug: string };
  }>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.order) searchParams.append('order', params.order);

    const qs = searchParams.toString();
    return api.get(`/chapters/story/${slug}${qs ? `?${qs}` : ''}`);
  },

  /**
   * Lấy chi tiết nội dung chương để đọc theo slug truyện và số chương
   */
  async getChapterReadingBySlugAndNumber(
    slug: string,
    chapterNumber: number | string
  ): Promise<ApiResponse<{
    _id: string;
    chapterNumber: number;
    title: string;
    content: string;
    viewCount: number;
    wordCount: number;
    isFree: boolean;
    coinPrice: number;
    createdAt: string;
    updatedAt: string;
    story: {
      _id: string;
      title: string;
      slug: string;
      coverUrl?: string;
      author: string;
    };
    prevChapter?: { chapterNumber: number; title: string } | null;
    nextChapter?: { chapterNumber: number; title: string } | null;
    chaptersList: { chapterNumber: number; title: string }[];
  }>> {
    return api.get(`/chapters/story/${slug}/chapter/${chapterNumber}`);
  },
};
