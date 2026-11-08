"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/lib/hooks/useDebounce";
import {
  useFollowedStories,
  useFollowedAuthors,
  useFollowedUpdates,
  useFollowedUpdatesUnreadCount,
  useMarkFollowedUpdatesRead,
} from "../queries/useFollowsQueries";
import { FollowedStoryCard } from "./FollowedStoryCard";
import { FollowedAuthorCard } from "./FollowedAuthorCard";
import { FollowedUpdateCard } from "./FollowedUpdateCard";
import { FollowsFilterBar } from "./FollowsFilterBar";
import { FollowsEmptyState } from "./FollowsEmptyState";
import { FollowsPaginationBar } from "./FollowsPagination";
import type {
  FollowBookshelfTab,
  FollowStorySortOption,
} from "../types";

const DEFAULT_PAGE_PATH = "/tai-khoan/theo-doi";
const STORY_PAGE_SIZE = 9;
const UPDATES_PAGE_SIZE = 12;
const AUTHOR_PAGE_SIZE = 6;

function normalizeSortOption(raw: string | null): FollowStorySortOption {
  if (raw === "updatedAt" || raw === "updated") return "updatedAt";
  if (raw === "title") return "title";
  return "followedAt";
}

function FollowsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = pathname === "/theo-doi" ? "/theo-doi" : DEFAULT_PAGE_PATH;

  // Tab: "STORY" | "UPDATES" | "AUTHOR"
  const tabFromUrl = searchParams.get("tab");
  const urlTab: FollowBookshelfTab =
    tabFromUrl === "tac-gia" || tabFromUrl === "AUTHOR"
      ? "AUTHOR"
      : tabFromUrl === "chuong-moi" || tabFromUrl === "UPDATES"
        ? "UPDATES"
        : "STORY";

  const [prevUrlTab, setPrevUrlTab] = useState<FollowBookshelfTab>(urlTab);
  const [activeTab, setActiveTab] = useState<FollowBookshelfTab>(urlTab);

  // Đồng bộ tab khi searchParams thay đổi từ bên ngoài (ví dụ người dùng bấm link từ thông báo)
  if (urlTab !== prevUrlTab) {
    setPrevUrlTab(urlTab);
    setActiveTab(urlTab);
  }

  // Search input
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") || ""
  );
  const debouncedSearch = useDebounce(searchInput, 350);

  // Sort (cho tab STORY)
  const [sortBy, setSortBy] = useState<FollowStorySortOption>(() =>
    normalizeSortOption(searchParams.get("sortBy"))
  );

  // Bộ lọc chưa đọc (cho tab UPDATES)
  const [onlyUnread, setOnlyUnread] = useState(
    () => searchParams.get("onlyUnread") === "true"
  );

  // Pagination state: tự động về trang 1 khi đổi bộ lọc hoặc tab
  const filterKey = `${activeTab}|${debouncedSearch.trim()}|${sortBy}|${onlyUnread}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;

  const changePage = (nextPage: number) => {
    setPageState({ key: filterKey, page: nextPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTabChange = (nextTab: FollowBookshelfTab) => {
    setActiveTab(nextTab);
    setSearchInput("");
  };

  // Queries cho 3 tabs & unread counter
  const storyQuery = useFollowedStories(
    {
      page: activeTab === "STORY" ? page : 1,
      limit: STORY_PAGE_SIZE,
      search:
        activeTab === "STORY" ? debouncedSearch.trim() || undefined : undefined,
      sortBy,
    },
    true
  );

  const authorQuery = useFollowedAuthors(
    {
      page: activeTab === "AUTHOR" ? page : 1,
      limit: AUTHOR_PAGE_SIZE,
      search:
        activeTab === "AUTHOR"
          ? debouncedSearch.trim() || undefined
          : undefined,
    },
    true
  );

  const updatesQuery = useFollowedUpdates(
    {
      page,
      limit: UPDATES_PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      onlyUnread: onlyUnread || undefined,
    },
    activeTab === "UPDATES"
  );

  const updatesUnreadQuery = useFollowedUpdatesUnreadCount(true);
  const markAllUpdatesMutation = useMarkFollowedUpdatesRead();

  // Đếm tổng số lượng cho badges
  const storyTotalItems = storyQuery.data?.pagination?.totalItems ?? 0;
  const authorTotalItems = authorQuery.data?.pagination?.totalItems ?? 0;
  const updatesUnreadChapters =
    (activeTab === "UPDATES"
      ? updatesQuery.data?.summary?.unreadChaptersCount
      : undefined) ??
    updatesUnreadQuery.data?.unreadChaptersCount ??
    0;
  const updatesUnreadStories =
    (activeTab === "UPDATES"
      ? updatesQuery.data?.summary?.unreadStoriesCount
      : undefined) ??
    updatesUnreadQuery.data?.unreadStoriesCount ??
    0;

  // Dữ liệu hiển thị của tab hiện tại
  const isStoryTab = activeTab === "STORY";
  const isUpdatesTab = activeTab === "UPDATES";

  const currentQuery = isStoryTab
    ? storyQuery
    : isUpdatesTab
      ? updatesQuery
      : authorQuery;

  const storyItems = storyQuery.data?.items ?? [];
  const updateItems = updatesQuery.data?.items ?? [];
  const authorItems = authorQuery.data?.items ?? [];
  const itemsCount = isStoryTab
    ? storyItems.length
    : isUpdatesTab
      ? updateItems.length
      : authorItems.length;

  const pagination = currentQuery.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.totalItems ?? 0;
  const isFiltering = Boolean(debouncedSearch.trim());

  // Đồng bộ URL parameters
  const currentQueryString = searchParams.toString();
  useEffect(() => {
    const next = new URLSearchParams();
    if (activeTab === "AUTHOR") next.set("tab", "tac-gia");
    if (activeTab === "UPDATES") next.set("tab", "chuong-moi");
    if (debouncedSearch.trim()) next.set("search", debouncedSearch.trim());
    if (isStoryTab && sortBy !== "followedAt") next.set("sortBy", sortBy);
    if (isUpdatesTab && onlyUnread) next.set("onlyUnread", "true");
    if (page > 1) next.set("page", String(page));

    const qs = next.toString();
    if (qs === currentQueryString) return;
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }, [
    activeTab,
    debouncedSearch,
    isStoryTab,
    isUpdatesTab,
    sortBy,
    onlyUnread,
    page,
    currentQueryString,
    router,
    basePath,
  ]);

  const handleResetFilters = () => {
    setSearchInput("");
    setSortBy("followedAt");
    setOnlyUnread(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* ─── Breadcrumb ────────────────────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-medium text-zinc-500 select-none"
      >
        <Link
          href="/ho-so"
          className="hover:text-zinc-900 transition-colors inline-flex items-center gap-1"
        >
          <span>← Hồ sơ cá nhân</span>
        </Link>
        <span aria-hidden className="text-zinc-300">
          /
        </span>
        <span className="text-zinc-900 font-semibold">Tủ truyện</span>
      </nav>

      {/* ─── Header & Bộ Lọc Chia Tabs ─────────────────────────── */}
      <FollowsFilterBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        storyTotalItems={storyTotalItems}
        authorTotalItems={authorTotalItems}
        updatesUnreadChapters={updatesUnreadChapters}
        updatesUnreadStories={updatesUnreadStories}
        onlyUnread={onlyUnread}
        onOnlyUnreadChange={setOnlyUnread}
        onMarkAllUpdatesRead={() => markAllUpdatesMutation.mutate(undefined)}
        isMarkingAllRead={markAllUpdatesMutation.isPending}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onResetFilters={handleResetFilters}
      />

      {/* ─── Danh Sách Dữ Liệu / Loading / Error ──────────────── */}
      {currentQuery.isLoading ? (
        <div
          className={`grid gap-4 ${isStoryTab
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
            }`}
        >
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4 animate-pulse h-56"
            />
          ))}
        </div>
      ) : currentQuery.isError ? (
        <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-lg mx-auto shadow-2xs">
          <p className="text-sm font-semibold text-red-600">
            Không thể tải danh sách theo dõi
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Vui lòng kiểm tra kết nối mạng và thử lại.
          </p>
          <button
            type="button"
            onClick={() => currentQuery.refetch()}
            className="mt-4 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : itemsCount === 0 ? (
        <FollowsEmptyState
          activeTab={activeTab}
          isFiltering={isFiltering}
          onlyUnread={onlyUnread}
          onResetFilters={handleResetFilters}
          onShowAllUpdates={() => setOnlyUnread(false)}
        />
      ) : (
        <>
          {/* TAB 1: DANH SÁCH TRUYỆN THEO DÕI */}
          {isStoryTab && (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch transition-opacity duration-200 ${currentQuery.isFetching ? "opacity-60" : "opacity-100"
                }`}
            >
              {storyItems.map((item) => (
                <FollowedStoryCard key={item._id} item={item} />
              ))}
            </div>
          )}

          {/* TAB 2: CHƯƠNG MỚI CỦA TRUYỆN THEO DÕI */}
          {isUpdatesTab && (
            <div
              className={`flex flex-col gap-4 transition-opacity duration-200 ${currentQuery.isFetching ? "opacity-60" : "opacity-100"
                }`}
            >
              {updateItems.map((item) => (
                <FollowedUpdateCard key={item.story._id} item={item} />
              ))}
            </div>
          )}

          {/* TAB 3: DANH SÁCH TÁC GIẢ THEO DÕI */}
          {!isStoryTab && !isUpdatesTab && (
            <div
              className={`flex flex-col gap-5 transition-opacity duration-200 ${currentQuery.isFetching ? "opacity-60" : "opacity-100"
                }`}
            >
              {authorItems.map((author) => (
                <FollowedAuthorCard key={author._id} author={author} />
              ))}
            </div>
          )}

          {/* Thanh phân trang */}
          <FollowsPaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemName={
              isStoryTab ? "truyện" : isUpdatesTab ? "truyện cập nhật" : "tác giả"
            }
            onPageChange={changePage}
          />
        </>
      )}
    </div>
  );
}

export function FollowsView() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 py-16 text-center text-xs text-zinc-400">
          Đang tải tủ truyện...
        </div>
      }
    >
      <FollowsContent />
    </Suspense>
  );
}

export default FollowsView;
