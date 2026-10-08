import api from "../api";
import type {
  NotificationsListResponse,
  UnreadCountResponse,
  QueryNotificationsParams,
} from "../../types/notification";
import type { ApiResponse } from "../api";

export const notificationService = {
  /**
   * Lấy danh sách thông báo của tôi (có phân trang, filter)
   */
  getMyNotifications(params?: QueryNotificationsParams) {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.isRead !== undefined) searchParams.set("isRead", String(params.isRead));
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return api.get<ApiResponse<NotificationsListResponse>>(
      `/notifications${qs ? `?${qs}` : ""}`
    );
  },

  /**
   * Đếm số thông báo chưa đọc
   */
  getUnreadCount() {
    return api.get<ApiResponse<UnreadCountResponse>>("/notifications/unread-count");
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  markOneAsRead(id: string) {
    return api.patch<ApiResponse>(`/notifications/${id}/read`);
  },

  /**
   * Đánh dấu tất cả là đã đọc
   */
  markAllAsRead() {
    return api.patch<ApiResponse<{ modifiedCount: number }>>("/notifications/read-all");
  },

  /**
   * Xóa 1 thông báo
   */
  deleteOne(id: string) {
    return api.delete<ApiResponse>(`/notifications/${id}`);
  },

  /**
   * Xóa tất cả thông báo đã đọc
   */
  deleteAllRead() {
    return api.delete<ApiResponse<{ deletedCount: number }>>("/notifications/clear-read");
  },
};

export default notificationService;
