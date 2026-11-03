export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface TransactionDetail {
  orderCode: string;
  packageName: string;
  amount: number;
  coinAmount: number;
  bonusCoin: number;
  totalCoin: number;
  status: TransactionStatus;
  transactionNo?: string | null;
  bankCode?: string | null;
  payDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentResponse {
  paymentUrl: string;
  orderCode: string;
  transactionId: string;
  amount: number;
  totalCoin: number;
  packageName: string;
}

export interface AdminTransactionItem {
  _id: string;
  orderCode: string;
  userId?: {
    _id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    username: string;
  };
  packageId?: {
    _id: string;
    name: string;
  };
  amount: number;
  coinAmount: number;
  bonusCoin: number;
  totalCoin: number;
  status: TransactionStatus;
  transactionNo?: string | null;
  bankCode?: string | null;
  cardType?: string | null;
  payDate?: string | null;
  vnpResponseCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTransactionsStats {
  totalRevenue: number;
  totalTransactions: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  totalCoinSold: number;
}

export interface AdminTransactionsResponse {
  items: AdminTransactionItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: AdminTransactionsStats;
}

export interface QueryTransactionsParams {
  page?: number;
  limit?: number;
  status?: TransactionStatus | "";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

