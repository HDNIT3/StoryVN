import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api";
import type {
  AdminTransactionsResponse,
  CreatePaymentResponse,
  QueryTransactionsParams,
  TransactionDetail,
} from "../types";

export const paymentService = {
  /**
   * Tạo giao dịch và lấy paymentUrl chuyển hướng sang VNPay Sandbox
   */
  async createVnpayPayment(packageId: string): Promise<ApiResponse<CreatePaymentResponse>> {
    return api.post<ApiResponse<CreatePaymentResponse>>("/payments/vnpay-create", {
      packageId,
    });
  },

  /**
   * Lấy chi tiết thông tin giao dịch theo mã đơn hàng kèm query tham số xác thực nếu có
   */
  async getTransactionByOrderCode(
    orderCode: string,
    queryParams?: Record<string, string>
  ): Promise<ApiResponse<TransactionDetail>> {
    let endpoint = `/payments/transactions/${orderCode}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const search = new URLSearchParams(queryParams).toString();
      endpoint += `?${search}`;
    }
    return api.get<ApiResponse<TransactionDetail>>(endpoint);
  },

  /**
   * Admin: Lấy danh sách giao dịch phân trang, lọc, tìm kiếm và thống kê
   */
  async adminGetTransactions(
    params?: QueryTransactionsParams
  ): Promise<ApiResponse<AdminTransactionsResponse>> {
    let endpoint = "/payments/admin/transactions";
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append("page", String(params.page));
      if (params.limit) searchParams.append("limit", String(params.limit));
      if (params.status) searchParams.append("status", params.status);
      if (params.search) searchParams.append("search", params.search.trim());
      if (params.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);
      const qs = searchParams.toString();
      if (qs) endpoint += `?${qs}`;
    }
    return api.get<ApiResponse<AdminTransactionsResponse>>(endpoint);
  },
};
