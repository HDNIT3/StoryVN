"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "@/lib/toast";
import { adminFinancialSummaryQueryKey } from "@/features/admin/queries/useAdminDashboardQueries";
import type { Earnings, Filters, Movement, Page, Withdrawal } from "./types";

function queryString(filters: Filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}
async function get<T>(path: string) {
  return (await api.get<{ data: T }>(path)).data;
}
export function useEarnings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["withdrawals", user?._id, "earnings"],
    queryFn: () => get<Earnings>("/authors/me/earnings"),
    enabled: !!user,
    refetchOnWindowFocus: true,
  });
}
export function useWithdrawals(admin: boolean, filters: Filters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["withdrawals", user?._id, admin, filters],
    queryFn: () =>
      get<Page<Withdrawal>>(
        `${admin ? "/admin/withdrawals" : "/authors/me/withdrawals"}?${queryString(filters)}`,
      ),
    enabled: !!user,
    refetchInterval: 30000,
  });
}
export function useWithdrawal(id: string | null, admin: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["withdrawals", user?._id, admin, "detail", id],
    queryFn: () =>
      get<Withdrawal>(
        `${admin ? "/admin/withdrawals" : "/authors/me/withdrawals"}/${id}`,
      ),
    enabled: !!id && !!user,
  });
}
export function useMovements(filters: Filters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["withdrawals", user?._id, "movements", filters],
    queryFn: () =>
      get<Page<Movement>>(
        `/authors/me/earnings/history?${queryString(filters)}`,
      ),
    enabled: !!user,
  });
}
export function useWithdrawalAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      path,
      body,
    }: {
      path: string;
      body?: Record<string, string>;
    }) => (await api.post<{ data: Withdrawal }>(path, body)).data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["withdrawals"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
      void client.invalidateQueries({ queryKey: adminFinancialSummaryQueryKey });
      toast.success("Đã cập nhật yêu cầu rút tiền");
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message || "Không thể xử lý yêu cầu"),
  });
}
