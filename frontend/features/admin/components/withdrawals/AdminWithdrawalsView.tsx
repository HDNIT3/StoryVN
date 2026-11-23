"use client";

import { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useAuth } from "@/lib/context/AuthContext";
import { useWithdrawals } from "@/features/withdrawals/queries";
import type {
  Withdrawal,
  WithdrawalStatus,
} from "@/features/withdrawals/types";
import {
  coins,
  dateTime,
  money,
  statusLabels,
} from "@/features/withdrawals/types";
import { WithdrawalDetail } from "@/features/withdrawals/WithdrawalDetail";
import {
  RevenueEmpty,
  RevenueIcon,
  RevenueLoading,
  RevenuePagination,
  WithdrawalBadge,
  revenueButton,
  revenueCell,
  revenueField,
  revenueHead,
} from "@/features/withdrawals/RevenueUi";

const STATUS_TABS = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "PROCESSING", label: "Đang xử lý" },
  { value: "COMPLETED", label: "Đã thanh toán" },
  { value: "REJECTED", label: "Đã từ chối" },
  { value: "CANCELLED", label: "Đã hủy" },
] as const;

export function AdminWithdrawalsView() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<WithdrawalStatus | "">("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<{
    id: string;
    section: "information" | "processing";
  } | null>(null);
  const debouncedSearch = useDebounce(search, 350);
  const commonFilters = { search: debouncedSearch, startDate, endDate };
  const query = useWithdrawals(true, {
    ...commonFilters,
    status,
    page,
    limit: pageSize,
  });
  const totals = useWithdrawals(true, { ...commonFilters, page: 1, limit: 1 });
  const pending = useWithdrawals(true, {
    ...commonFilters,
    status: "PENDING",
    page: 1,
    limit: 1,
  });
  const processing = useWithdrawals(true, {
    ...commonFilters,
    status: "PROCESSING",
    page: 1,
    limit: 1,
  });
  const completed = useWithdrawals(true, {
    ...commonFilters,
    status: "COMPLETED",
    page: 1,
    limit: 1,
  });
  const refreshing = [query, totals, pending, processing, completed].some(
    (item) => item.isFetching,
  );
  const reset = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setStatus("");
    setPage(1);
  };
  const changeStatus = (value: WithdrawalStatus | "") => {
    setStatus(value);
    setPage(1);
  };
  const refresh = () => {
    void Promise.all([
      query.refetch(),
      totals.refetch(),
      pending.refetch(),
      processing.refetch(),
      completed.refetch(),
    ]);
  };
  const open = (request: Withdrawal) =>
    setSelected({
      id: request._id,
      section: ["PENDING", "PROCESSING"].includes(request.status)
        ? "processing"
        : "information",
    });
  const hasFilters = Boolean(search || startDate || endDate || status);
  const cards = [
    {
      label: "Tổng yêu cầu",
      hint: "Tất cả trạng thái",
      query: totals,
      value: "",
      icon: "wallet",
      color: "text-indigo-600 bg-indigo-50",
      border: "border-indigo-200",
    },
    {
      label: "Chờ duyệt",
      hint: "Cần kiểm tra và tiếp nhận",
      query: pending,
      value: "PENDING",
      icon: "clock",
      color: "text-amber-600 bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Đang xử lý",
      hint: "Đang thực hiện chuyển khoản",
      query: processing,
      value: "PROCESSING",
      icon: "bank",
      color: "text-sky-600 bg-sky-50",
      border: "border-sky-200",
    },
    {
      label: "Đã thanh toán",
      hint: "Đã xác nhận chuyển thành công",
      query: completed,
      value: "COMPLETED",
      icon: "check",
      color: "text-emerald-600 bg-emerald-50",
      border: "border-emerald-200",
    },
  ] as const;

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-indigo-200/50 bg-linear-to-r from-indigo-500/10 via-sky-500/5 to-white p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
            <RevenueIcon name="bank" className="h-3.5 w-3.5" />
            Quản lý thanh toán
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Rút nhuận bút tác giả
          </h1>
          <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">
            Xét duyệt yêu cầu, thực hiện chuyển khoản và theo dõi lịch sử xử lý.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-indigo-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Chuyển khoản thủ công
          </span>
          <button
            className={revenueButton}
            onClick={refresh}
            disabled={refreshing}
          >
            <RevenueIcon
              name="refresh"
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        </div>
      </header>
      <section
        aria-label="Thống kê yêu cầu rút tiền"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            aria-pressed={status === card.value}
            onClick={() => changeStatus(card.value)}
            className={`min-w-0 rounded-2xl border bg-white p-4 text-left shadow-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:p-5 ${status === card.value ? card.border : "border-slate-200/80 hover:border-slate-300"}`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">
                {card.label}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${card.color}`}
              >
                <RevenueIcon name={card.icon} />
              </span>
            </div>
            {card.query.isPending ? (
              <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
                {card.query.isError
                  ? "—"
                  : (card.query.data?.pagination.totalItems.toLocaleString(
                      "vi-VN",
                    ) ?? "—")}
              </p>
            )}
            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              {card.query.isError ? "Chưa tải được thống kê" : card.hint}
            </p>
          </button>
        ))}
      </section>
      <p className="text-[11px] text-slate-400">
        Số lượng yêu cầu theo tác giả và khoảng ngày đang lọc.
      </p>
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div
          className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-2"
          role="tablist"
          aria-label="Lọc yêu cầu theo trạng thái"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const index = STATUS_TABS.findIndex((tab) => tab.value === status);
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? STATUS_TABS.length - 1
                  : (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      STATUS_TABS.length) %
                    STATUS_TABS.length;
            changeStatus(STATUS_TABS[next].value);
            document.getElementById(`admin-withdrawal-tab-${next}`)?.focus();
          }}
        >
          {STATUS_TABS.map((tab, index) => (
            <button
              key={tab.value}
              id={`admin-withdrawal-tab-${index}`}
              role="tab"
              aria-selected={status === tab.value}
              aria-controls="admin-withdrawal-results"
              tabIndex={status === tab.value ? 0 : -1}
              onClick={() => changeStatus(tab.value)}
              className={`relative flex min-h-12 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 ${status === tab.value ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-800"}`}
            >
              {tab.label}
              {tab.value === "PENDING" &&
                !pending.isError &&
                Boolean(pending.data?.pagination.totalItems) && (
                  <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                    {pending.data?.pagination.totalItems}
                  </span>
                )}
            </button>
          ))}
        </div>
        <div className="grid items-end gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_auto]">
          <label className="space-y-1.5 text-[11px] font-medium text-slate-500">
            Tìm tác giả hoặc yêu cầu
            <div className="relative">
              <RevenueIcon
                name="search"
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
              />
              <input
                className={`${revenueField} pl-9`}
                aria-label="Tìm tác giả hoặc mã yêu cầu"
                placeholder="Tên tác giả, email hoặc mã yêu cầu…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </label>
          <label className="space-y-1.5 text-[11px] font-medium text-slate-500">
            Từ ngày
            <input
              className={revenueField}
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="space-y-1.5 text-[11px] font-medium text-slate-500">
            Đến ngày
            <input
              className={revenueField}
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <button
            className={revenueButton}
            disabled={!hasFilters}
            onClick={reset}
          >
            <RevenueIcon name="close" className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </button>
        </div>
        <div
          id="admin-withdrawal-results"
          role="tabpanel"
          aria-labelledby={`admin-withdrawal-tab-${STATUS_TABS.findIndex((tab) => tab.value === status)}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                {status ? statusLabels[status] : "Tất cả yêu cầu"}
              </h2>
              {query.data && !query.isError && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {query.data.pagination.totalItems.toLocaleString("vi-VN")}
                </span>
              )}
            </div>
            <label className="flex items-center gap-2 text-[11px] text-slate-500">
              Hiển thị
              <select
                aria-label="Số yêu cầu mỗi trang"
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} / trang
                  </option>
                ))}
              </select>
            </label>
          </div>
          {query.isPending ? (
            <RevenueLoading />
          ) : query.isError ? (
            <RevenueEmpty
              error
              title="Không tải được yêu cầu"
              description="Vui lòng tải lại để tiếp tục kiểm tra và xử lý các yêu cầu rút nhuận bút."
              action={
                <button
                  className={revenueButton}
                  onClick={() => query.refetch()}
                >
                  Thử lại
                </button>
              }
            />
          ) : !query.data?.items.length ? (
            <RevenueEmpty
              title={
                hasFilters
                  ? "Không có yêu cầu phù hợp"
                  : "Chưa có yêu cầu rút nhuận bút"
              }
              description={
                hasFilters
                  ? "Thử đổi trạng thái, từ khóa hoặc khoảng ngày để xem yêu cầu khác."
                  : "Khi tác giả gửi yêu cầu, bạn có thể tiếp nhận và theo dõi việc thanh toán tại đây."
              }
              action={
                hasFilters ? (
                  <button className={revenueButton} onClick={reset}>
                    Xóa bộ lọc
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="border-y border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className={revenueHead}>Tác giả</th>
                    <th className={revenueHead}>Yêu cầu / Ngày gửi</th>
                    <th className={revenueHead}>Tài khoản nhận</th>
                    <th className={`${revenueHead} text-right`}>Thực nhận</th>
                    <th className={revenueHead}>Trạng thái</th>
                    <th className={`${revenueHead} text-right`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {query.data.items.map((request) => {
                    const author =
                      typeof request.authorId === "string"
                        ? null
                        : request.authorId;
                    const name =
                      author?.displayName ||
                      author?.username ||
                      "Tài khoản đã xóa";
                    const handler = request.history.find(
                      (event) => event.status === "PROCESSING",
                    );
                    const handlerId =
                      handler &&
                      (typeof handler.actorId === "string"
                        ? handler.actorId
                        : handler.actorId?._id);
                    return (
                      <tr
                        key={request._id}
                        className="transition hover:bg-indigo-50/25"
                      >
                        <td className={revenueCell}>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                              {name.slice(0, 1).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p
                                className="max-w-40 truncate text-xs font-semibold text-slate-800"
                                title={name}
                              >
                                {name}
                              </p>
                              <p
                                className="mt-1 max-w-40 truncate text-[11px] text-slate-400"
                                title={author?.email}
                              >
                                {author?.email ||
                                  (author?.username
                                    ? `@${author.username}`
                                    : "—")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={revenueCell}>
                          <button
                            className="font-mono text-xs font-semibold text-slate-600 hover:text-indigo-600"
                            title={request._id}
                            onClick={() => open(request)}
                          >
                            #{request._id.slice(-8).toUpperCase()}
                          </button>
                          <p className="mt-1.5 whitespace-nowrap text-[10px] text-slate-400">
                            {dateTime(request.createdAt)}
                          </p>
                        </td>
                        <td className={revenueCell}>
                          <p
                            className="max-w-40 truncate text-xs font-medium text-slate-700"
                            title={request.bankName}
                          >
                            {request.bankName}
                          </p>
                          <p className="mt-1.5 text-[11px] text-slate-400">
                            ••••{" "}
                            {request.bankAccountNumber
                              .replace(/\s/g, "")
                              .slice(-4)}
                          </p>
                        </td>
                        <td
                          className={`${revenueCell} whitespace-nowrap text-right`}
                        >
                          <p className="text-sm font-bold text-slate-900 tabular-nums">
                            {money(request.amount)}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400 tabular-nums">
                            {coins(request.coinAmount)}
                          </p>
                        </td>
                        <td className={revenueCell}>
                          <WithdrawalBadge status={request.status} />
                          {request.status === "PROCESSING" && handlerId && (
                            <p className="mt-1.5 text-[10px] text-slate-400">
                              {handlerId === user?._id
                                ? "Bạn đang phụ trách"
                                : "Quản lý đã tiếp nhận"}
                            </p>
                          )}
                          {request.status === "REJECTED" && request.note && (
                            <p
                              className="mt-1.5 max-w-36 truncate text-[10px] text-rose-500"
                              title={request.note}
                            >
                              {request.note}
                            </p>
                          )}
                        </td>
                        <td className={`${revenueCell} text-right`}>
                          <button
                            aria-label={`Xem yêu cầu ${request._id.slice(-8)}`}
                            className={`inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${request.status === "PENDING" ? "bg-indigo-600 text-white hover:bg-indigo-700" : request.status === "PROCESSING" ? "border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                            onClick={() => open(request)}
                          >
                            {request.status === "PENDING"
                              ? "Xét duyệt"
                              : request.status === "PROCESSING"
                                ? "Tiếp tục xử lý"
                                : "Chi tiết"}
                            <RevenueIcon name="chevron" className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!query.isPending && !query.isError && (
            <RevenuePagination
              page={query.data?.pagination.page ?? page}
              totalPages={query.data?.pagination.totalPages ?? 1}
              totalItems={query.data?.pagination.totalItems ?? 0}
              pageSize={pageSize}
              onPage={setPage}
              disabled={query.isFetching}
            />
          )}
        </div>
      </section>
      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-[11px] leading-5 text-slate-500">
        <RevenueIcon
          name="info"
          className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400"
        />
        <p>
          Tiếp nhận yêu cầu trước khi chuyển khoản. Chỉ xác nhận đã thanh toán
          khi kiểm tra giao dịch thành công; nếu chưa rõ kết quả, giữ trạng thái
          đang xử lý và lưu ghi chú.
        </p>
      </div>
      {selected && (
        <WithdrawalDetail
          key={selected.id}
          id={selected.id}
          admin
          initialSection={selected.section}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
