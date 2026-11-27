"use client";

import { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useAuth } from "@/lib/context/AuthContext";
import { useAdminFinancialSummary } from "../../queries/useAdminDashboardQueries";
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
  const financialSummary = useAdminFinancialSummary(user?._id);
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
  const refreshing = [query, totals, pending, processing, completed, financialSummary].some(
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
      financialSummary.refetch(),
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
  const financialData = financialSummary.data;
  const financialCards = [
    {
      label: "Tiền nạp xu thành công",
      amount: financialData?.successfulTopUps,
      hint: "Tổng tiền từ các giao dịch nạp xu thành công",
      icon: "coins",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Nhuận bút đã chi",
      amount: financialData?.paidRoyalties,
      hint: "Các yêu cầu đã xác nhận thanh toán",
      icon: "bank",
      color: "bg-admin-brand-50 text-admin-brand-600",
    },
    {
      label: "Nhuận bút đang chờ chi",
      amount: financialData?.pendingRoyalties,
      hint: "Gồm yêu cầu chờ duyệt và đang xử lý",
      icon: "clock",
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Chênh lệch nạp và chi",
      amount: financialData && financialData.successfulTopUps - financialData.paidRoyalties,
      hint: "Tiền nạp thành công trừ nhuận bút đã chi",
      icon: "wallet",
      color: "bg-gray-100 text-gray-600",
    },
  ] as const;
  const cards = [
    {
      label: "Tổng yêu cầu",
      hint: "Tất cả trạng thái",
      query: totals,
      value: "",
      icon: "wallet",
      color: "text-admin-brand-600 bg-admin-brand-50",
      border: "border-admin-brand-200",
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
      color: "text-admin-brand-600 bg-admin-brand-50",
      border: "border-admin-brand-200",
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
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-admin-brand-600">
            <RevenueIcon name="bank" className="h-3.5 w-3.5" />
            Quản lý thanh toán
          </div>
          <h1 className="admin-page-title text-2xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
            Rút nhuận bút tác giả
          </h1>
          <p className="mt-1.5 text-xs leading-5 text-gray-500 sm:text-sm">
            Xét duyệt yêu cầu, thực hiện chuyển khoản và theo dõi lịch sử xử lý.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-admin-brand-200/70 bg-white px-3 py-1.5 text-xs font-semibold text-admin-brand-600">
            <span className="h-1.5 w-1.5 rounded-full bg-admin-brand-400" />
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
      <section aria-labelledby="withdrawals-financial-summary" className="space-y-3">
        <div>
          <h2 id="withdrawals-financial-summary" className="text-base font-semibold text-gray-900">
            Đối soát tài chính
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Số liệu toàn hệ thống từ trước đến nay. Bộ lọc bên dưới áp dụng cho danh sách yêu cầu.
          </p>
        </div>
        {financialSummary.isError && (
          <p role="alert" className="text-sm text-red-600">Không thể tải số liệu tài chính. Chọn Làm mới để thử lại.</p>
        )}
        <dl
          aria-busy={financialSummary.isFetching}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {financialCards.map((card) => (
            <div key={card.label} className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-admin-card sm:p-5">
              <dt className="mb-3 flex items-center justify-between gap-2 text-sm font-medium text-gray-600">
                {card.label}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                  <RevenueIcon name={card.icon} />
                </span>
              </dt>
              <dd className="text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
                {financialSummary.isError || card.amount === undefined ? "—" : money(card.amount)}
              </dd>
              <dd className="mt-1 text-xs leading-5 text-gray-500">{card.hint}</dd>
            </div>
          ))}
        </dl>
      </section>
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
            className={`min-w-0 rounded-lg border bg-white p-4 text-left shadow-admin-card transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand-400 sm:p-5 ${status === card.value ? card.border : "border-gray-200 hover:border-gray-300"}`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-500">
                {card.label}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${card.color}`}
              >
                <RevenueIcon name={card.icon} />
              </span>
            </div>
            {card.query.isPending ? (
              <div className="h-8 w-16 animate-pulse rounded bg-gray-100" />
            ) : (
              <p className="text-2xl font-medium tracking-tight text-gray-900 tabular-nums sm:text-3xl">
                {card.query.isError
                  ? "—"
                  : (card.query.data?.pagination.totalItems.toLocaleString(
                      "vi-VN",
                    ) ?? "—")}
              </p>
            )}
            <p className="mt-2 text-xs leading-5 text-gray-400">
              {card.query.isError ? "Chưa tải được thống kê" : card.hint}
            </p>
          </button>
        ))}
      </section>
      <p className="text-xs text-gray-400">
        Số lượng yêu cầu theo tác giả và khoảng ngày đang lọc.
      </p>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-admin-card">
        <div
          className="flex gap-1 overflow-x-auto border-b border-gray-100 px-4 pt-2"
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
              className={`relative flex min-h-12 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-brand-400 ${status === tab.value ? "border-admin-brand-500 text-admin-brand-600" : "border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-800"}`}
            >
              {tab.label}
              {tab.value === "PENDING" &&
                !pending.isError &&
                Boolean(pending.data?.pagination.totalItems) && (
                  <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
                    {pending.data?.pagination.totalItems}
                  </span>
                )}
            </button>
          ))}
        </div>
        <div className="admin-filter-bar grid items-end gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_auto]">
          <label className="space-y-1.5 text-xs font-medium text-gray-500">
            Tìm tác giả hoặc yêu cầu
            <div className="relative">
              <RevenueIcon
                name="search"
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400"
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
          <label className="space-y-1.5 text-xs font-medium text-gray-500">
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
          <label className="space-y-1.5 text-xs font-medium text-gray-500">
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
              <h2 className="text-sm font-semibold text-gray-900">
                {status ? statusLabels[status] : "Tất cả yêu cầu"}
              </h2>
              {query.data && !query.isError && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                  {query.data.pagination.totalItems.toLocaleString("vi-VN")}
                </span>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              Hiển thị
              <select
                aria-label="Số yêu cầu mỗi trang"
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-admin-brand-100"
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
              <table className="admin-data-table w-full min-w-[1000px] text-left">
                <thead className="border-y border-gray-100 bg-gray-50/70">
                  <tr>
                    <th className={revenueHead}>Tác giả</th>
                    <th className={revenueHead}>Yêu cầu / Ngày gửi</th>
                    <th className={revenueHead}>Tài khoản nhận</th>
                    <th className={`${revenueHead} text-right`}>Thực nhận</th>
                    <th className={revenueHead}>Trạng thái</th>
                    <th className={`${revenueHead} text-right`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {query.data.items.map((request) => {
                    const author =
                      typeof request.authorId === "string"
                        ? null
                        : request.authorId;
                    const name =
                      author?.displayName ||
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
                        className="transition hover:bg-admin-brand-50/25"
                      >
                        <td className={revenueCell}>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-admin-brand-50 text-xs font-medium text-admin-brand-600">
                              {name.slice(0, 1).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p
                                className="max-w-40 truncate text-xs font-semibold text-gray-800"
                                title={name}
                              >
                                {name}
                              </p>
                              <p
                                className="mt-1 max-w-40 truncate text-xs text-gray-400"
                                title={author?.email}
                              >
                                {author?.email ||
                                  "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={revenueCell}>
                          <button
                            className="font-mono text-sm font-semibold text-gray-600 hover:text-admin-brand-600"
                            title={request._id}
                            onClick={() => open(request)}
                          >
                            #{request._id.slice(-8).toUpperCase()}
                          </button>
                          <p className="mt-1.5 whitespace-nowrap text-xs text-gray-400">
                            {dateTime(request.createdAt)}
                          </p>
                        </td>
                        <td className={revenueCell}>
                          <p
                            className="max-w-40 truncate text-xs font-medium text-gray-700"
                            title={request.bankName}
                          >
                            {request.bankName}
                          </p>
                          <p className="mt-1.5 text-xs text-gray-400">
                            ••••{" "}
                            {request.bankAccountNumber
                              .replace(/\s/g, "")
                              .slice(-4)}
                          </p>
                        </td>
                        <td
                          className={`${revenueCell} whitespace-nowrap text-right`}
                        >
                          <p className="text-sm font-medium text-gray-900 tabular-nums">
                            {money(request.amount)}
                          </p>
                          <p className="mt-1 text-xs text-gray-400 tabular-nums">
                            {coins(request.coinAmount)}
                          </p>
                        </td>
                        <td className={revenueCell}>
                          <WithdrawalBadge status={request.status} />
                          {request.status === "PROCESSING" && handlerId && (
                            <p className="mt-1.5 text-xs text-gray-400">
                              {handlerId === user?._id
                                ? "Bạn đang phụ trách"
                                : "Quản lý đã tiếp nhận"}
                            </p>
                          )}
                          {request.status === "REJECTED" && request.note && (
                            <p
                              className="mt-1.5 max-w-36 truncate text-xs text-rose-500"
                              title={request.note}
                            >
                              {request.note}
                            </p>
                          )}
                        </td>
                        <td className={`${revenueCell} text-right`}>
                          <button
                            aria-label={`Xem yêu cầu ${request._id.slice(-8)}`}
                            className={`inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand-400 ${request.status === "PENDING" ? "bg-admin-brand-600 text-white hover:bg-admin-brand-700" : request.status === "PROCESSING" ? "border border-admin-brand-200 bg-admin-brand-50 text-admin-brand-700 hover:bg-admin-brand-100" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
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
      <div className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs leading-5 text-gray-500">
        <RevenueIcon
          name="info"
          className="mt-0.5 h-4 w-4 shrink-0 text-admin-brand-400"
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
