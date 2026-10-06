import api from "../api";
import type {
  CreateAuthorRequestPayload,
  UpdateAuthorRequestPayload,
  ReviewAuthorRequestPayload,
  QueryAuthorRequestsParams,
  AuthorRequestItem,
  AuthorRequestStatusData,
  PaginatedAuthorRequests,
  AuthorRequestApiResponse,
} from "../../types/author";

export const authorRequestService = {
  /**
   * Gửi đơn yêu cầu nâng cấp quyền Tác giả (Dành cho tài khoản vai trò USER)
   */
  createRequest(payload: CreateAuthorRequestPayload) {
    return api.post<AuthorRequestApiResponse<{ request: AuthorRequestItem }>>(
      "/users/author-request",
      payload
    );
  },

  /**
   * Lấy trạng thái đơn đăng ký tác giả và thông tin hồ sơ tác giả của tài khoản hiện tại
   */
  getAuthorProfileAndRequestStatus() {
    return api.get<AuthorRequestApiResponse<AuthorRequestStatusData>>(
      "/users/author-request"
    );
  },

  /**
   * Cập nhật thông tin đơn đăng ký tác giả khi đơn đang ở trạng thái Chờ duyệt (PENDING) hoặc Bị từ chối (REJECTED)
   */
  updateRequest(payload: UpdateAuthorRequestPayload) {
    return api.put<AuthorRequestApiResponse<{ request: AuthorRequestItem }>>(
      "/users/author-request",
      payload
    );
  },

  /**
   * Cập nhật thông tin hồ sơ tác giả (Dành cho tài khoản vai trò AUTHOR)
   */
  updateAuthorProfile(payload: {
    penName?: string;
    biography?: string;
    avatarUrl?: string;
    website?: string;
    socialLinks?: Record<string, any>;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  }) {
    return api.put<AuthorRequestApiResponse<{ authorProfile: any }>>(
      "/users/author-profile",
      payload
    );
  },

  /**
   * Dành cho Quản trị viên/Quản lý: Lấy danh sách toàn bộ các yêu cầu nâng cấp tác giả (kèm phân trang và bộ lọc)
   */
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

  /**
   * Dành cho Quản trị viên/Quản lý: Xét duyệt yêu cầu tác giả (Phê duyệt cấp quyền hoặc Từ chối kèm lý do)
   */
  reviewRequest(id: string, payload: ReviewAuthorRequestPayload) {
    return api.patch<AuthorRequestApiResponse<{ request: AuthorRequestItem }>>(
      `/users/author-requests/${id}/review`,
      payload
    );
  },
};

export default authorRequestService;
