"use client";

import { useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useWithdrawals } from "./queries";
import { coins, dateTime, money, statusLabels } from "./types";
import { WithdrawalDetail } from "./WithdrawalDetail";
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
} from "./RevenueUi";

export function WithdrawalList({ admin = false }: { admin?: boolean }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const debounced = useDebounce(search, 350);
  const query = useWithdrawals(admin, {
    page,
    limit: 10,
    status,
    search: debounced,
    startDate,
    endDate,
  });
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex items-start justify-between gap-3 px-5 py-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {admin ? "Danh sách yêu cầu rút nhuận bút" : "Yêu cầu rút tiền"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {admin
              ? "Theo dõi và xử lý các yêu cầu chuyển khoản cho tác giả."
              : "Theo dõi tiến trình xét duyệt và kết quả thanh toán của từng yêu cầu."}
          </p>
        </div>
        <button
          className={revenueButton}
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          <RevenueIcon
            name="refresh"
            className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`}
          />
          Làm mới
        </button>
      </div>
      <div
        className={`grid items-end gap-3 border-y border-slate-100 bg-slate-50/60 px-5 py-3 sm:grid-cols-2 ${admin ? "lg:grid-cols-4" : "lg:grid-cols-[1.25fr_1fr_1fr_auto]"}`}
      >
        {admin && (
          <label className="space-y-1.5 text-[11px] font-medium text-slate-500">
            Tìm kiếm
            <div className="relative">
              <RevenueIcon
                name="search"
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
              />
              <input
                aria-label="Tìm tác giả hoặc mã yêu cầu"
                placeholder="Tác giả, email, mã yêu cầu…"
                className={`${revenueField} pl-9`}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </label>
        )}
        <label className="space-y-1.5 text-[11px] font-medium text-slate-500">
          Trạng thái
          <select
            aria-label="Trạng thái yêu cầu"
            className={revenueField}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-[11px] font-medium text-slate-500">
          Từ ngày
          <input
            type="date"
            className={revenueField}
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
            type="date"
            className={revenueField}
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
          />
        </label>
        {!admin && (status || startDate || endDate) && (
          <button
            className={revenueButton}
            onClick={() => {
              setStatus("");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
      {query.isPending ? (
        <RevenueLoading />
      ) : query.isError ? (
        <RevenueEmpty
          error
          title="Không tải được yêu cầu"
          description="Vui lòng thử lại để xem trạng thái và kết quả xử lý."
          action={
            <button className={revenueButton} onClick={() => query.refetch()}>
              Thử lại
            </button>
          }
        />
      ) : !query.data?.items.length ? (
        <RevenueEmpty
          title="Chưa có yêu cầu phù hợp"
          description={
            status || startDate || endDate
              ? "Thay đổi bộ lọc để xem các yêu cầu khác."
              : "Các yêu cầu rút nhuận bút sẽ được lưu và theo dõi tại đây."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className={revenueHead}>
                  {admin ? "Tác giả / Mã yêu cầu" : "Mã yêu cầu"}
                </th>
                <th className={revenueHead}>Ngày gửi</th>
                <th className={`${revenueHead} text-right`}>Xu quyết toán</th>
                <th className={`${revenueHead} text-right`}>Thực nhận</th>
                <th className={revenueHead}>Trạng thái</th>
                <th className={revenueHead}>
                  <span className="sr-only">Chi tiết yêu cầu</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {query.data.items.map((request) => (
                <tr key={request._id} className="hover:bg-slate-50/70">
                  <td className={revenueCell}>
                    {admin && typeof request.authorId !== "string" && (
                      <p className="mb-1.5 text-xs font-semibold text-slate-800">
                        {request.authorId?.displayName ||
                          request.authorId?.username ||
                          "Tài khoản đã xóa"}
                      </p>
                    )}
                    <button
                      title={request._id}
                      onClick={() => setSelected(request._id)}
                      className="font-mono text-xs font-semibold tracking-wide text-slate-600 hover:text-sky-700"
                    >
                      #{request._id.slice(-8).toUpperCase()}
                    </button>
                  </td>
                  <td
                    className={`${revenueCell} whitespace-nowrap text-[11px] text-slate-500`}
                  >
                    {dateTime(request.createdAt)}
                  </td>
                  <td
                    className={`${revenueCell} whitespace-nowrap text-right text-xs text-slate-600 tabular-nums`}
                  >
                    {coins(request.coinAmount)}
                  </td>
                  <td
                    className={`${revenueCell} whitespace-nowrap text-right text-sm font-bold text-slate-900 tabular-nums`}
                  >
                    {money(request.amount)}
                  </td>
                  <td className={revenueCell}>
                    <WithdrawalBadge status={request.status} />
                  </td>
                  <td className={`${revenueCell} text-right`}>
                    <button
                      aria-label={`Xem yêu cầu ${request._id.slice(-8)}`}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-700"
                      onClick={() => setSelected(request._id)}
                    >
                      <RevenueIcon name="chevron" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!query.isPending && !query.isError && (
        <RevenuePagination
          page={query.data?.pagination.page ?? page}
          totalPages={query.data?.pagination.totalPages ?? 1}
          totalItems={query.data?.pagination.totalItems ?? 0}
          pageSize={10}
          onPage={setPage}
          disabled={query.isFetching}
        />
      )}
      {selected && (
        <WithdrawalDetail
          key={selected}
          id={selected}
          admin={admin}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
