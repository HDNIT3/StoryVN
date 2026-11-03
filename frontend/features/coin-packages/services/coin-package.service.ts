import api from "@/lib/api";
import type {
  CoinPackageApiResponse,
  CoinPackageItem,
  CreateCoinPackagePayload,
  PaginatedCoinPackages,
  QueryCoinPackageParams,
  SeedCoinPackageResult,
  UpdateCoinPackagePayload,
} from "../types";

export const coinPackageService = {
  /**
   * Lấy danh sách gói nạp đang hoạt động dành cho User (sắp xếp theo sortOrder)
   */
  getActivePackages() {
    return api.get<CoinPackageApiResponse<CoinPackageItem[]>>("/coin-packages");
  },

  /**
   * Lấy danh sách gói nạp cho Admin (phân trang, tìm kiếm, lọc isActive, isFeatured, sắp xếp)
   */
  findAdminAll(params?: QueryCoinPackageParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.isActive !== undefined)
      searchParams.append("isActive", String(params.isActive));
    if (params?.isFeatured !== undefined)
      searchParams.append("isFeatured", String(params.isFeatured));
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);
    if (params?.all !== undefined)
      searchParams.append("all", String(params.all));

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/coin-packages/admin?${queryString}`
      : "/coin-packages/admin";

    return api.get<CoinPackageApiResponse<PaginatedCoinPackages>>(endpoint);
  },

  /**
   * Lấy chi tiết gói nạp theo ID
   */
  findById(id: string) {
    return api.get<CoinPackageApiResponse<CoinPackageItem>>(`/coin-packages/${id}`);
  },

  /**
   * Tạo mới gói nạp Xu
   */
  create(payload: CreateCoinPackagePayload) {
    return api.post<CoinPackageApiResponse<CoinPackageItem>>("/coin-packages", payload);
  },

  /**
   * Cập nhật thông tin gói nạp
   */
  update(id: string, payload: UpdateCoinPackagePayload) {
    return api.patch<CoinPackageApiResponse<CoinPackageItem>>(
      `/coin-packages/${id}`,
      payload
    );
  },

  /**
   * Bật/tắt trạng thái hoạt động của gói nạp
   */
  toggleStatus(id: string) {
    return api.patch<CoinPackageApiResponse<CoinPackageItem>>(
      `/coin-packages/${id}/toggle-status`,
      {}
    );
  },

  /**
   * Xóa gói nạp
   */
  delete(id: string) {
    return api.delete<CoinPackageApiResponse<null>>(`/coin-packages/${id}`);
  },

  /**
   * Nạp danh sách gói nạp mặc định (Seed data)
   */
  seed() {
    return api.post<CoinPackageApiResponse<SeedCoinPackageResult>>(
      "/coin-packages/admin/seed"
    );
  },
};

export default coinPackageService;
