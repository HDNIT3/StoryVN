import { useQuery } from "@tanstack/react-query";
import { adminDashboardService } from "../services/admin-dashboard.service";

export function useAdminContentStatistics(filters: { startDate?: string; endDate?: string; authorId?: string }, enabled = true) {
  return useQuery({
    queryKey: ["admin", "content-statistics", filters],
    queryFn: async () => (await adminDashboardService.getContentStatistics(filters)).data,
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useAdminDashboardOverview(daysOrRange: number | { startDate?: string; endDate?: string } = {}, enabled = true) {
  return useQuery({
    queryKey: ["admin", "dashboard-overview", daysOrRange],
    enabled,
    queryFn: async () => {
      const res = await adminDashboardService.getOverview(daysOrRange);
      return res.data;
    },
    staleTime: 60 * 1000, // Giữ tươi trong 1 phút
    refetchOnWindowFocus: true,
  });
}

