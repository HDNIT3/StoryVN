import api, { type ApiResponse } from "@/lib/api";

export type ReportTargetType = "FORUM_POST" | "STORY" | "CHAPTER" | "COMMENT";

export interface SubmitReportPayload {
  targetType: ReportTargetType;
  targetId?: string;
  targetUrl?: string;
  reason: string;
}

export interface ContentReportItem {
  _id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetMeta?: {
    title: string;
    subtitle?: string;
    url?: string;
  };
  userId: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  } | null;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReportsResponse {
  items: ContentReportItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const reportService = {
  submit(payload: SubmitReportPayload) {
    return api.post<ApiResponse<{ reported: boolean }>>("/reports", payload);
  },

  adminList(params?: {
    page?: number;
    limit?: number;
    targetType?: ReportTargetType;
    targetId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.targetType) sp.set("targetType", params.targetType);
    if (params?.targetId) sp.set("targetId", params.targetId);
    if (params?.startDate) sp.set("startDate", params.startDate);
    if (params?.endDate) sp.set("endDate", params.endDate);
    const qs = sp.toString();
    return api.get<ApiResponse<PaginatedReportsResponse>>(
      qs ? `/admin/reports?${qs}` : "/admin/reports"
    );
  },
};
