export type WithdrawalStatus =
  "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED" | "CANCELLED";
export interface Person {
  _id: string;
  displayName?: string;
  email?: string;
}
export interface Withdrawal {
  _id: string;
  authorId: string | Person;
  coinAmount: number;
  exchangeRate: number;
  payoutPercent: number;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: WithdrawalStatus;
  note: string;
  transactionCode?: string;
  createdAt: string;
  updatedAt: string;
  history: {
    status: WithdrawalStatus;
    actorId: string | Person;
    at: string;
    note: string;
  }[];
}
export interface RoyaltyPolicy {
  exchangeRate: number;
  payoutPercent: number;
  minimumAmount: number;
}
export interface Earnings {
  totalCoins: number;
  availableCoins: number;
  reservedCoins: number;
  completedCoins: number;
  availableAmount: number;
  pendingAmount: number;
  paidAmount: number;
  policy: RoyaltyPolicy;
  bank: Pick<Withdrawal, "bankName" | "bankAccountNumber" | "bankAccountName">;
  bankReady: boolean;
  canWithdraw: boolean;
  reconciliationRequired: boolean;
  activeRequest: { _id: string; status: WithdrawalStatus } | null;
}
export interface Pagination {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
export interface Page<T> {
  items: T[];
  pagination: Pagination;
}
export interface Movement {
  _id: string;
  at: string;
  type: "REVENUE" | WithdrawalStatus;
  coinDelta: number;
  reservedDelta: number;
  note: string;
  requestId?: string;
}
export interface Filters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}
export const statusLabels: Record<WithdrawalStatus, string> = {
  PENDING: "Chờ duyệt",
  PROCESSING: "Đang chuyển tiền",
  COMPLETED: "Đã thanh toán",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
};
export const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
export const coins = (value: number) => `${value.toLocaleString("vi-VN")} Xu`;
export const dateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
