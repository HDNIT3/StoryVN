"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import { useMyWallet } from "../queries/useWalletQueries";
import { useMyTransactions } from "@/features/payments/queries/usePaymentQueries";
import type { TransactionStatus } from "@/features/payments/types";
import { PaymentHistoryRow } from "@/features/payments/components/PaymentHistoryRow";
import { PaymentHistoryEmptyState } from "@/features/payments/components/PaymentHistoryEmptyState";
import { PaymentHistoryPaginationBar } from "@/features/payments/components/PaymentHistoryPagination";
import { useChapterPurchaseHistory } from "@/features/chapters/queries/useChapterQueries";
import { ChapterPurchaseHistoryCard } from "@/features/chapters/components/purchase-history/ChapterPurchaseHistoryCard";

const STATUS_TABS: { value: TransactionStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "PENDING", label: "Đang xử lý" },
  { value: "FAILED", label: "Thất bại" },
];

const RECHARGE_PAGE_SIZE = 10;
const SPENT_PAGE_SIZE = 10;

function formatCoins(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

interface WalletStatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

function WalletStatCard({
  label,
  value,
  hint,
  icon,
  isActive,
  onClick,
}: WalletStatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-5 shadow-2xs transition-all ${
        onClick ? "cursor-pointer" : ""
      } ${
        isActive
          ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-200/50"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL tab synchronization: ?tab=nap hoặc ?tab=tieu
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"nap" | "tieu">(
    tabParam === "tieu" ? "tieu" : "nap"
  );

  useEffect(() => {
    if (tabParam === "tieu" || tabParam === "nap") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: "nap" | "tieu") => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.replace(`/vi?${params.toString()}`, { scroll: false });
  };

  // ─── Wallet Balance ───
  const {
    data: wallet,
    isLoading: isWalletLoading,
    isError: isWalletError,
    refetch: refetchWallet,
  } = useMyWallet();

  // ─── Tab 1: Nạp Xu State & Query ───
  const [rechargeSearchInput, setRechargeSearchInput] = useState("");
  const debouncedRechargeSearch = useDebounce(rechargeSearchInput, 400);
  const [rechargeStatus, setRechargeStatus] = useState<TransactionStatus | "">("");
  const [rechargePage, setRechargePage] = useState(1);

  const rechargeParams = useMemo(
    () => ({
      search: debouncedRechargeSearch.trim() || undefined,
      status: rechargeStatus || undefined,
      page: rechargePage,
      limit: RECHARGE_PAGE_SIZE,
    }),
    [debouncedRechargeSearch, rechargeStatus, rechargePage]
  );

  const {
    data: rechargeData,
    isLoading: isRechargeLoading,
    isError: isRechargeError,
    refetch: refetchRecharge,
  } = useMyTransactions(rechargeParams);

  const rechargeItems = rechargeData?.items ?? [];
  const rechargePagination = rechargeData?.pagination;
  const rechargeTotal = rechargePagination?.totalItems ?? 0;
  const rechargeTotalPages = rechargePagination?.totalPages ?? 1;
  const isFilteringRecharge = Boolean(rechargeSearchInput.trim() || rechargeStatus);

  // ─── Tab 2: Tiêu Xu (Mở khóa chương) State & Query ───
  const [spentSearchInput, setSpentSearchInput] = useState("");
  const debouncedSpentSearch = useDebounce(spentSearchInput, 400);
  const [spentPage, setSpentPage] = useState(1);

  const spentParams = useMemo(
    () => ({
      search: debouncedSpentSearch.trim() || undefined,
      page: spentPage,
      limit: SPENT_PAGE_SIZE,
    }),
    [debouncedSpentSearch, spentPage]
  );

  const {
    data: spentData,
    isLoading: isSpentLoading,
    isError: isSpentError,
    refetch: refetchSpent,
  } = useChapterPurchaseHistory(spentParams);

  const spentItems = spentData?.items ?? [];
  const spentTotal = spentData?.total ?? 0;
  const spentTotalPages = spentData?.totalPages ?? 1;
  const spentSummary = spentData?.summary ?? { totalUnlocked: 0, totalCoinsSpent: 0 };
  const isFilteringSpent = Boolean(spentSearchInput.trim());

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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

      {/* Main Wallet Hero Section */}
      {isWalletLoading ? (
        <div className="h-56 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
      ) : isWalletError || !wallet ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-2xs">
          <p className="text-sm font-semibold text-red-600">Không thể tải thông tin ví</p>
          <p className="mt-1 text-xs text-zinc-500">
            Vui lòng kiểm tra kết nối mạng và thử lại.
          </p>
          <button
            type="button"
            onClick={() => refetchWallet()}
            className="mt-4 cursor-pointer rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-200"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
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
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-amber-600 sm:text-sm"
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
              </div>
            </div>
          </section>

          {/* Quick Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <WalletStatCard
              label="Tổng Xu đã tiêu"
              value={`${formatCoins(wallet.totalSpent || spentSummary.totalCoinsSpent)} Xu`}
              hint="Dùng để mở khóa các chương truyện VIP trả phí"
              isActive={activeTab === "tieu"}
              onClick={() => handleTabChange("tieu")}
              icon={
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              label="Số chương đã mở khóa"
              value={`${formatCoins(spentSummary.totalUnlocked || spentTotal)} chương`}
              hint="Bấm để xem danh sách chương đã mua"
              isActive={activeTab === "tieu"}
              onClick={() => handleTabChange("tieu")}
              icon={
                <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              }
            />
          </div>
        </>
      )}

      {/* ─── 2 TABS SELECTION: NẠP VÀ TIÊU ─── */}
      <div className="border-b border-zinc-200">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
          {/* Tab 1: Nạp Xu */}
          <button
            type="button"
            onClick={() => handleTabChange("nap")}
            className={`group flex items-center gap-2.5 px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-2 -mb-[2px] whitespace-nowrap ${
              activeTab === "nap"
                ? "border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-xl"
                : "border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-t-xl"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                activeTab === "nap"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span>Lịch sử Nạp Xu</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "nap"
                  ? "bg-amber-200/80 text-amber-800"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {rechargeTotal}
            </span>
          </button>

          {/* Tab 2: Tiêu Xu (Mở khóa chương) */}
          <button
            type="button"
            onClick={() => handleTabChange("tieu")}
            className={`group flex items-center gap-2.5 px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-2 -mb-[2px] whitespace-nowrap ${
              activeTab === "tieu"
                ? "border-sky-500 text-sky-700 bg-sky-50/50 rounded-t-xl"
                : "border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-t-xl"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                activeTab === "tieu"
                  ? "bg-sky-100 text-sky-700"
                  : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span>Lịch sử Tiêu Xu (Mở khóa chương)</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "tieu"
                  ? "bg-sky-200/80 text-sky-800"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {spentTotal}
            </span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: NẠP XU CONTENT ─── */}
      {activeTab === "nap" && (
        <section className="space-y-4">
          {/* Header & Filter Bar for Recharge */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <span>Giao dịch nạp tiền mua Xu</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {rechargeTotal} đơn
                  </span>
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Lịch sử các đơn thanh toán nạp Xu qua VNPay và trạng thái cộng Xu vào ví.
                </p>
              </div>

              <Link
                href="/nap-xu"
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition shadow-2xs"
              >
                <span>+ Nạp Xu</span>
              </Link>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1 border-t border-zinc-100">
              {/* Status pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {STATUS_TABS.map((tab) => {
                  const isSelected = rechargeStatus === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => {
                        setRechargeStatus(tab.value);
                        setRechargePage(1);
                      }}
                      className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors shrink-0 ${
                        isSelected
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={rechargeSearchInput}
                  onChange={(e) => {
                    setRechargeSearchInput(e.target.value);
                    setRechargePage(1);
                  }}
                  placeholder="Tìm theo mã đơn hoặc gói nạp..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                {rechargeSearchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setRechargeSearchInput("");
                      setRechargePage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {isFilteringRecharge && (
                <button
                  type="button"
                  onClick={() => {
                    setRechargeSearchInput("");
                    setRechargeStatus("");
                    setRechargePage(1);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {/* List of recharge transactions */}
          {isRechargeLoading ? (
            <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs">
              {[1, 2, 3, 4].map((row) => (
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
          ) : isRechargeError ? (
            <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-2xs">
              <p className="text-sm font-semibold text-rose-600">
                Không thể tải lịch sử nạp Xu.
              </p>
              <button
                type="button"
                onClick={() => refetchRecharge()}
                className="mt-2 text-xs font-bold text-rose-700 underline cursor-pointer"
              >
                Thử lại ngay
              </button>
            </div>
          ) : rechargeItems.length === 0 ? (
            <PaymentHistoryEmptyState
              isFiltering={isFilteringRecharge}
              onResetFilters={() => {
                setRechargeSearchInput("");
                setRechargeStatus("");
                setRechargePage(1);
              }}
            />
          ) : (
            <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs">
              {rechargeItems.map((item) => (
                <PaymentHistoryRow key={item._id} item={item} />
              ))}
            </div>
          )}

          {/* Recharge Pagination */}
          <PaymentHistoryPaginationBar
            page={rechargePage}
            totalPages={rechargeTotalPages}
            totalItems={rechargeTotal}
            onPageChange={(p) => setRechargePage(p)}
          />
        </section>
      )}

      {/* ─── TAB 2: TIÊU XU (MỞ KHÓA CHƯƠNG) CONTENT ─── */}
      {activeTab === "tieu" && (
        <section className="space-y-4">
          {/* Header & Search Bar for Spent */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <span>Chương truyện đã mở khóa bằng Xu</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    {spentTotal} chương
                  </span>
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Toàn bộ các chương VIP bạn đã trả Xu mở khóa trên StoryVN. Bạn có thể bấm &quot;Đọc ngay&quot; bất cứ lúc nào mà không cần trả phí lại.
                </p>
              </div>

              <Link
                href="/truyen"
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition shadow-2xs"
              >
                <span>Khám phá thêm truyện →</span>
              </Link>
            </div>

            {/* Search input for chapters */}
            <div className="flex items-center gap-3 pt-1 border-t border-zinc-100">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={spentSearchInput}
                  onChange={(e) => {
                    setSpentSearchInput(e.target.value);
                    setSpentPage(1);
                  }}
                  placeholder="Tìm theo tên truyện, tên chương hoặc số chương..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
                {spentSearchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpentSearchInput("");
                      setSpentPage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {isFilteringSpent && (
                <button
                  type="button"
                  onClick={() => {
                    setSpentSearchInput("");
                    setSpentPage(1);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl transition cursor-pointer shrink-0"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {/* List of Chapter Purchases */}
          {isSpentLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="flex animate-pulse items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4"
                >
                  <div className="h-20 w-16 rounded-xl bg-zinc-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-zinc-100" />
                    <div className="h-3 w-32 rounded bg-zinc-100" />
                    <div className="h-3 w-24 rounded bg-zinc-100" />
                  </div>
                  <div className="h-9 w-24 rounded-xl bg-zinc-100 shrink-0" />
                </div>
              ))}
            </div>
          ) : isSpentError ? (
            <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-2xs">
              <p className="text-sm font-semibold text-rose-600">
                Không thể tải lịch sử mở khóa chương.
              </p>
              <button
                type="button"
                onClick={() => refetchSpent()}
                className="mt-2 text-xs font-bold text-rose-700 underline cursor-pointer"
              >
                Thử lại ngay
              </button>
            </div>
          ) : spentItems.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-2xs sm:p-14">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200 text-2xl">
                📖
              </div>
              <h3 className="font-serif text-base font-bold text-zinc-900 sm:text-lg">
                {isFilteringSpent
                  ? "Không tìm thấy chương truyện nào khớp từ khóa"
                  : "Chưa có chương truyện nào được mở khóa"}
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500 sm:text-sm">
                {isFilteringSpent
                  ? "Vui lòng thử tìm kiếm với tên truyện hoặc số chương khác."
                  : "Khi bạn dùng Xu để mở khóa các chương VIP trả phí, danh sách chương sẽ được lưu vĩnh viễn tại đây để bạn đọc lại bất kỳ lúc nào."}
              </p>
              <div className="mt-5">
                {isFilteringSpent ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSpentSearchInput("");
                      setSpentPage(1);
                    }}
                    className="cursor-pointer rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
                  >
                    Xóa tìm kiếm
                  </button>
                ) : (
                  <Link
                    href="/truyen"
                    className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-sky-700"
                  >
                    Khám phá truyện ngay
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {spentItems.map((item) => (
                <ChapterPurchaseHistoryCard key={item._id} item={item} />
              ))}
            </div>
          )}

          {/* Spent Pagination */}
          {spentTotalPages > 1 && (
            <div className="flex items-center justify-between gap-4 border-t border-zinc-200/80 pt-4">
              <span className="text-xs text-zinc-500 tabular-nums sm:text-sm">
                Trang <strong className="font-semibold text-zinc-800">{spentPage}</strong> / {spentTotalPages} ({spentTotal} chương)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={spentPage <= 1}
                  onClick={() => setSpentPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  disabled={spentPage >= spentTotalPages}
                  onClick={() => setSpentPage((p) => Math.min(spentTotalPages, p + 1))}
                  className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default WalletView;
