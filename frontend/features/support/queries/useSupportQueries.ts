"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  supportService,
  type AdminReplySupportTicketPayload,
  type CreateSupportTicketPayload,
  type SupportTicketPriority,
  type SupportTicketStatus,
  type SupportTopic,
} from "../services/support.service";

export const supportKeys = {
  all: ["support-tickets"] as const,
  mine: (params?: { page?: number; limit?: number; status?: SupportTicketStatus }) =>
    [...supportKeys.all, "me", params] as const,
  lookup: (ticketCode: string, email: string) =>
    [...supportKeys.all, "lookup", ticketCode, email] as const,
  adminStats: () => [...supportKeys.all, "admin-stats"] as const,
  adminList: (params?: {
    page?: number;
    limit?: number;
    status?: SupportTicketStatus;
    topic?: SupportTopic;
    priority?: SupportTicketPriority;
    search?: string;
  }) => [...supportKeys.all, "admin-list", params] as const,
};

export function useCreateSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSupportTicketPayload) => {
      const res = await supportService.createTicket(payload);
      if (!res.data) throw new Error("Không nhận được dữ liệu phiếu hỗ trợ.");
      return res.data;
    },
    onSuccess: (ticket) => {
      toast.success(
        `Đã gửi yêu cầu hỗ trợ thành công! Mã phiếu của bạn là #${ticket.ticketCode}`
      );
      void qc.invalidateQueries({ queryKey: supportKeys.all });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.";
      toast.error(msg);
    },
  });
}

export function useMySupportTickets(
  params?: { page?: number; limit?: number; status?: SupportTicketStatus },
  enabled = true
) {
  return useQuery({
    queryKey: supportKeys.mine(params),
    queryFn: async () => (await supportService.getMyTickets(params)).data,
    enabled,
  });
}

export function useUserReplySupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketCode,
      content,
      email,
    }: {
      ticketCode: string;
      content: string;
      email?: string;
    }) => {
      const res = await supportService.userReply(ticketCode, { content, email });
      if (!res.data) throw new Error("Không thể cập nhật phản hồi phiếu hỗ trợ.");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Đã gửi phản hồi bổ sung tới Ban quản trị!");
      void qc.invalidateQueries({ queryKey: supportKeys.all });
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "Không thể gửi phản hồi bổ sung."
      );
    },
  });
}

export function useAdminSupportStats(enabled = true) {
  return useQuery({
    queryKey: supportKeys.adminStats(),
    queryFn: async () => (await supportService.adminGetStats()).data,
    enabled,
    staleTime: 20_000,
  });
}

export function useAdminSupportTickets(params?: {
  page?: number;
  limit?: number;
  status?: SupportTicketStatus;
  topic?: SupportTopic;
  priority?: SupportTicketPriority;
  search?: string;
}) {
  return useQuery({
    queryKey: supportKeys.adminList(params),
    queryFn: async () => (await supportService.adminList(params)).data,
  });
}

export function useAdminReplySupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      idOrCode,
      payload,
    }: {
      idOrCode: string;
      payload: AdminReplySupportTicketPayload;
    }) => {
      const res = await supportService.adminReply(idOrCode, payload);
      if (!res.data) throw new Error("Không nhận được kết quả phản hồi.");
      return res.data;
    },
    onSuccess: (res) => {
      if (res.emailWarning) {
        toast.info(res.emailWarning);
      } else if (res.emailSent) {
        toast.success("Đã lưu phản hồi và gửi email trực tiếp tới người dùng!");
      } else {
        toast.success("Đã lưu phản hồi hỗ trợ thành công!");
      }
      void qc.invalidateQueries({ queryKey: supportKeys.all });
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "Không thể gửi phản hồi phiếu hỗ trợ."
      );
    },
  });
}

export function useAdminUpdateSupportTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      idOrCode,
      status,
      priority,
    }: {
      idOrCode: string;
      status?: SupportTicketStatus;
      priority?: SupportTicketPriority;
    }) => {
      const res = await supportService.adminUpdateStatus(idOrCode, {
        status,
        priority,
      });
      if (!res.data) throw new Error("Không thể cập nhật trạng thái phiếu.");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật thông tin phiếu hỗ trợ.");
      void qc.invalidateQueries({ queryKey: supportKeys.all });
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "Không thể cập nhật phiếu hỗ trợ."
      );
    },
  });
}
