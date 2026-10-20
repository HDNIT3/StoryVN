"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAllCategories } from "@/lib/hooks/queries/useCategoryQuery";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useMyReadingHistory } from "@/lib/hooks/queries/useReadingHistoryQuery";
import { ReadingHistoryCard } from "@/components/reading-history/ReadingHistoryCard";
import type {
  ReadingHistorySortOption,
  ReadingStatusFilter,
} from "@/types/reading-history";

const PAGE_PATH = "/tai-khoan/lich-su";
const PAGE_SIZE = 9;

const STATUS_TABS: { value: ReadingStatusFilter | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "reading", label: "Đang đọc" },
  { value: "completed", label: "Đã đọc hết" },
];

const SORT_OPTIONS: { value: ReadingHistorySortOption; label: string }[] = [
  { value: "lastReadAt", label: "Mới đọc gần nhất" },
  { value: "progress", label: "Tiến độ cao nhất" },
  { value: "title", label: "Tên truyện A - Z" },
];

const MIN_CHAPTER_OPTIONS = [
  { value: "", label: "Mọi số chương" },
  { value: "10", label: "Từ 10 chương trở lên" },
  { value: "50", label: "Từ 50 chương trở lên" },
  { value: "100", label: "Từ 100 chương trở lên" },
  { value: "200", label: "Từ 200 chương trở lên" },
];

const SELECT_CLASS =
  "px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs sm:text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 cursor-pointer transition";

const DATE_LABEL_CLASS =
  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600";

function LichSuDocContent() {
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

  // Thể loại cho bộ lọc (dùng chung cache với các trang khác)
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

  const currentGenreName = useMemo(() => {
    if (!genre || !genres) return "";
    const found = genres.find(
      (g) => g.slug === genre || g._id === genre
    );
    return found?.name || genre;
  }, [genre, genres]);

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
      {/* ─── Breadcrumb ────────────────────────────────────────────── */}
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

      {/* ─── Hero Card + Bộ Lọc (Chung 1 section như trang Truyện) ──── */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        {/* Tiêu đề & Nút khám phá truyện */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                Lịch sử đọc
              </h1>
              {totalItems > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 tabular-nums">
                  {totalItems} truyện
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-[65ch]">
              {totalItems > 0
                ? `${totalItems} bộ truyện bạn đã mở, hiển thị truyện mới đọc gần nhất trước.`
                : "Những bộ truyện bạn đã mở sẽ được lưu lại tại đây."}
            </p>
          </div>

          <Link
            href="/truyen"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs sm:text-sm font-semibold transition-colors shadow-2xs self-start sm:self-auto shrink-0"
          >
            <span>Khám phá truyện</span>
            <span>→</span>
          </Link>
        </div>

        {/* Thanh tìm kiếm & bộ lọc bên trong cùng section */}
        <div className="pt-4 border-t border-zinc-100 space-y-3.5">
          {/* Hàng 1: Tìm kiếm, Trạng thái, Sắp xếp */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên truyện..."
              aria-label="Tìm theo tên truyện"
              className="w-full pl-9 pr-9 py-2.5 bg-zinc-50 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Xoá từ khoá tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Nhóm trạng thái đọc & sắp xếp */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5">
              {STATUS_TABS.map((tab) => {
                const isActive = status === tab.value;
                return (
                  <button
                    key={tab.value || "all"}
                    type="button"
                    onClick={() => setStatus(tab.value)}
                    aria-pressed={isActive}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "bg-sky-500 text-white shadow-2xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as ReadingHistorySortOption)
              }
              aria-label="Sắp xếp lịch sử đọc"
              className={`${SELECT_CLASS} ml-auto sm:ml-0`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hàng 2: Bộ lọc chi tiết */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-zinc-100">
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            aria-label="Lọc theo thể loại"
            className={SELECT_CLASS}
          >
            <option value="">Tất cả thể loại</option>
            {genres?.map((item) => (
              <option key={item._id} value={item.slug || item._id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={minChapterNumber}
            onChange={(e) => setMinChapterNumber(e.target.value)}
            aria-label="Lọc theo số chương đã đọc"
            className={SELECT_CLASS}
          >
            {MIN_CHAPTER_OPTIONS.map((opt) => (
              <option key={opt.value || "any"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className={DATE_LABEL_CLASS}>
            <span className="text-zinc-400 shrink-0">Từ ngày</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 font-semibold focus:outline-none cursor-pointer"
            />
          </label>

          <label className={DATE_LABEL_CLASS}>
            <span className="text-zinc-400 shrink-0">Đến ngày</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 font-semibold focus:outline-none cursor-pointer"
            />
          </label>

          {isFiltering && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Xoá bộ lọc
            </button>
          )}
        </div>

        {/* Hàng 3: Các tag bộ lọc đang kích hoạt */}
        {isFiltering && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-zinc-400 font-medium">Đang lọc:</span>

            {debouncedSearch.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                Từ khoá: &quot;{debouncedSearch.trim()}&quot;
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label="Xoá lọc theo từ khoá"
                >
                  ✕
                </button>
              </span>
            )}

            {currentGenreName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                Thể loại: {currentGenreName}
                <button
                  type="button"
                  onClick={() => setGenre("")}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label="Xoá lọc theo thể loại"
                >
                  ✕
                </button>
              </span>
            )}

            {status && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                {status === "reading" ? "Đang đọc" : "Đã đọc hết"}
                <button
                  type="button"
                  onClick={() => setStatus("")}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label="Xoá lọc theo trạng thái"
                >
                  ✕
                </button>
              </span>
            )}

            {minChapterNumber && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                Từ {minChapterNumber} chương
                <button
                  type="button"
                  onClick={() => setMinChapterNumber("")}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label="Xoá lọc theo số chương"
                >
                  ✕
                </button>
              </span>
            )}

            {(fromDate || toDate) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                {fromDate || "..."} → {toDate || "..."}
                <button
                  type="button"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label="Xoá lọc theo thời gian"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        )}
        </div>
      </div>

      {/* ─── Danh Sách / Trạng Thái ─────────────────────────────────── */}
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
        <div className="bg-white rounded-2xl border border-zinc-200 p-10 sm:p-14 text-center flex flex-col items-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900">
            {isFiltering ? "Không có truyện nào khớp bộ lọc" : "Chưa có lịch sử đọc"}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm">
            {isFiltering
              ? "Thử đổi từ khoá, thể loại hoặc khoảng thời gian để xem kết quả khác."
              : "Mở một chương truyện bất kỳ, lịch sử đọc của bạn sẽ được lưu lại tại đây."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
            {isFiltering && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Xoá bộ lọc
              </button>
            )}
            <Link
              href="/truyen"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition-colors shadow-2xs"
            >
              Khám phá truyện
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Lưới truyện */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch transition-opacity duration-200 ${
              isFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            {items.map((item) => (
              <ReadingHistoryCard key={item.story._id} item={item} />
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-200/80">
              <span className="text-xs sm:text-sm text-zinc-500 tabular-nums">
                Trang <strong className="font-semibold text-zinc-800">{page}</strong> / {totalPages} ({totalItems} truyện)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => changePage(Math.max(1, page - 1))}
                  className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-700 transition-colors cursor-pointer shadow-2xs"
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => changePage(Math.min(totalPages, page + 1))}
                  className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-700 transition-colors cursor-pointer shadow-2xs"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LichSuDocPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 py-12 text-center text-xs text-zinc-400">
          Đang tải lịch sử đọc...
        </div>
      }
    >
      <LichSuDocContent />
    </Suspense>
  );
}
