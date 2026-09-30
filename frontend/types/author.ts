import type { UserRole } from "./user";

/** Trạng thái đơn yêu cầu nâng cấp tác giả */
export type AuthorRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Trạng thái hoạt động của hồ sơ tác giả */
export type AuthorProfileStatus = "ACTIVE" | "INACTIVE";

/** Hành động xét duyệt của Admin/Manager */
export type ReviewAction = "APPROVED" | "REJECTED";

/** Dữ liệu gửi lên khi người dùng tạo đơn đăng ký làm tác giả */
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

/** Dữ liệu gửi lên khi cập nhật đơn đăng ký tác giả */
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

/** Dữ liệu gửi lên khi duyệt / từ chối đơn đăng ký */
export interface ReviewAuthorRequestPayload {
  status: ReviewAction;
  adminNote?: string;
}

/** Tham số tìm kiếm và phân trang danh sách đơn đăng ký */
export interface QueryAuthorRequestsParams {
  page?: number;
  limit?: number;
  status?: AuthorRequestStatus;
  search?: string;
}

/** Chi tiết một đơn yêu cầu làm tác giả */
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

/** Chi tiết hồ sơ tác giả */
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

/** Dữ liệu trạng thái tác giả & đơn đăng ký trả về cho người dùng */
export interface AuthorRequestStatusData {
  currentRole: UserRole;
  isAuthor: boolean;
  isProcessed: boolean;
  canEdit: boolean;
  request: AuthorRequestItem | null;
  authorProfile: AuthorProfileItem | null;
}

/** Thông tin phân trang */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Danh sách đơn đăng ký kèm phân trang */
export interface PaginatedAuthorRequests {
  items: AuthorRequestItem[];
  pagination: PaginationMeta;
}

/** Cấu trúc chuẩn phản hồi từ API Author Request */
export interface AuthorRequestApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}
