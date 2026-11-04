"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { paymentService } from "../services/payment.service";
import { paymentKeys } from "./payment.keys";
import type { PaymentHistoryResponse, QueryMyTransactionsParams } from "../types";

export function useMyTransactions(
  params: QueryMyTransactionsParams,
  enabled = true
) {
  return useQuery({
    queryKey: paymentKeys.myTransactions(params),
    queryFn: async () => {
      const res = await paymentService.getMyTransactions(params);
      return res.data as PaymentHistoryResponse;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
