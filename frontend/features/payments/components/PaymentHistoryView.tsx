"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useMyTransactions } from "../queries/usePaymentQueries";
import type { TransactionStatus } from "../types";
import { PaymentHistoryEmptyState } from "./PaymentHistoryEmptyState";
import { PaymentHistoryFilterBar } from "./PaymentHistoryFilterBar";
import { PaymentHistoryPaginationBar } from "./PaymentHistoryPagination";
import { PaymentHistoryRow } from "./PaymentHistoryRow";

const PAGE_SIZE = 10;

export function PaymentHistoryView() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: status || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedSearch, status, page]
  );

  const { data, isLoading, isError, isFetching, refetch } =
    useMyTransactions(params);

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  const isFiltering = Boolean(searchInput.trim() || status);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleStatusChange = (value: TransactionStatus | "") => {
    setStatus(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setStatus("");
    setPage(1);
  };

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
        <span className="font-semibold text-zinc-900">Lịch sử thanh toán</span>
      </nav>

      <PaymentHistoryFilterBar
        totalItems={totalItems}
        searchInput={searchInput}
        status={status}
        isFiltering={isFiltering}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onResetFilters={handleResetFilters}
      />

      {isLoading ? (
        <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex animate-pulse items-center gap-4 px-5 py-4">
              <div className="h-10 w-10 rounded-xl bg-zinc-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded bg-zinc-100" />
                <div className="h-3 w-28 rounded bg-zinc-100" />
              </div>
              <div className="hidden h-3.5 w-24 rounded bg-zinc-100 sm:block" />
              <div className="hidden h-6 w-24 rounded-full bg-zinc-100 sm:block" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-2xs">
          <p className="text-sm font-semibold text-red-600">
            Không thể tải lịch sử thanh toán
          </p>
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
      ) : items.length === 0 ? (
        <PaymentHistoryEmptyState
          isFiltering={isFiltering}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <div className="space-y-4">
          <div
            className={`divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs transition-opacity duration-200 ${
              isFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            {items.map((item) => (
              <PaymentHistoryRow key={item._id} item={item} />
            ))}
          </div>

          <PaymentHistoryPaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </div>
  );
}

export default PaymentHistoryView;
