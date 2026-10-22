"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { storyService, storyKeys } from "@/features/stories";
import { useAllCategories } from "@/features/categories";
import type { StoryProgressState, StorySortOption } from "@/features/stories";
import { StoryFilterBar, SORT_OPTIONS, PROGRESS_OPTIONS } from "./StoryFilterBar";
import { StoryListItemCard } from "./StoryListItemCard";
import { TopViewsWidget } from "./TopViewsWidget";
import { BookIcon } from "./StoryIcons";
import { formatNumber } from "./StoryDateUtils";

export const PublicStoriesListView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Đọc params từ URL
  const initialSearch = searchParams.get("search") || "";
  const initialGenre = searchParams.get("genre") || "";
  const initialProgress = (searchParams.get("progressState") as StoryProgressState) || "";
  const initialSort = (searchParams.get("sortBy") as StorySortOption) || "published";
  const initialPage = parseInt(searchParams.get("page") || "1", 10) || 1;

  // State điều khiển
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [selectedProgress, setSelectedProgress] = useState<string>(initialProgress);
  const [selectedSort, setSelectedSort] = useState<StorySortOption>(initialSort);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // Popover state
  const [openDropdown, setOpenDropdown] = useState<"genre" | "progress" | "sort" | null>(null);

  // Lấy danh sách thể loại từ API
  const { data: genresData = [] } = useAllCategories();

  // Lấy danh sách truyện chính với bộ lọc
  const {
    data: storiesResponse,
    isLoading: isLoadingStories,
  } = useQuery({
    queryKey: storyKeys.filtered({
      search: initialSearch,
      genre: selectedGenre,
      progressState: selectedProgress,
      sortBy: selectedSort,
      page: currentPage,
      limit: 10,
    }),
    queryFn: async () => {
      const res = await storyService.getStories({
        search: initialSearch || undefined,
        genre: selectedGenre || undefined,
        progressState: (selectedProgress as StoryProgressState) || undefined,
        sortBy: selectedSort,
        page: currentPage,
        limit: 10,
      });
      return res.data;
    },
  });

  // Lấy Top 6 Truyện nổi bật cho cột bên phải
  const { data: topViewsData, isLoading: isLoadingTopViews } = useQuery({
    queryKey: storyKeys.topViews(6),
    queryFn: async () => {
      const res = await storyService.getTopViews(6);
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Áp dụng tìm kiếm
  const handleApplyFilter = (overrideParams?: {
    search?: string;
    genre?: string;
    progressState?: string;
    sortBy?: StorySortOption;
    page?: number;
  }) => {
    const qSearch = overrideParams?.search !== undefined ? overrideParams.search : searchInput;
    const qGenre = overrideParams?.genre !== undefined ? overrideParams.genre : selectedGenre;
    const qProgress = overrideParams?.progressState !== undefined ? overrideParams.progressState : selectedProgress;
    const qSort = overrideParams?.sortBy !== undefined ? overrideParams.sortBy : selectedSort;
    const qPage = overrideParams?.page !== undefined ? overrideParams.page : 1;

    setCurrentPage(qPage);

    const params = new URLSearchParams();
    if (qSearch.trim()) params.set("search", qSearch.trim());
    if (qGenre) params.set("genre", qGenre);
    if (qProgress) params.set("progressState", qProgress);
    if (qSort) params.set("sortBy", qSort);
    if (qPage > 1) params.set("page", qPage.toString());

    const qs = params.toString();
    router.push(qs ? `/truyen?${qs}` : "/truyen");
    setOpenDropdown(null);
  };

  const storiesList = storiesResponse?.items || [];
  const pagination = storiesResponse?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  // Lấy tên nhãn của bộ lọc hiện tại
  const currentGenreName = useMemo(() => {
    if (!selectedGenre) return "Thể loại";
    const found = genresData?.find(
      (g) => g.slug === selectedGenre || g._id === selectedGenre
    );
    return found ? found.name : "Thể loại";
  }, [selectedGenre, genresData]);

  const currentProgressName = useMemo(() => {
    if (!selectedProgress) return "Trạng thái";
    const found = PROGRESS_OPTIONS.find((p) => p.value === selectedProgress);
    return found ? found.label : "Trạng thái";
  }, [selectedProgress]);

  const currentSortName = useMemo(() => {
    const found = SORT_OPTIONS.find((s) => s.value === selectedSort);
    return found ? found.label : "Mới xuất bản";
  }, [selectedSort]);

  return (
    <div className="min-h-screen bg-[#fafaf8] py-5 sm:py-8">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-4 sm:mb-6 select-none">
          <Link href="/" className="hover:text-emerald-700 transition-colors">
            Trang chủ
          </Link>
          <span className="text-zinc-300">›</span>
          <Link href="/truyen" className="hover:text-emerald-700 transition-colors">
            Truyện
          </Link>
          <span className="text-zinc-300">›</span>
          <span className="text-zinc-800 font-medium">Danh sách truyện</span>
        </nav>

        {/* Filter Bar */}
        <StoryFilterBar
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          selectedGenre={selectedGenre}
          setSelectedGenre={setSelectedGenre}
          selectedProgress={selectedProgress}
          setSelectedProgress={setSelectedProgress}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
          genresData={genresData}
          currentGenreName={currentGenreName}
          currentProgressName={currentProgressName}
          currentSortName={currentSortName}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onApplyFilter={handleApplyFilter}
        />

        {/* Thanh đếm tổng số lượng và chip sắp xếp */}
        <div className="flex items-center justify-between gap-3 mb-5 px-1">
          <div className="text-xs sm:text-sm text-zinc-600">
            Tổng cộng{" "}
            <span className="font-bold text-zinc-900">
              {formatNumber(totalItems)}
            </span>{" "}
            truyện
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-700 shadow-2xs">
              {currentSortName}
            </span>
          </div>
        </div>

        {/* Layout 2 cột: Cột trái (Danh sách truyện) - Cột phải (Truyện nổi bật) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-4">
            {isLoadingStories ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-zinc-200/80 p-5 flex gap-4 animate-pulse"
                  >
                    <div className="w-28 sm:w-32 h-36 sm:h-44 bg-zinc-200 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-3 py-2">
                      <div className="h-5 bg-zinc-200 rounded w-3/4" />
                      <div className="h-4 bg-zinc-100 rounded w-1/2" />
                      <div className="h-4 bg-zinc-100 rounded w-1/3" />
                      <div className="h-10 bg-zinc-100 rounded w-full mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : storiesList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center shadow-xs">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center">
                  <BookIcon className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-zinc-800 mb-1">
                  Không tìm thấy truyện phù hợp
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto mb-5">
                  Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc thể loại, trạng thái để xem nhiều kết quả hơn.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSelectedGenre("");
                    setSelectedProgress("");
                    setSelectedSort("published");
                    router.push("/truyen");
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              storiesList.map((story) => (
                <StoryListItemCard key={story._id} story={story} />
              ))
            )}

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-6 pb-4">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handleApplyFilter({ page: currentPage - 1 })}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Trước
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  if (
                    pNum === 1 ||
                    pNum === totalPages ||
                    (pNum >= currentPage - 1 && pNum <= currentPage + 1)
                  ) {
                    const isActive = pNum === currentPage;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => handleApplyFilter({ page: pNum })}
                        className={`min-w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[#0d5c46] text-white"
                            : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  }
                  if (pNum === currentPage - 2 || pNum === currentPage + 2) {
                    return (
                      <span key={pNum} className="px-1 text-zinc-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handleApplyFilter({ page: currentPage + 1 })}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Sau
                </button>
              </div>
            )}
          </div>

          {/* CỘT PHẢI */}
          <div className="lg:col-span-4 xl:col-span-4">
            <TopViewsWidget items={topViewsData} isLoading={isLoadingTopViews} />
          </div>
        </div>
      </div>
    </div>
  );
};
