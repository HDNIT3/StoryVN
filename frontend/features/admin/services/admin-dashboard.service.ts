import api from "@/lib/api";
import { dateRangeParams } from "@/components/statistics/date-range";
import type { AdminDashboardOverviewData, AdminContentStatistics, AdminFinancialSummary } from "../types/dashboard.types";

export interface AdminDashboardApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export const adminDashboardService = {
  getFinancialSummary() {
    return api.get<AdminDashboardApiResponse<AdminFinancialSummary>>("/admin/dashboard/financial-summary");
  },
  getContentStatistics(range: { startDate?: string; endDate?: string; authorId?: string } = {}) {
    const query = dateRangeParams(range);
    if (range.authorId) query.set("authorId", range.authorId);
    return api.get<AdminDashboardApiResponse<AdminContentStatistics>>(`/admin/dashboard/content${query.size ? `?${query}` : ""}`);
  },
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

