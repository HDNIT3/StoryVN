import api from "../api";
import type {
  CreateTagPayload,
  PaginatedTags,
  QueryTagParams,
  SeedTagResult,
  TagApiResponse,
  TagItem,
  UpdateTagPayload,
} from "../../types/tag";

export const tagService = {
  /**
   * Lấy danh sách tag (có phân trang, tìm kiếm, lọc isActive, sắp xếp)
   */
  findAll(params?: QueryTagParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.isActive !== undefined)
      searchParams.append("isActive", String(params.isActive));
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);
    if (params?.all !== undefined)
      searchParams.append("all", String(params.all));

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/tags?${queryString}` : "/tags";

    return api.get<TagApiResponse<PaginatedTags>>(endpoint);
  },

  /**
   * Lấy chi tiết tag theo ID
   */
  findById(id: string) {
    return api.get<TagApiResponse<TagItem>>(`/tags/${id}`);
  },

  /**
   * Tạo mới tag
   */
  create(payload: CreateTagPayload) {
    return api.post<TagApiResponse<TagItem>>("/tags", payload);
  },

  /**
   * Cập nhật thông tin tag
   */
  update(id: string, payload: UpdateTagPayload) {
    return api.patch<TagApiResponse<TagItem>>(`/tags/${id}`, payload);
  },

  /**
   * Xóa tag
   */
  delete(id: string) {
    return api.delete<TagApiResponse<null>>(`/tags/${id}`);
  },

  /**
   * Nạp danh sách tag mẫu ban đầu (Seed data)
   */
  seed() {
    return api.post<TagApiResponse<SeedTagResult>>("/tags/seed");
  },
};

export default tagService;
