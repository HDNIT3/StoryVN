"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { useMyTransactions } from "@/features/payments/queries/usePaymentQueries";
import { PaymentHistoryRow } from "@/features/payments/components/PaymentHistoryRow";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import { useMyWallet } from "../queries/useWalletQueries";

function formatCoins(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

interface WalletStatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}

function WalletStatCard({ label, value, hint, icon }: WalletStatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
          {icon}
        </span>
        <p className="text-xs font-semibold text-zinc-500">{label}</p>
      </div>
      <p className="mt-3 text-lg font-bold tabular-nums text-zinc-900 sm:text-xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-zinc-400">{hint}</p>
    </div>
  );
}

export function WalletView() {
  const { user } = useAuth();
  const {
    data: wallet,
    isLoading,
    isError,
    refetch,
  } = useMyWallet();

  const {
    data: recentData,
    isLoading: isRecentLoading,
    isError: isRecentError,
  } = useMyTransactions({ page: 1, limit: 5 });

  const recentItems = recentData?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex select-none items-center gap-2 text-xs font-medium text-zinc-500"
      >
        <Link
          href="/ho-so"
          className="inline-flex items-center gap-1 transition-colors hover:text-zinc-900"
        >
          <span>← Hồ sơ cá nhân</span>
        </Link>
        <span aria-hidden className="text-zinc-300">
          /
        </span>
        <span className="font-semibold text-zinc-900">Ví của tôi</span>
      </nav>

      {isLoading ? (
        <>
          <div className="h-56 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-32 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
            <div className="h-32 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
          </div>
        </>
      ) : isError || !wallet ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-2xs">
          <p className="text-sm font-semibold text-red-600">Không thể tải thông tin ví</p>
          <p className="mt-1 text-xs text-zinc-500">
            Vui lòng kiểm tra kết nối mạng và thử lại.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 cursor-pointer rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-200"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* Thẻ ví chính */}
          <section className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-6 shadow-xs sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-amber-200/50 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl"
            />

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Ví hoạt động
                  </span>
                  {user?.displayName && (
                    <span className="text-xs text-zinc-500">
                      Xin chào, <strong className="font-semibold text-zinc-700">{user.displayName}</strong>
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Số dư hiện tại
                </p>
                <div className="mt-1 flex items-end gap-2">
                  <span className="text-4xl font-black leading-none tabular-nums text-zinc-900 sm:text-5xl">
                    {formatCoins(wallet.balance)}
                  </span>
                  <span className="mb-1 text-sm font-bold text-amber-600">Xu</span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Cập nhật {formatRelativeTime(wallet.updatedAt)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/nap-xu"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 sm:text-sm"
                >
                  <Image
                    src="/icon/coin.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="h-4 w-4 object-contain brightness-0 invert"
                  />
                  Nạp thêm Xu
                </Link>
                <Link
                  href="/tai-khoan/lich-su-thanh-toan"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 sm:text-sm"
                >
                  Lịch sử thanh toán
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Thống kê ví */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <WalletStatCard
              label="Tổng Xu đã dùng"
              value={`${formatCoins(wallet.totalSpent)} Xu`}
              hint="Dùng để mở khóa chương truyện trả phí"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
            />
            <WalletStatCard
              label="Cập nhật gần nhất"
              value={formatDateTime(wallet.updatedAt)}
              hint="Thời điểm ví có thay đổi gần nhất"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </div>

          {/* Giao dịch gần đây */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-4 sm:px-5">
              <div>
                <h2 className="font-serif text-base font-bold text-zinc-900 sm:text-lg">
                  Giao dịch gần đây
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  5 giao dịch nạp Xu mới nhất của bạn
                </p>
              </div>
              <Link
                href="/tai-khoan/lich-su-thanh-toan"
                className="shrink-0 text-xs font-semibold text-sky-600 transition-colors hover:text-sky-700"
              >
                Xem tất cả →
              </Link>
            </div>

            {isRecentLoading ? (
              <div className="divide-y divide-zinc-100">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="flex animate-pulse items-center gap-4 px-5 py-4">
                    <div className="h-10 w-10 rounded-xl bg-zinc-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-40 rounded bg-zinc-100" />
                      <div className="h-3 w-28 rounded bg-zinc-100" />
                    </div>
                    <div className="hidden h-3.5 w-24 rounded bg-zinc-100 sm:block" />
                  </div>
                ))}
              </div>
            ) : isRecentError ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-500">
                Không thể tải giao dịch gần đây.
              </div>
            ) : recentItems.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-200">
                  <Image
                    src="/icon/coin.svg"
                    alt=""
                    width={26}
                    height={26}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <p className="text-sm font-semibold text-zinc-800">Chưa có giao dịch nạp Xu</p>
                <p className="mt-1 max-w-xs text-xs text-zinc-500">
                  Nạp Xu để mở khóa các chương truyện VIP và ủng hộ tác giả yêu thích.
                </p>
                <Link
                  href="/nap-xu"
                  className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                >
                  Nạp Xu ngay
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {recentItems.map((item) => (
                  <PaymentHistoryRow key={item._id} item={item} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default WalletView;
