"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/context/AuthContext";
import {
  reportService,
  type ReportTargetType,
  type SubmitReportPayload,
  type ReportStatus,
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
  status?: ReportStatus;
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


export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, resolutionNote }: { id: string; status: ReportStatus; resolutionNote?: string }) => reportService.updateStatus(id, { status, resolutionNote }),
    onSuccess: () => {
      toast.success("\u0110\u00e3 c\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i v\u00e0 l\u01b0u k\u1ebft qu\u1ea3 xem x\u00e9t");
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
    onError: (error: { message?: string }) => toast.error(error?.message || "Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt b\u00e1o c\u00e1o"),
  });
}
