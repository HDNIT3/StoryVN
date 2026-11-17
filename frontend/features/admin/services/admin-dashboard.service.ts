import api from "@/lib/api";
import { dateRangeParams } from "@/components/statistics/date-range";
import type { AdminDashboardOverviewData } from "../types/dashboard.types";

export interface AdminDashboardApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export const adminDashboardService = {
  /**
   * Lấy dữ liệu tổng quan thống kê và chuỗi thời gian cho Dashboard Quản Trị
   * Omitted dates request all-time data.
   */
  getOverview(daysOrRange: number | { startDate?: string; endDate?: string } = {}) {
    const query = typeof daysOrRange === "number"
      ? `days=${daysOrRange}`
      : dateRangeParams(daysOrRange).toString();
    return api.get<AdminDashboardApiResponse<AdminDashboardOverviewData>>(
      `/admin/dashboard/overview${query ? `?${query}` : ""}`
    );
  },
};

