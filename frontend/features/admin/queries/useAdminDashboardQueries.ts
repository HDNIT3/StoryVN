import { useQuery } from "@tanstack/react-query";
import { adminDashboardService } from "../services/admin-dashboard.service";
import { adminKeys } from "./admin.keys";

export function useAdminDashboardOverview(days = 14) {
  return useQuery({
    queryKey: adminKeys.dashboardOverview(days),
    queryFn: async () => {
      const res = await adminDashboardService.getOverview(days);
      return res.data;
    },
    staleTime: 60 * 1000, // Giữ tươi trong 1 phút
    refetchOnWindowFocus: true,
  });
}

