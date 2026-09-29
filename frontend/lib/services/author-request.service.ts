import api from "../api";
import { UserRole } from "./user.service";

export type AuthorRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AuthorProfileStatus = "ACTIVE" | "INACTIVE";
export type ReviewAction = "APPROVED" | "REJECTED";

export interface CreateAuthorRequestPayload {
  penName: string;
  biography?: string;
  avatarUrl?: string;
  website?: string;
  socialLinks?: Record<string, any>;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  reason?: string;
}

export interface UpdateAuthorRequestPayload {
  penName?: string;
  biography?: string;
  avatarUrl?: string;
  website?: string;
  socialLinks?: Record<string, any>;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  reason?: string;
}

export interface ReviewAuthorRequestPayload {
  status: ReviewAction;
  adminNote?: string;
}

export interface QueryAuthorRequestsParams {
  page?: number;
  limit?: number;
  status?: AuthorRequestStatus;
  search?: string;
}

export interface AuthorRequestItem {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        email: string;
        username: string;
        displayName: string;
        avatarUrl?: string | null;
        role: UserRole;
        status: string;
      };
  penName: string;
  biography?: string | null;
  avatarUrl?: string | null;
  website?: string | null;
  socialLinks?: Record<string, any>;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  reason?: string | null;
  status: AuthorRequestStatus;
  processedBy?:
    | string
    | {
        _id: string;
        email: string;
        username: string;
        displayName: string;
        role: UserRole;
      }
    | null;
  processedAt?: string | null;
  adminNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthorProfileItem {
  _id: string;
  userId: string;
  penName: string;
  biography?: string | null;
  avatarUrl?: string | null;
  website?: string | null;
  socialLinks?: Record<string, any>;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  followerCount?: number;
  storyCount?: number;
  totalViews?: number;
  status: AuthorProfileStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthorRequestStatusData {
  currentRole: UserRole;
  isAuthor: boolean;
  isProcessed: boolean;
  canEdit: boolean;
  request: AuthorRequestItem | null;
  authorProfile: AuthorProfileItem | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedAuthorRequests {
  items: AuthorRequestItem[];
  pagination: PaginationMeta;
}

export interface AuthorRequestApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export const authorRequestService = {
  // Gửi yêu cầu nâng cấp tác giả (dành cho người dùng role USER)
  createRequest(payload: CreateAuthorRequestPayload) {
    return api.post<AuthorRequestApiResponse<{ request: AuthorRequestItem }>>(
      "/users/author-request",
      payload
    );
  },

  // Phía author xem thông tin author_profile và trạng thái đã xử lý hay chưa
  getAuthorProfileAndRequestStatus() {
    return api.get<AuthorRequestApiResponse<AuthorRequestStatusData>>(
      "/users/author-request"
    );
  },

  // Chỉnh sửa thông tin yêu cầu nâng cấp tác giả lúc chưa duyệt (PENDING) hoặc từ chối (REJECTED)
  updateRequest(payload: UpdateAuthorRequestPayload) {
    return api.put<AuthorRequestApiResponse<{ request: AuthorRequestItem }>>(
      "/users/author-request",
      payload
    );
  },

  // Admin / Manager xem danh sách yêu cầu nâng cấp (có phân trang và lọc)
  findAllRequests(params?: QueryAuthorRequestsParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/users/author-requests?${queryString}`
      : "/users/author-requests";

    return api.get<AuthorRequestApiResponse<PaginatedAuthorRequests>>(endpoint);
  },

  // Admin / Manager xử lý nâng cấp (duyệt chuyển đổi role sang AUTHOR & tạo author_profile, hoặc từ chối)
  reviewRequest(id: string, payload: ReviewAuthorRequestPayload) {
    return api.patch<AuthorRequestApiResponse<{ request: AuthorRequestItem }>>(
      `/users/author-requests/${id}/review`,
      payload
    );
  },
};

export default authorRequestService;
