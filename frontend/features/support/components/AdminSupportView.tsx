"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import {
  SUPPORT_PRIORITY_CONFIG,
  SUPPORT_STATUS_CONFIG,
  SUPPORT_TOPIC_LABELS,
  type SupportTicketItem,
  type SupportTicketPriority,
  type SupportTicketStatus,
  type SupportTopic,
} from "../services/support.service";
import {
  useAdminReplySupportTicket,
  useAdminSupportStats,
  useAdminSupportTickets,
  useAdminUpdateSupportTicketStatus,
} from "../queries/useSupportQueries";

type StatusFilterTab = "ALL" | SupportTicketStatus;

const QUICK_REPLY_TEMPLATES: { label: string; text: string }[] = [
  {
    label: "Đối soát & Cộng bù Xu",
    text: "Xin chào bạn,\nBan quản trị StoryVN đã kiểm tra lịch sử giao dịch và hoàn tất đối soát nạp Xu cho tài khoản của bạn. Số dư Xu đã được cập nhật đầy đủ vào Ví.\nBạn vui lòng tải lại trang hoặc kiểm tra mục Ví của tôi nhé. Cảm ơn bạn đã đồng hành cùng StoryVN!",
  },
  {
    label: "Hỗ trợ Tài khoản / OTP",
    text: "Xin chào bạn,\nChúng tôi đã kiểm tra trạng thái tài khoản của bạn trên hệ thống. Tài khoản hiện đang hoạt động bình thường. Khi lấy mã OTP, bạn vui lòng kiểm tra thêm hộp thư Spam / Quảng cáo (Promotions) và thử lại sau 60 giây.\nNếu vẫn gặp khó khăn, bạn có thể phản hồi trực tiếp tại phiếu hỗ trợ này để chúng tôi hỗ trợ ngay nhé!",
  },
  {
    label: "Hỗ trợ Tác giả / Duyệt truyện",
    text: "Xin chào bạn,\nBan biên tập StoryVN đã ghi nhận yêu cầu hỗ trợ liên quan đến tác phẩm / hồ sơ tác giả của bạn và chuyển tới bộ phận kiểm duyệt ưu tiên xem xét.\nKết quả duyệt sẽ được thông báo trực tiếp trên hệ thống ngay khi hoàn tất. Chúc bạn sáng tác hiệu quả!",
  },
  {
    label: "Ghi nhận lỗi kỹ thuật",
    text: "Xin chào bạn,\nCảm ơn bạn đã đóng góp thông tin báo lỗi cho StoryVN! Đội ngũ kỹ thuật đã tiếp nhận chi tiết sự cố và đang tiến hành khắc phục.\nRất mong bạn tiếp tục có những trải nghiệm đọc truyện tuyệt vời tại StoryVN!",
  },
];

