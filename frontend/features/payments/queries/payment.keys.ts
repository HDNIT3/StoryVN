import type { QueryMyTransactionsParams } from "../types";

export const paymentKeys = {
  all: ["payments"] as const,
  myTransactions: (params: QueryMyTransactionsParams) =>
    [...paymentKeys.all, "my-transactions", params] as const,
};
