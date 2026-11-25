"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useWithdrawalAction } from "./queries";
import { coins, money } from "./types";
import type { Earnings } from "./types";
import { WithdrawalDetail } from "./WithdrawalDetail";
import {
  RevenueDialog,
  RevenueIcon,
  RevenueEmpty,
  WithdrawalBadge,
  revenueButton,
  revenuePrimary,
} from "./RevenueUi";

export function EarningsSummary({
  data,
  loading,
}: {
  data?: Earnings;
  loading: boolean;
}) {
  const stats = [
    {
      label: "Tổng Xu doanh thu",
      value: data ? coins(data.totalCoins) : "—",
      hint: "Từ độc giả mở khóa chương",
      icon: "coins",
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Số dư khả dụng",
      value: data ? coins(data.availableCoins) : "—",
      hint: data
        ? `Thực nhận ${money(data.availableAmount)}`
        : "Chờ cập nhật số dư",
      icon: "wallet",
      color: "text-sky-600 bg-sky-50",
    },
    {
      label: "Đang chờ rút",
      value: data ? coins(data.reservedCoins) : "—",
      hint: data
        ? `Tương đương ${money(data.pendingAmount)}`
        : "Yêu cầu đang được xử lý",
      icon: "clock",
      color: "text-amber-700 bg-amber-50",
    },
    {
      label: "Đã quyết toán",
      value: data ? coins(data.completedCoins) : "—",
      hint: data
        ? `Đã nhận ${money(data.paidAmount)}`
        : "Các yêu cầu đã thanh toán",
      icon: "check",
      color: "text-emerald-600 bg-emerald-50",
    },
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{stat.label}</p>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${stat.color}`}
            >
              <RevenueIcon name={stat.icon} />
            </span>
          </div>
          {loading ? (
            <>
              <div className="h-7 w-3/4 animate-pulse rounded bg-zinc-100" />
              <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-zinc-100" />
            </>
          ) : (
            <>
              <p className="break-words text-xl font-bold tracking-tight text-zinc-900 tabular-nums sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">
                {stat.hint}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function AuthorWithdrawalsPanel({
  data,
  loading,
  error,
  refreshing,
  onRefresh,
  onShowRequests,
}: {
  data?: Earnings;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onShowRequests: () => void;
}) {
  const action = useWithdrawalAction();
  const requestKey = useRef<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const create = async () => {
    requestKey.current ??= crypto.randomUUID();
    try {
      const request = await action.mutateAsync({
        path: "/authors/me/withdrawals",
        body: { idempotencyKey: requestKey.current },
      });
      requestKey.current = null;
      setConfirm(false);
      setSelected(request._id);
    } catch {
      onRefresh();
    }
  };
  if (loading)
    return (
      <div className="grid animate-pulse gap-4 lg:grid-cols-5">
        <div className="h-64 rounded-lg bg-zinc-100 lg:col-span-3" />
        <div className="h-64 rounded-lg bg-zinc-100 lg:col-span-2" />
      </div>
    );
  if (error || !data)
    return (
      <div className="rounded-lg border border-zinc-200 bg-white">
        <RevenueEmpty
          error
          title="Chưa tải được số dư"
          description="Vui lòng thử lại để xem nhuận bút và thông tin nhận tiền."
          action={
            <button className={revenueButton} onClick={onRefresh}>
              Thử lại
            </button>
          }
        />
      </div>
    );
  const progress = Math.min(
    100,
    (data.availableAmount / data.policy.minimumAmount) * 100,
  );
  return (
    <>
      <div className="grid items-stretch gap-4 lg:grid-cols-5">
        <section className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xs lg:col-span-3">
          <div className="flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold tracking-wider text-zinc-500">
                NHUẬN BÚT KHẢ DỤNG
              </span>
              <button
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-sky-50 hover:text-sky-600 disabled:opacity-40"
                aria-label="Cập nhật số dư"
                disabled={refreshing}
                onClick={onRefresh}
              >
                <RevenueIcon
                  name="refresh"
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            <p className="mt-3 break-words text-2xl font-bold tracking-tight text-zinc-900 tabular-nums sm:text-3xl">
              {money(data.availableAmount)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Số tiền thực nhận từ{" "}
              <strong className="font-semibold text-zinc-700">
                {coins(data.availableCoins)}
              </strong>{" "}
              khả dụng
            </p>
            {data.activeRequest ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-sky-200 bg-sky-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <WithdrawalBadge status={data.activeRequest.status} />
                  <span className="text-xs text-zinc-600">
                    Bạn có một yêu cầu đang mở.
                  </span>
                </div>
                <button
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
                  onClick={() => setSelected(data.activeRequest!._id)}
                >
                  Xem chi tiết{" "}
                  <RevenueIcon name="arrow" className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-zinc-500">Ngưỡng rút tối thiểu</span>
                  <span className="font-semibold text-zinc-700">
                    {money(data.policy.minimumAmount)}
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-zinc-100"
                  role="progressbar"
                  aria-label="Tiến độ đạt ngưỡng rút"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-sky-500 transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                  {data.availableAmount < data.policy.minimumAmount
                    ? `Cần thêm ${money(data.policy.minimumAmount - data.availableAmount)} thực nhận để gửi yêu cầu.`
                    : "Số dư của bạn đã đạt ngưỡng rút tối thiểu."}
                </p>
              </div>
            )}
            {data.reconciliationRequired && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
              >
                Doanh thu cần được đối soát. Vui lòng liên hệ quản lý.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/50 p-4 sm:px-5">
            <button
              className="text-xs font-semibold text-zinc-500 hover:text-sky-700"
              onClick={onShowRequests}
            >
              Lịch sử rút tiền
            </button>
            <button
              className={revenuePrimary}
              disabled={!data.canWithdraw || action.isPending}
              onClick={() => {
                requestKey.current = null;
                setConfirm(true);
              }}
            >
              <RevenueIcon name="wallet" /> Rút toàn bộ{" "}
              <RevenueIcon name="arrow" />
            </button>
          </div>
        </section>
        <section className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs sm:p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900">
              Tài khoản nhận tiền
            </h2>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
              <RevenueIcon name="bank" />
            </span>
          </div>
          {data.bankReady ? (
            <>
              <div className="flex-1 rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-semibold text-zinc-500">
                  {data.bank.bankName}
                </p>
                <p className="mt-3 break-all font-mono text-lg font-semibold tracking-wide text-zinc-900">
                  {data.bank.bankAccountNumber}
                </p>
                <p className="mt-2 text-xs font-medium text-zinc-600">
                  {data.bank.bankAccountName}
                </p>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-zinc-400">
                Thông tin này được chốt khi bạn gửi yêu cầu rút tiền.
              </p>
            </>
          ) : (
            <div className="flex-1 rounded-md border border-dashed border-amber-200 bg-amber-50/60 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Chưa có đủ thông tin ngân hàng
              </p>
              <p className="mt-2 text-xs leading-5 text-amber-700">
                Bổ sung ngân hàng, số tài khoản và tên chủ tài khoản trong hồ sơ
                trước khi gửi yêu cầu.
              </p>
            </div>
          )}
          <Link
            href="/ho-so/chinh-sua"
            className={`${revenueButton} mt-4 w-full`}
          >
            {data.bankReady
              ? "Cập nhật tài khoản"
              : "Bổ sung tài khoản ngân hàng"}
            <RevenueIcon name="arrow" className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
      {confirm && (
        <RevenueDialog
          title="Xác nhận rút nhuận bút"
          subtitle="Kiểm tra số tiền và tài khoản nhận trước khi gửi yêu cầu."
          busy={action.isPending}
          onClose={() => setConfirm(false)}
          footer={
            <>
              <button
                className={revenueButton}
                disabled={action.isPending}
                onClick={() => setConfirm(false)}
              >
                Quay lại
              </button>
              <button
                className={revenuePrimary}
                disabled={action.isPending || !data.canWithdraw}
                onClick={create}
              >
                {action.isPending
                  ? "Đang gửi yêu cầu…"
                  : "Xác nhận gửi yêu cầu"}
                <RevenueIcon name="arrow" />
              </button>
            </>
          }
        >
          <div className="mb-5 rounded-lg bg-sky-50 p-5 text-center">
            <p className="text-xs font-medium text-sky-700">
              Số tiền bạn thực nhận
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {money(data.availableAmount)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Quyết toán toàn bộ {coins(data.availableCoins)}
            </p>
          </div>
          <dl className="divide-y divide-zinc-200 text-sm">
            {[
              ["Xu yêu cầu rút", coins(data.availableCoins)],
              [
                "Giá trị quy đổi",
                money(data.availableCoins * data.policy.exchangeRate),
              ],
              [
                `Phần nền tảng (${100 - data.policy.payoutPercent}%)`,
                money(
                  data.availableCoins * data.policy.exchangeRate -
                    data.availableAmount,
                ),
              ],
              [
                `Thực nhận (${data.policy.payoutPercent}%)`,
                money(data.availableAmount),
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3">
                <dt className="text-zinc-500">{label}</dt>
                <dd className="text-right font-semibold text-zinc-900 tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-zinc-200 p-4">
            <span className="rounded-lg bg-zinc-100 p-2 text-zinc-500">
              <RevenueIcon name="bank" />
            </span>
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-zinc-800">
                {data.bank.bankName}
              </p>
              <p className="mt-1 break-all text-zinc-600">
                {data.bank.bankAccountNumber}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {data.bank.bankAccountName}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Xu kiếm thêm sau khi gửi sẽ được tính cho lần rút tiếp theo. Bạn có
            thể hủy yêu cầu khi còn ở trạng thái chờ duyệt.
          </p>
        </RevenueDialog>
      )}
      {selected && (
        <WithdrawalDetail
          key={selected}
          id={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
