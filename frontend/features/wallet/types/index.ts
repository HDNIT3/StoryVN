export interface WalletSummary {
  userId: string;
  balance: number;
  totalSpent: number;
  createdAt: string | null;
  updatedAt: string | null;
}
