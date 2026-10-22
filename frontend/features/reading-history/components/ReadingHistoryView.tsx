"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAllCategories } from "@/features/categories";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useMyReadingHistory } from "../queries/useReadingHistoryQueries";
import { ReadingHistoryCard } from "./ReadingHistoryCard";
import { ReadingHistoryFilterBar } from "./ReadingHistoryFilterBar";
import { ReadingHistoryEmptyState } from "./ReadingHistoryEmptyState";
import { ReadingHistoryPaginationBar } from "./ReadingHistoryPagination";
import type {
  ReadingHistorySortOption,
  ReadingStatusFilter,
} from "../types";

const PAGE_PATH = "/tai-khoan/lich-su";
const PAGE_SIZE = 9;

function ReadingHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") || ""
  );
  const debouncedSearch = useDebounce(searchInput, 400);
  const [genre, setGenre] = useState(() => searchParams.get("genre") || "");
  const [status, setStatus] = useState<ReadingStatusFilter | "">(
    () => (searchParams.get("status") as ReadingStatusFilter) || ""
  );
  const [sortBy, setSortBy] = useState<ReadingHistorySortOption>(
    () =>
      (searchParams.get("sortBy") as ReadingHistorySortOption) || "lastReadAt"
  );
  const [minChapterNumber, setMinChapterNumber] = useState(
    () => searchParams.get("minChapterNumber") || ""
  );
  const [fromDate, setFromDate] = useState(
    () => searchParams.get("from") || ""
  );
  const [toDate, setToDate] = useState(() => searchParams.get("to") || "");

  // Tự động quay về trang 1 khi đổi bộ lọc
  const filterKey = [
    debouncedSearch.trim(),
    genre,
    status,
    minChapterNumber,
    fromDate,
    toDate,
    sortBy,
  ].join("|");
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const changePage = (nextPage: number) => {
    setPageState({ key: filterKey, page: nextPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Thể loại cho bộ lọc
  const { data: genres = [] } = useAllCategories();

  const params = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      genre: genre || undefined,
      status: (status || undefined) as ReadingStatusFilter | undefined,
      minChapterNumber: minChapterNumber ? Number(minChapterNumber) : undefined,
      from: fromDate
        ? new Date(`${fromDate}T00:00:00.000`).toISOString()
        : undefined,
      to: toDate
        ? new Date(`${toDate}T23:59:59.999`).toISOString()
        : undefined,
      sortBy,
      page,
      limit: PAGE_SIZE,
    }),
    [
      debouncedSearch,
      genre,
      status,
      minChapterNumber,
      fromDate,
      toDate,
      sortBy,
      page,
    ]
  );

  const { data, isLoading, isError, isFetching, refetch } =
    useMyReadingHistory(params);

  const items = useMemo(() => data?.items ?? [], [data]);
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.totalItems ?? 0;

  const isFiltering = Boolean(
    debouncedSearch.trim() ||
      genre ||
      status ||
      minChapterNumber ||
      fromDate ||
      toDate
  );

  // Đồng bộ URL
  const currentQuery = searchParams.toString();
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch.trim()) next.set("search", debouncedSearch.trim());
    if (genre) next.set("genre", genre);
    if (status) next.set("status", status);
    if (minChapterNumber) next.set("minChapterNumber", minChapterNumber);
    if (fromDate) next.set("from", fromDate);
    if (toDate) next.set("to", toDate);
    if (sortBy !== "lastReadAt") next.set("sortBy", sortBy);
    if (page > 1) next.set("page", String(page));

    const queryString = next.toString();
    if (queryString === currentQuery) return;
    router.replace(
      queryString ? `${PAGE_PATH}?${queryString}` : PAGE_PATH,
      { scroll: false }
    );
  }, [
    debouncedSearch,
    genre,
    status,
    minChapterNumber,
    fromDate,
    toDate,
    sortBy,
    page,
    currentQuery,
    router,
  ]);

  const handleResetFilters = () => {
    setSearchInput("");
    setGenre("");
    setStatus("");
    setSortBy("lastReadAt");
    setMinChapterNumber("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-zinc-500 select-none">
        <Link
          href="/ho-so"
          className="hover:text-zinc-900 transition-colors inline-flex items-center gap-1"
        >
          <span>← Hồ sơ cá nhân</span>
        </Link>
        <span aria-hidden className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-semibold">Lịch sử đọc</span>
      </nav>

      {/* Hero Card + Bộ Lọc */}
      <ReadingHistoryFilterBar
        totalItems={totalItems}
        searchInput={searchInput}
        debouncedSearch={debouncedSearch}
        genre={genre}
        status={status}
        sortBy={sortBy}
        minChapterNumber={minChapterNumber}
        fromDate={fromDate}
        toDate={toDate}
        genres={genres}
        isFiltering={isFiltering}
        onSearchChange={setSearchInput}
        onGenreChange={setGenre}
        onStatusChange={setStatus}
        onSortByChange={setSortBy}
        onMinChapterNumberChange={setMinChapterNumber}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onResetFilters={handleResetFilters}
      />

      {/* Danh Sách / Trạng Thái */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4 animate-pulse h-52"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-lg mx-auto shadow-2xs">
          <p className="text-sm font-semibold text-red-600">
            Không thể tải lịch sử đọc
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Vui lòng kiểm tra kết nối mạng và thử lại.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <ReadingHistoryEmptyState
          isFiltering={isFiltering}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch transition-opacity duration-200 ${
              isFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            {items.map((item) => (
              <ReadingHistoryCard key={item.story._id} item={item} />
            ))}
          </div>

          <ReadingHistoryPaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={changePage}
          />
        </>
      )}
    </div>
  );
}

export function ReadingHistoryView() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 py-12 text-center text-xs text-zinc-400">
          Đang tải lịch sử đọc...
        </div>
      }
    >
      <ReadingHistoryContent />
    </Suspense>
  );
}

export default ReadingHistoryView;
