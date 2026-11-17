import { useQuery } from "@tanstack/react-query";
import { adminDashboardService } from "../services/admin-dashboard.service";

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

