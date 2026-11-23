"use client";

import { useState } from "react";
import type { AuthorStoryRevenueBreakdown } from "../../types";
import { coins } from "@/features/withdrawals/types";
import {
  RevenueEmpty,
  RevenueIcon,
  RevenuePagination,
  revenueCell,
  revenueHead,
} from "@/features/withdrawals/RevenueUi";

export function AuthorRevenueBreakdownCard({
  breakdown,
  selectedStoryId,
  onSelectStory,
  totalCoins,
}: {
  breakdown: AuthorStoryRevenueBreakdown[];
  selectedStoryId?: string;
  onSelectStory: (storyId: string | undefined) => void;
  totalCoins: number;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(breakdown.length / pageSize));
  const visiblePage = Math.min(page, totalPages);
  const items = breakdown.slice(
    (visiblePage - 1) * pageSize,
    visiblePage * pageSize,
  );
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Doanh thu theo tác phẩm
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Chọn một tác phẩm để xem các lượt mở khóa chương.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
          {coins(totalCoins)} doanh thu
        </span>
      </div>
      {!items.length ? (
        <RevenueEmpty
          title="Chưa có doanh thu từ tác phẩm"
          description="Khi có độc giả mua chương, bạn sẽ thấy nguồn thu của từng tác phẩm tại đây."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead className="border-y border-slate-100 bg-slate-50/60">
              <tr>
                <th className={revenueHead}>Tác phẩm</th>
                <th className={`${revenueHead} text-right`}>Lượt mua</th>
                <th className={`${revenueHead} text-right`}>Doanh thu Xu</th>
                <th className={revenueHead}>Tỷ trọng</th>
                <th className={revenueHead}>
                  <span className="sr-only">Xem chi tiết</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const percent = totalCoins
                  ? (item.totalCoins / totalCoins) * 100
                  : 0;
                return (
                  <tr
                    key={item.storyId}
                    className={
                      selectedStoryId === item.storyId
                        ? "bg-sky-50/60"
                        : "hover:bg-slate-50/70"
                    }
                  >
                    <td className={revenueCell}>
                      <button
                        onClick={() => onSelectStory(item.storyId)}
                        className="flex max-w-sm items-center gap-3 text-left"
                      >
                        <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md border border-amber-200/60 bg-amber-50 text-[11px] font-semibold text-amber-700">
                          {String(
                            (visiblePage - 1) * pageSize + index + 1,
                          ).padStart(2, "0")}
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-1 text-xs font-semibold text-slate-800 hover:text-sky-700">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-[11px] text-slate-400">
                            {item.chapterCount} chương
                          </span>
                        </span>
                      </button>
                    </td>
                    <td
                      className={`${revenueCell} text-right text-xs text-slate-600 tabular-nums`}
                    >
                      {item.unlockCount.toLocaleString("vi-VN")}
                    </td>
                    <td
                      className={`${revenueCell} whitespace-nowrap text-right text-xs font-bold text-amber-600 tabular-nums`}
                    >
                      {coins(item.totalCoins)}
                    </td>
                    <td className={revenueCell}>
                      <div className="min-w-24">
                        <div className="mb-1.5 text-[11px] font-semibold text-slate-500">
                          {percent.toLocaleString("vi-VN", {
                            maximumFractionDigits: 1,
                          })}
                          %
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={revenueCell}>
                      <button
                        aria-label={`Xem doanh thu ${item.title}`}
                        onClick={() => onSelectStory(item.storyId)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-700"
                      >
                        <RevenueIcon name="chevron" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <RevenuePagination
        page={visiblePage}
        totalPages={totalPages}
        totalItems={breakdown.length}
        pageSize={pageSize}
        onPage={setPage}
      />
    </section>
  );
}
