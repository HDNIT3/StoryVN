import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api";
import type { WalletSummary } from "../types";

export const walletService = {
  /**
   * Lấy thông tin ví của người dùng đang đăng nhập
   */
  async getMyWallet(): Promise<ApiResponse<WalletSummary>> {
    return api.get<ApiResponse<WalletSummary>>("/wallet");
  },
};

export default walletService;
