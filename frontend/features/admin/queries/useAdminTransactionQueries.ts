import { useQuery } from "@tanstack/react-query";
import { paymentService, type QueryTransactionsParams } from "@/features/payments";
import { adminKeys } from "./admin.keys";

export function useAdminTransactions(params?: QueryTransactionsParams) {
  return useQuery({
    queryKey: adminKeys.transactions(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await paymentService.adminGetTransactions(params);
      return res.data;
    },
    staleTime: 10 * 1000,
  });
}

