"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/context/AuthContext";
import {
  reportService,
  type ReportTargetType,
  type SubmitReportPayload,
} from "../services/report.service";

export const reportKeys = {
  all: ["reports"] as const,
  adminList: (params?: Record<string, unknown>) =>
    [...reportKeys.all, "admin-list", params] as const,
};

export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitReportPayload) => reportService.submit(payload),
    onSuccess: () => {
      toast.success("Đã gửi báo cáo vi phạm thành công! Ban quản trị sẽ xem xét sớm nhất.");
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      queryClient.invalidateQueries({ queryKey: ["forum"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Không thể gửi báo cáo vi phạm. Vui lòng thử lại.");
    },
  });
}

export function useAdminReports(params?: {
  page?: number;
  limit?: number;
  targetType?: ReportTargetType;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: reportKeys.adminList(params),
    queryFn: async () => {
      const res = await reportService.adminList(params);
      return res.data;
    },
    enabled:
      isAuthenticated && (user?.role === "ADMIN" || user?.role === "MANAGER"),
  });
}