function TicketDetailAndReplyModal({
  ticket,
  onClose,
  onTicketUpdated,
}: {
  ticket: SupportTicketItem | null;
  onClose: () => void;
  onTicketUpdated: (updated: SupportTicketItem) => void;
}) {
  const replyMutation = useAdminReplySupportTicket();
  const statusMutation = useAdminUpdateSupportTicketStatus();

  const [replyText, setReplyText] = useState("");
  const [nextStatus, setNextStatus] = useState<SupportTicketStatus>("RESOLVED");
  const [sendEmail, setSendEmail] = useState(true);

  if (!ticket) return null;

  const statusCfg = SUPPORT_STATUS_CONFIG[ticket.status] || SUPPORT_STATUS_CONFIG.OPEN;
  const priorityCfg =
    SUPPORT_PRIORITY_CONFIG[ticket.priority] || SUPPORT_PRIORITY_CONFIG.NORMAL;

  const handleQuickPriorityChange = async (priority: SupportTicketPriority) => {
    const updated = await statusMutation.mutateAsync({
      idOrCode: ticket.ticketCode,
      priority,
    });
    onTicketUpdated(updated);
  };

  const handleQuickStatusChange = async (status: SupportTicketStatus) => {
    const updated = await statusMutation.mutateAsync({
      idOrCode: ticket.ticketCode,
      status,
    });
    onTicketUpdated(updated);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const res = await replyMutation.mutateAsync({
      idOrCode: ticket.ticketCode,
      payload: {
        content: replyText.trim(),
        status: nextStatus,
        sendEmail,
      },
    });
    setReplyText("");
    onTicketUpdated(res.ticket);
  };

  const threadMessages =
    ticket.messages && ticket.messages.length > 0
      ? ticket.messages
      : [
          {
            senderRole: "USER" as const,
            senderName: ticket.senderName,
            content: ticket.message,
            emailSent: false,
            createdAt: ticket.createdAt,
          },
        ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 font-bold">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-extrabold text-white">
                  #{ticket.ticketCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusCfg.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass}`} />
                  {statusCfg.label}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${priorityCfg.badgeClass}`}
                >
                  {priorityCfg.label}
                </span>
              </div>
              <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                {ticket.subject}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Sender & Quick Controls */}
          <div className="grid gap-3 sm:grid-cols-12 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <div className="sm:col-span-7 flex items-center gap-3 min-w-0">
              <div className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden border border-slate-200 bg-indigo-50 flex items-center justify-center font-bold text-indigo-700">
                {ticket.userId?.avatarUrl ? (
                  <Image
                    src={ticket.userId.avatarUrl}
                    alt={ticket.senderName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  ticket.senderName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {ticket.senderName}
                  </span>
                  {ticket.userId ? (
                    <span className="rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                      Thành viên @{ticket.userId.username}
                    </span>
                  ) : (
                    <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      Khách liên hệ
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-sky-700 truncate mt-0.5">
                  ✉️ {ticket.email}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chủ đề: <strong>{SUPPORT_TOPIC_LABELS[ticket.topic] || ticket.topic}</strong> · Gửi lúc{" "}
                  {new Date(ticket.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="sm:col-span-5 flex flex-wrap sm:justify-end items-center gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Trạng thái phiếu
                </label>
                <select
                  value={ticket.status}
                  disabled={statusMutation.isPending}
                  onChange={(e) =>
                    void handleQuickStatusChange(e.target.value as SupportTicketStatus)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="OPEN">Chờ phản hồi</option>
                  <option value="IN_PROGRESS">Đang xử lý</option>
                  <option value="RESOLVED">Đã phản hồi</option>
                  <option value="CLOSED">Đã đóng</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Độ ưu tiên
                </label>
                <select
                  value={ticket.priority}
                  disabled={statusMutation.isPending}
                  onChange={(e) =>
                    void handleQuickPriorityChange(
                      e.target.value as SupportTicketPriority
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="NORMAL">Bình thường</option>
                  <option value="HIGH">Ưu tiên cao</option>
                  <option value="URGENT">Khẩn cấp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lịch sử trao đổi & Phản hồi ({threadMessages.length})
            </h4>

            <div className="space-y-3">
              {threadMessages.map((msg, idx) => {
                const isAdmin = msg.senderRole === "ADMIN";
                return (
                  <div
                    key={msg._id || idx}
                    className={`rounded-2xl border p-4 ${
                      isAdmin
                        ? "border-sky-200 bg-sky-50/60 ml-4 sm:ml-10"
                        : "border-slate-200 bg-white mr-4 sm:mr-10"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                            isAdmin
                              ? "bg-sky-600 text-white"
                              : "bg-slate-800 text-white"
                          }`}
                        >
                          {isAdmin ? `Ban quản trị (${msg.senderName})` : msg.senderName}
                        </span>
                        {isAdmin && msg.emailSent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            ✓ Đã gửi qua Email người dùng
                          </span>
                        )}
                        {isAdmin && msg.emailError && (
                          <span
                            title={msg.emailError}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700"
                          >
                            ⚠ Chưa gửi được SMTP (Chỉ lưu hệ thống)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reply Composer */}
          <form
            onSubmit={handleSendReply}
            className="rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-4 sm:p-5 space-y-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Soạn phản hồi gửi người dùng
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REPLY_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => setReplyText(tpl.text)}
                    className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              required
              maxLength={3000}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Nhập nội dung giải đáp cho ${ticket.senderName}...`}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none resize-none"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="h-4 w-4 rounded accent-sky-600"
                  />
                  <span>
                    Gửi trực tiếp qua Email tới{" "}
                    <strong className="text-sky-700">{ticket.email}</strong>
                  </span>
                </label>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Chuyển sang:</span>
                  <select
                    value={nextStatus}
                    onChange={(e) =>
                      setNextStatus(e.target.value as SupportTicketStatus)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="RESOLVED">Đã phản hồi (Resolved)</option>
                    <option value="IN_PROGRESS">Đang xử lý (In Progress)</option>
                    <option value="CLOSED">Đóng phiếu (Closed)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Đóng
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={replyMutation.isPending}
                  disabled={replyMutation.isPending || !replyText.trim()}
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  {sendEmail ? "Gửi phản hồi & Email" : "Lưu phản hồi"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminSupportView() {
  const [statusTab, setStatusTab] = useState<StatusFilterTab>("ALL");
  const [topicFilter, setTopicFilter] = useState<"ALL" | SupportTopic>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(
    null
  );

  const statsQuery = useAdminSupportStats();
  const ticketsQuery = useAdminSupportTickets({
    page,
    limit: 15,
    status: statusTab === "ALL" ? undefined : statusTab,
    topic: topicFilter === "ALL" ? undefined : topicFilter,
    search: search.trim() || undefined,
  });

  const stats = statsQuery.data;
  const items = ticketsQuery.data?.items ?? [];
  const pagination = ticketsQuery.data?.pagination;

  const statusTabs: { key: StatusFilterTab; label: string; count: number }[] = [
    { key: "ALL", label: "Tất cả phiếu", count: stats?.total ?? 0 },
    { key: "OPEN", label: "Chờ phản hồi", count: stats?.open ?? 0 },
    { key: "IN_PROGRESS", label: "Đang xử lý", count: stats?.inProgress ?? 0 },
    { key: "RESOLVED", label: "Đã phản hồi", count: stats?.resolved ?? 0 },
    { key: "CLOSED", label: "Đã đóng", count: stats?.closed ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Link href="/quan-ly" className="hover:text-slate-700 transition">
              Quản trị
            </Link>
            <span>/</span>
            <span className="text-sky-600">Tiếp nhận hỗ trợ</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
            Tiếp nhận & Phản hồi Hỗ trợ người dùng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý các phiếu yêu cầu trợ giúp, giải đáp thắc mắc và gửi phản hồi trực tiếp qua Email & Hộp thư hỗ trợ của người dùng.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/ho-tro"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <span>Trang Hỗ trợ công khai</span>
            <span>↗</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              void statsQuery.refetch();
              void ticketsQuery.refetch();
            }}
            disabled={ticketsQuery.isFetching}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <svg
              className={`h-4 w-4 ${ticketsQuery.isFetching ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Tổng phiếu hỗ trợ</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {(stats?.total ?? 0).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Chờ phản hồi</div>
            <div className="text-2xl font-bold text-amber-600 mt-0.5 flex items-center gap-2">
              {(stats?.open ?? 0).toLocaleString("vi-VN")}
              {(stats?.open ?? 0) > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Đang xử lý</div>
            <div className="text-2xl font-bold text-sky-600 mt-0.5">
              {(stats?.inProgress ?? 0).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Đã giải quyết</div>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">
              {(stats?.resolved ?? 0).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {statusTabs.map((t) => {
              const active = statusTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setStatusTab(t.key);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-white text-slate-700"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={topicFilter}
              onChange={(e) => {
                setTopicFilter(e.target.value as "ALL" | SupportTopic);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả chủ đề</option>
              <option value="ACCOUNT">Tài khoản / OTP</option>
              <option value="COINS">Nạp Xu / Mở khóa</option>
              <option value="AUTHOR">Hỗ trợ Tác giả</option>
              <option value="BUG">Báo lỗi kỹ thuật</option>
              <option value="OTHER">Góp ý & Khác</option>
            </select>

            <div className="relative min-w-[230px] flex-1 sm:flex-initial">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm mã #SP, email, tên, tiêu đề..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {ticketsQuery.isPending ? (
          <div className="p-16 text-center text-sm text-slate-500">
            Đang tải danh sách phiếu hỗ trợ...
          </div>
        ) : ticketsQuery.isError ? (
          <div className="p-12 text-center text-sm text-rose-600 bg-rose-50/50">
            Không thể tải dữ liệu phiếu hỗ trợ. Vui lòng thử lại.
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Chưa có phiếu yêu cầu hỗ trợ nào
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Các yêu cầu trợ giúp mới từ độc giả và tác giả sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Mã phiếu</th>
                  <th className="py-3.5 px-4">Người gửi & Email</th>
                  <th className="py-3.5 px-4">Chủ đề</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Tiêu đề & Nội dung</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((ticket) => {
                  const statusCfg =
                    SUPPORT_STATUS_CONFIG[ticket.status] || SUPPORT_STATUS_CONFIG.OPEN;
                  const priorityCfg =
                    SUPPORT_PRIORITY_CONFIG[ticket.priority] ||
                    SUPPORT_PRIORITY_CONFIG.NORMAL;
                  const adminRepliesCount = (ticket.messages || []).filter(
                    (m) => m.senderRole === "ADMIN"
                  ).length;
                  const anyEmailSent = (ticket.messages || []).some(
                    (m) => m.senderRole === "ADMIN" && m.emailSent
                  );

                  return (
                    <tr
                      key={ticket.ticketCode}
                      className="hover:bg-slate-50/70 transition"
                    >
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span className="inline-block rounded-lg bg-slate-900 px-2 py-1 text-xs font-extrabold text-white">
                          #{ticket.ticketCode}
                        </span>
                        <div className="mt-1">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.2 text-[10px] font-bold ${priorityCfg.badgeClass}`}
                          >
                            {priorityCfg.label}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900 text-xs">
                          {ticket.senderName}
                        </div>
                        <div className="text-[11px] text-sky-700 font-medium break-all">
                          {ticket.email}
                        </div>
                        {ticket.userId && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            @{ticket.userId.username}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {SUPPORT_TOPIC_LABELS[ticket.topic] || ticket.topic}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-bold text-slate-900 text-xs group-hover:text-sky-600 transition line-clamp-1">
                            {ticket.subject}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {ticket.message}
                          </p>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusCfg.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass}`} />
                          {statusCfg.label}
                        </span>
                        {adminRepliesCount > 0 && (
                          <div className="mt-1 text-[10px] text-slate-500 font-medium">
                            {adminRepliesCount} phản hồi{" "}
                            {anyEmailSent && (
                              <span className="text-emerald-600 font-bold">· ✓ Mail</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs text-slate-500">
                        <div>{new Date(ticket.createdAt).toLocaleDateString("vi-VN")}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(ticket.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition shadow-2xs cursor-pointer"
                        >
                          <span>Xem & Phản hồi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Trang <strong>{pagination.page}</strong> / {pagination.totalPages} (Tổng{" "}
              {pagination.total} phiếu)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <TicketDetailAndReplyModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={(updated) => setSelectedTicket(updated)}
      />
    </div>
  );
}
