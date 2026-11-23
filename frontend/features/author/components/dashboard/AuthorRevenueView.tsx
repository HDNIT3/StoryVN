"use client";

import { useState } from "react";
import Link from "next/link";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useMyWallet } from "@/features/wallet";
import { useMyStories } from "@/features/stories";
import { useAuthorRevenueHistory } from "../../queries/useAuthorQueries";
import { AuthorRevenueBreakdownCard } from "./AuthorRevenueBreakdownCard";
import {
  AuthorWithdrawalsPanel,
  EarningsSummary,
} from "@/features/withdrawals/AuthorWithdrawalsPanel";
import { WithdrawalList } from "@/features/withdrawals/WithdrawalList";
import { AuthorEarningsMovements } from "@/features/withdrawals/AuthorEarningsMovements";
import { useEarnings } from "@/features/withdrawals/queries";
import { coins, dateTime } from "@/features/withdrawals/types";
import {
  RevenueEmpty,
  RevenueIcon,
  RevenueLoading,
  RevenuePagination,
  revenueButton,
  revenueCell,
  revenueField,
  revenueHead,
} from "@/features/withdrawals/RevenueUi";

const PAGE_SIZE = 15;
const TABS = [
  { id: "overview", label: "Tổng quan", icon: "overview" },
  { id: "chapters", label: "Doanh thu chương", icon: "book" },
  { id: "withdrawals", label: "Yêu cầu rút tiền", icon: "wallet" },
  { id: "movements", label: "Biến động", icon: "history" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function AuthorRevenueView() {
  const [tab, setTab] = useState<Tab>("overview");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [selectedStoryId, setSelectedStoryId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const { data: walletData } = useMyWallet();
  const { data: myStoriesData } = useMyStories({ limit: 100 });
  const earnings = useEarnings();
  const {
    data: revenueData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAuthorRevenueHistory({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    storyId: selectedStoryId,
  });
  const items = revenueData?.items || [];
  const allStories = myStoriesData?.items || [];
  const meta = revenueData?.meta;
  const summary = revenueData?.summary;
  const selectStory = (storyId: string | undefined) => {
    setSelectedStoryId(storyId);
    setPage(1);
    setTab("chapters");
  };
  const resetFilters = () => {
    setSearchInput("");
    setSelectedStoryId(undefined);
    setPage(1);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-sky-200/50 bg-linear-to-r from-sky-500/10 via-amber-500/5 to-transparent p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700">
            <RevenueIcon name="coins" className="h-3.5 w-3.5" /> Studio tác giả
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Doanh thu & nhuận bút
          </h1>
          <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">
            Theo dõi thu nhập từ tác phẩm và quản lý các khoản rút tiền của bạn.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link href="/vi" className={revenueButton}>
            <RevenueIcon name="wallet" />
            <span>
              Ví cá nhân{" "}
              <span className="ml-1 text-slate-900">
                {coins(walletData?.balance ?? 0)}
              </span>
            </span>
          </Link>
          <button
            className={revenueButton}
            disabled={isFetching || earnings.isFetching}
            onClick={() => {
              void refetch();
              void earnings.refetch();
            }}
          >
            <RevenueIcon
              name="refresh"
              className={`h-4 w-4 ${isFetching || earnings.isFetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        </div>
      </header>
      <EarningsSummary data={earnings.data} loading={earnings.isPending} />
      <div className="rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
        <div
          role="tablist"
          aria-label="Quản lý doanh thu tác giả"
          className="flex gap-1 overflow-x-auto"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const current = TABS.findIndex((item) => item.id === tab);
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? TABS.length - 1
                  : (current +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      TABS.length) %
                    TABS.length;
            setTab(TABS[next].id);
            document.getElementById(`revenue-tab-${TABS[next].id}`)?.focus();
          }}
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`revenue-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`revenue-panel-${item.id}`}
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:text-sm ${tab === item.id ? "bg-sky-50 text-sky-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              <RevenueIcon name={item.icon} />
              {item.label}
              {item.id === "withdrawals" && earnings.data?.activeRequest && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-amber-500"
                  aria-label="Có yêu cầu đang mở"
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <div
        role="tabpanel"
        id="revenue-panel-overview"
        aria-labelledby="revenue-tab-overview"
        hidden={tab !== "overview"}
        className="space-y-5"
      >
        <AuthorWithdrawalsPanel
          data={earnings.data}
          loading={earnings.isPending}
          error={earnings.isError}
          refreshing={earnings.isFetching}
          onRefresh={() => {
            void earnings.refetch();
          }}
          onShowRequests={() => setTab("withdrawals")}
        />
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white">
            <RevenueLoading rows={3} />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-slate-200 bg-white">
            <RevenueEmpty
              error
              title="Chưa tải được nguồn doanh thu"
              description="Thử tải lại để xem doanh thu theo từng tác phẩm."
              action={
                <button className={revenueButton} onClick={() => refetch()}>
                  Thử lại
                </button>
              }
            />
          </div>
        ) : (
          <AuthorRevenueBreakdownCard
            breakdown={summary?.storiesBreakdown || []}
            totalCoins={summary?.totalCoinsEarned || 0}
            selectedStoryId={selectedStoryId}
            onSelectStory={selectStory}
          />
        )}
      </div>
      <div
        role="tabpanel"
        id="revenue-panel-chapters"
        aria-labelledby="revenue-tab-chapters"
        hidden={tab !== "chapters"}
      >
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Lịch sử mở khóa chương
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Chi tiết độc giả, tác phẩm và số Xu phát sinh từ mỗi lượt mua.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              {(meta?.total ?? 0).toLocaleString("vi-VN")} lượt mở khóa
            </span>
          </div>
          <div className="flex flex-col gap-3 border-y border-slate-100 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1.5 text-[11px] font-medium text-slate-500">
              Tìm kiếm
              <div className="relative">
                <RevenueIcon
                  name="search"
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
                />
                <input
                  aria-label="Tìm chương hoặc độc giả"
                  placeholder="Tên chương, số chương hoặc độc giả…"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setPage(1);
                  }}
                  className={`${revenueField} pl-9`}
                />
              </div>
            </label>
            <label className="space-y-1.5 text-[11px] font-medium text-slate-500 sm:w-64">
              Tác phẩm
              <select
                aria-label="Lọc doanh thu theo tác phẩm"
                value={selectedStoryId || ""}
                onChange={(event) => {
                  setSelectedStoryId(event.target.value || undefined);
                  setPage(1);
                }}
                className={revenueField}
              >
                <option value="">Tất cả tác phẩm</option>
                {allStories.map((story) => (
                  <option key={story._id} value={story._id}>
                    {story.title}
                  </option>
                ))}
              </select>
            </label>
            {(selectedStoryId || searchInput) && (
              <button className={revenueButton} onClick={resetFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>
          {isLoading ? (
            <RevenueLoading />
          ) : isError ? (
            <RevenueEmpty
              error
              title="Không tải được lịch sử"
              description="Vui lòng thử lại để xem các lượt mở khóa chương."
              action={
                <button className={revenueButton} onClick={() => refetch()}>
                  Thử lại
                </button>
              }
            />
          ) : !items.length ? (
            <RevenueEmpty
              title={
                selectedStoryId || searchInput
                  ? "Không có kết quả phù hợp"
                  : "Chưa có lượt mở khóa"
              }
              description={
                selectedStoryId || searchInput
                  ? "Thử tìm kiếm khác hoặc xóa bộ lọc hiện tại."
                  : "Doanh thu sẽ xuất hiện tại đây khi độc giả mua chương trả phí của bạn."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="border-b border-slate-100 bg-slate-50/50">
                  <tr>
                    <th className={revenueHead}>Độc giả</th>
                    <th className={revenueHead}>Chương / Tác phẩm</th>
                    <th className={`${revenueHead} text-right`}>
                      Xu doanh thu
                    </th>
                    <th className={`${revenueHead} text-right`}>Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const reader =
                      item.reader?.displayName ||
                      item.reader?.username ||
                      "Độc giả";
                    const slug = item.story?.slug || item.story?._id;
                    return (
                      <tr
                        key={item._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className={revenueCell}>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-700">
                              {reader.slice(0, 1).toUpperCase()}
                            </span>
                            <div>
                              <p className="max-w-40 truncate text-xs font-semibold text-slate-800">
                                {reader}
                              </p>
                              {item.reader?.username && (
                                <p className="mt-1 text-[11px] text-slate-400">
                                  @{item.reader.username}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={revenueCell}>
                          {slug && item.chapter ? (
                            <Link
                              href={`/truyen/${slug}/chuong/${item.chapter.chapterNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="line-clamp-1 max-w-xs text-xs font-semibold text-slate-800 hover:text-sky-700"
                            >
                              Chương {item.chapter.chapterNumber}:{" "}
                              {item.chapter.title || "Chưa có tiêu đề"}
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Chương không còn hiển thị
                            </span>
                          )}
                          <p className="mt-1 max-w-xs truncate text-[11px] text-slate-400">
                            {item.story?.title || "Tác phẩm không còn hiển thị"}
                          </p>
                        </td>
                        <td
                          className={`${revenueCell} whitespace-nowrap text-right text-xs font-bold text-amber-600 tabular-nums`}
                        >
                          +{coins(item.coinPrice)}
                        </td>
                        <td
                          className={`${revenueCell} whitespace-nowrap text-right text-[11px] text-slate-500`}
                        >
                          {dateTime(item.unlockedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!isError && !isLoading && (
            <RevenuePagination
              page={meta?.page ?? page}
              totalPages={meta?.totalPages ?? 1}
              totalItems={meta?.total ?? 0}
              pageSize={PAGE_SIZE}
              onPage={setPage}
              disabled={isFetching}
            />
          )}
        </section>
      </div>
      <div
        role="tabpanel"
        id="revenue-panel-withdrawals"
        aria-labelledby="revenue-tab-withdrawals"
        hidden={tab !== "withdrawals"}
      >
        <WithdrawalList />
      </div>
      <div
        role="tabpanel"
        id="revenue-panel-movements"
        aria-labelledby="revenue-tab-movements"
        hidden={tab !== "movements"}
      >
        <AuthorEarningsMovements />
      </div>
    </div>
  );
}
