"use client";

import { useQuery } from "@tanstack/react-query";
import { walletService } from "../services/wallet.service";
import { walletKeys } from "./wallet.keys";
import type { WalletSummary } from "../types";

export function useMyWallet(enabled = true) {
  return useQuery({
    queryKey: walletKeys.me(),
    queryFn: async () => {
      const res = await walletService.getMyWallet();
      return res.data as WalletSummary;
    },
    enabled,
    staleTime: 30_000,
  });
}
