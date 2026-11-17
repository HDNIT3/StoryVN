import api, { type ApiResponse } from "@/lib/api";
import type { DateRange } from "@/components/statistics";
import { dateRangeParams } from "@/components/statistics/date-range";
import type { ForumPage, ForumPost, ForumPostInput, ForumPostStatus, ForumReport, ForumStats } from "../types";

export const forumService = {
  reports(id: string, page: number, range?: DateRange, limit = 10) {
    const params = dateRangeParams(range);
    params.set("page", String(page)); params.set("limit", String(limit));
    return api.get<ApiResponse<ForumPage<ForumReport>>>(`/admin/forum/posts/${id}/reports?${params}`);
  },
  list(scope: "feed" | "me" | "admin", page: number, status?: ForumPostStatus, range?: DateRange, limit = 10) {
    const path = scope === "admin" ? "/admin/forum/posts" : scope === "me" ? "/forum/posts/me" : "/forum/posts";
    const params = dateRangeParams(range);
    params.set("page", String(page)); params.set("limit", String(limit));
    if (status) params.set("status", status);
    return api.get<ApiResponse<ForumPage<ForumPost>>>(`${path}?${params}`);
  },
  detail(id: string) {
    return api.get<ApiResponse<ForumPost>>(`/forum/posts/${id}`);
  },
  create(input: ForumPostInput) {
    return api.post<ApiResponse<ForumPost>>("/forum/posts", input);
  },
  update(id: string, input: ForumPostInput) {
    return api.patch<ApiResponse<ForumPost>>(`/forum/posts/${id}`, input);
  },
  remove(id: string) {
    return api.delete<ApiResponse<unknown>>(`/forum/posts/${id}`);
  },
  updateStatus(id: string, status: ForumPostStatus) {
    return api.patch<ApiResponse<ForumPost>>(`/admin/forum/posts/${id}/status`, { status });
  },
  like(id: string) {
    return api.post<ApiResponse<{ liked: boolean; likeCount: number }>>(`/forum/posts/${id}/like`);
  },
  unlike(id: string) {
    return api.delete<ApiResponse<{ liked: boolean; likeCount: number }>>(`/forum/posts/${id}/like`);
  },
  share(id: string) {
    return api.post<ApiResponse<{ viewCount: number; shareCount: number }>>(`/forum/posts/${id}/share`);
  },
  view(id: string) {
    return api.post<ApiResponse<{ viewCount: number; shareCount: number }>>(`/forum/posts/${id}/view`);
  },
  report(id: string, reason: string) {
    return api.post<ApiResponse<{ reported: boolean }>>(`/forum/posts/${id}/reports`, { reason });
  },
  stats(range?: DateRange) {
    const params = dateRangeParams(range);
    return api.get<ApiResponse<ForumStats>>(`/admin/forum/posts/stats?${params}`);
  },
  myStats(range?: DateRange) {
    const params = dateRangeParams(range);
    return api.get<ApiResponse<ForumStats>>(`/forum/posts/me/stats?${params}`);
  },
};
