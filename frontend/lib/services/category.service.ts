import api from "../api";
import type {
  CategoryApiResponse,
  CategoryItem,
  CreateCategoryPayload,
  PaginatedCategories,
  QueryCategoryParams,
  SeedCategoryResult,
  UpdateCategoryPayload,
} from "../../types/category";

export const categoryService = {
  /**
   * Lấy danh sách thể loại / danh mục (có phân trang, tìm kiếm, lọc isActive, sắp xếp)
   */
  findAll(params?: QueryCategoryParams) {
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
    const endpoint = queryString ? `/categories?${queryString}` : "/categories";

    return api.get<CategoryApiResponse<PaginatedCategories>>(endpoint);
  },

  /**
   * Lấy chi tiết thể loại theo ID
   */
  findById(id: string) {
    return api.get<CategoryApiResponse<CategoryItem>>(`/categories/${id}`);
  },

  /**
   * Tạo mới thể loại / danh mục
   */
  create(payload: CreateCategoryPayload) {
    return api.post<CategoryApiResponse<CategoryItem>>("/categories", payload);
  },

  /**
   * Cập nhật thông tin thể loại / danh mục
   */
  update(id: string, payload: UpdateCategoryPayload) {
    return api.patch<CategoryApiResponse<CategoryItem>>(`/categories/${id}`, payload);
  },

  /**
   * Xóa thể loại / danh mục
   */
  delete(id: string) {
    return api.delete<CategoryApiResponse<null>>(`/categories/${id}`);
  },

  /**
   * Nạp danh sách thể loại mẫu ban đầu (Seed data)
   */
  seed() {
    return api.post<CategoryApiResponse<SeedCategoryResult>>("/categories/seed");
  },
};

export default categoryService;
