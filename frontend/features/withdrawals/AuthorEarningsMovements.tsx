"use client";

import { useState } from "react";
import { useMovements } from "./queries";
import { coins, dateTime, statusLabels } from "./types";
import { WithdrawalDetail } from "./WithdrawalDetail";
import {
  RevenueEmpty,
  RevenueIcon,
  RevenueLoading,
  RevenuePagination,
  revenueButton,
  revenueCell,
  revenueField,
  revenueHead,
} from "./RevenueUi";

export function AuthorEarningsMovements() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const query = useMovements({ page, limit: 10, startDate, endDate });
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex items-start justify-between gap-3 px-5 py-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Lịch sử biến động
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi Xu phát sinh, khoản giữ để rút và các lần quyết toán.
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
      <div className="flex flex-wrap items-end gap-3 border-y border-slate-100 bg-slate-50/60 px-5 py-3">
        <label className="min-w-36 flex-1 space-y-1.5 text-[11px] font-medium text-slate-500 sm:max-w-48">
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
        <label className="min-w-36 flex-1 space-y-1.5 text-[11px] font-medium text-slate-500 sm:max-w-48">
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
        {(startDate || endDate) && (
          <button
            className={revenueButton}
            onClick={() => {
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
          title="Không tải được biến động"
          description="Vui lòng tải lại để xem lịch sử thay đổi số dư."
          action={
            <button className={revenueButton} onClick={() => query.refetch()}>
              Thử lại
            </button>
          }
        />
      ) : !query.data?.items.length ? (
        <RevenueEmpty
          title="Chưa có biến động"
          description="Các lượt mua chương và thay đổi từ yêu cầu rút tiền sẽ được ghi nhận tại đây."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className={revenueHead}>Hoạt động</th>
                <th className={`${revenueHead} text-right`}>Xu khả dụng</th>
                <th className={`${revenueHead} text-right`}>Xu đang giữ</th>
                <th className={`${revenueHead} text-right`}>Thời gian</th>
                <th className={revenueHead}>
                  <span className="sr-only">Chi tiết</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {query.data.items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/70">
                  <td className={revenueCell}>
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.type === "REVENUE" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}
                      >
                        <RevenueIcon
                          name={item.type === "REVENUE" ? "coins" : "history"}
                          className="h-3.5 w-3.5"
                        />
                      </span>
                      <div className="max-w-64">
                        <p className="text-xs font-semibold text-slate-800">
                          {item.type === "REVENUE"
                            ? "Độc giả mua chương"
                            : statusLabels[item.type]}
                        </p>
                        <p
                          className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-400"
                          title={item.note}
                        >
                          {item.note || "Cập nhật trạng thái yêu cầu"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`${revenueCell} whitespace-nowrap text-right text-xs font-semibold tabular-nums ${item.coinDelta > 0 ? "text-emerald-600" : item.coinDelta < 0 ? "text-rose-600" : "text-slate-400"}`}
                  >
                    {item.coinDelta === 0
                      ? "—"
                      : `${item.coinDelta > 0 ? "+" : ""}${coins(item.coinDelta)}`}
                  </td>
                  <td
                    className={`${revenueCell} whitespace-nowrap text-right text-xs tabular-nums ${item.reservedDelta === 0 ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {item.reservedDelta === 0
                      ? "—"
                      : `${item.reservedDelta > 0 ? "+" : ""}${coins(item.reservedDelta)}`}
                  </td>
                  <td
                    className={`${revenueCell} whitespace-nowrap text-right text-[11px] text-slate-500`}
                  >
                    {dateTime(item.at)}
                  </td>
                  <td className={revenueCell}>
                    {item.requestId && (
                      <button
                        aria-label="Xem yêu cầu rút tiền liên quan"
                        className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 hover:text-sky-700"
                        onClick={() => setSelected(item.requestId!)}
                      >
                        <RevenueIcon name="chevron" />
                      </button>
                    )}
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
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
