import api from "@/lib/api";
import type { AdminDashboardOverviewData } from "../types/dashboard.types";

export interface AdminDashboardApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export const adminDashboardService = {
  /**
   * Lấy dữ liệu tổng quan thống kê và chuỗi thời gian cho Dashboard Quản Trị
   * @param days Số ngày hiển thị biểu đồ (mặc định 14)
   */
  getOverview(days = 14) {
    return api.get<AdminDashboardApiResponse<AdminDashboardOverviewData>>(
      `/admin/dashboard/overview?days=${days}`
    );
  },
};

