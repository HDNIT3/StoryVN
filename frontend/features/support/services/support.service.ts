import api, { type ApiResponse } from "@/lib/api";

export type SupportTopic = "ACCOUNT" | "COINS" | "AUTHOR" | "BUG" | "OTHER";
export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type SupportTicketPriority = "NORMAL" | "HIGH" | "URGENT";
export type SupportSenderRole = "USER" | "ADMIN";

export interface SupportMessageItem {
  _id?: string;
  senderRole: SupportSenderRole;
  senderName: string;
  content: string;
  emailSent?: boolean;
  emailError?: string | null;
  createdAt: string;
}

export interface SupportTicketUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  email?: string;
}

export interface SupportTicketItem {
  _id?: string;
  ticketCode: string;
  userId?: SupportTicketUser | null;
  senderName: string;
  email: string;
  topic: SupportTopic;
  priority: SupportTicketPriority;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  messages: SupportMessageItem[];
  lastRepliedBy?: {
    _id: string;
    displayName?: string;
  } | null;
  lastRepliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSupportTickets {
  items: SupportTicketItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminSupportStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface CreateSupportTicketPayload {
  senderName?: string;
  email: string;
  topic: SupportTopic;
  subject: string;
  message: string;
}

export interface AdminReplySupportTicketPayload {
  content: string;
  status?: SupportTicketStatus;
  sendEmail?: boolean;
}

export const SUPPORT_TOPIC_LABELS: Record<SupportTopic, string> = {
  ACCOUNT: "Tài khoản / Đăng nhập / OTP",
  COINS: "Nạp Xu / Mở khóa chương",
  AUTHOR: "Hỗ trợ Tác giả / Duyệt truyện",
  BUG: "Báo lỗi kỹ thuật / Giao diện",
  OTHER: "Góp ý & Câu hỏi khác",
};

export const SUPPORT_STATUS_CONFIG: Record<
  SupportTicketStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  OPEN: {
    label: "Chờ phản hồi",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  },
  IN_PROGRESS: {
    label: "Đang xử lý",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    dotClass: "bg-sky-500",
  },
  RESOLVED: {
    label: "Đã phản hồi",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  CLOSED: {
    label: "Đã đóng",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    dotClass: "bg-slate-400",
  },
};

export const SUPPORT_PRIORITY_CONFIG: Record<
  SupportTicketPriority,
  { label: string; badgeClass: string }
> = {
  NORMAL: {
    label: "Bình thường",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
  HIGH: {
    label: "Ưu tiên cao",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  URGENT: {
    label: "Khẩn cấp",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const supportService = {
  createTicket(payload: CreateSupportTicketPayload) {
    return api.post<ApiResponse<SupportTicketItem>>("/support/tickets", payload);
  },

  getMyTickets(params?: { page?: number; limit?: number; status?: SupportTicketStatus }) {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.status) sp.set("status", params.status);
    const qs = sp.toString();
    return api.get<ApiResponse<PaginatedSupportTickets>>(
      qs ? `/support/tickets/me?${qs}` : "/support/tickets/me"
    );
  },

  lookupTicket(ticketCode: string, email: string) {
    const sp = new URLSearchParams({
      ticketCode: ticketCode.trim().toUpperCase().replace(/^#/, ""),
      email: email.trim().toLowerCase(),
    });
    return api.get<ApiResponse<SupportTicketItem>>(`/support/tickets/lookup?${sp.toString()}`);
  },

  userReply(ticketCode: string, payload: { content: string; email?: string }) {
    const cleanCode = encodeURIComponent(ticketCode.trim().toUpperCase().replace(/^#/, ""));
    return api.post<ApiResponse<SupportTicketItem>>(
      `/support/tickets/${cleanCode}/reply`,
      payload
    );
  },

  adminGetStats() {
    return api.get<ApiResponse<AdminSupportStats>>("/admin/support/tickets/stats");
  },

  adminList(params?: {
    page?: number;
    limit?: number;
    status?: SupportTicketStatus;
    topic?: SupportTopic;
    priority?: SupportTicketPriority;
    search?: string;
  }) {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.status) sp.set("status", params.status);
    if (params?.topic) sp.set("topic", params.topic);
    if (params?.priority) sp.set("priority", params.priority);
    if (params?.search) sp.set("search", params.search);
    const qs = sp.toString();
    return api.get<ApiResponse<PaginatedSupportTickets>>(
      qs ? `/admin/support/tickets?${qs}` : "/admin/support/tickets"
    );
  },

  adminDetail(idOrCode: string) {
    return api.get<ApiResponse<SupportTicketItem>>(
      `/admin/support/tickets/${encodeURIComponent(idOrCode)}`
    );
  },

  adminReply(idOrCode: string, payload: AdminReplySupportTicketPayload) {
    return api.post<
      ApiResponse<{
        ticket: SupportTicketItem;
        emailSent: boolean;
        emailWarning: string | null;
      }>
    >(`/admin/support/tickets/${encodeURIComponent(idOrCode)}/reply`, payload);
  },

  adminUpdateStatus(
    idOrCode: string,
    payload: { status?: SupportTicketStatus; priority?: SupportTicketPriority }
  ) {
    return api.patch<ApiResponse<SupportTicketItem>>(
      `/admin/support/tickets/${encodeURIComponent(idOrCode)}/status`,
      payload
    );
  },
};
