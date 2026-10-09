"use client";

import React, { Suspense, useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { storyService } from "@/lib/services/story.service";
import { categoryService } from "@/lib/services/category.service";
import { queryKeys } from "@/lib/query-keys";
import type {
  FilteredStoryItem,
  StoryProgressState,
  StorySortOption,
  TopViewStoryItem,
} from "@/types/story";

// Helper định dạng ngày giờ VN: DD-MM-YYYY HH:mm:ss
function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "Chưa cập nhật";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateStr;
  }
}

// Helper tính khoảng thời gian tương đối: X giờ trước, X ngày trước
function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Vừa xong";
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return "Vừa xong";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  } catch {
    return "Vừa xong";
  }
}

function formatNumber(num?: number): string {
  if (!num) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
}

// Inline SVGs chuẩn
function GridIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function BookmarkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SortIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 15l5 5 5-5" />
      <path d="M7 9l5-5 5 5" />
    </svg>
  );
}

function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function BookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const SORT_OPTIONS: { label: string; value: StorySortOption }[] = [
  { label: "Mới xuất bản", value: "published" },
  { label: "Mới cập nhật", value: "updated" },
  { label: "Lượt đọc nhiều nhất", value: "views" },
  { label: "Nhiều chương nhất", value: "chapters" },
  { label: "Đánh giá cao nhất", value: "rating" },
];

const PROGRESS_OPTIONS: { label: string; value: StoryProgressState | "" }[] = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Hoàn thành", value: "COMPLETED" },
  { label: "Đang ra", value: "ONGOING" },
  { label: "Tạm ngưng", value: "ON_HOLD" },
];

function StoriesContent() {
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

  // Ref để click outside
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lấy danh sách thể loại từ API
  const { data: genresData } = useQuery({
    queryKey: queryKeys.categories.list({ all: true }),
    queryFn: async () => {
      const res = await categoryService.findAll({ all: true });
      return res.data?.items || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Lấy danh sách truyện chính với bộ lọc (mỗi trang 10 truyện)
  const {
    data: storiesResponse,
    isLoading: isLoadingStories,
    isFetching: isFetchingStories,
  } = useQuery({
    queryKey: queryKeys.stories.filtered({
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
    queryKey: queryKeys.stories.topViews(6),
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
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

        {/* Hero Card + Filter Bar */}
        <div
          ref={filterRef}
          className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-xs mb-6 z-20"
        >
          {/* Subtle Watermark Decoration */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute top-0 right-0 w-72 h-44 bg-gradient-to-bl from-emerald-50/60 to-transparent" />
          </div>

          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f3d33] mb-2">
              Danh sách truyện
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mb-6">
              Một kệ sách gọn để bạn lướt nhanh các tác phẩm đang được đăng tải trên StoryVN.
            </p>

            {/* Thanh bộ lọc ngang */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 sm:gap-3">
              {/* Dropdown Thể loại */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "genre" ? null : "genre")
                  }
                  className={`w-full lg:w-auto min-w-[140px] flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors bg-white ${
                    selectedGenre
                      ? "border-emerald-600 text-emerald-800 bg-emerald-50/40"
                      : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <GridIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="truncate">{currentGenreName}</span>
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>

                {openDropdown === "genre" && (
                  <div className="absolute top-full left-0 mt-1.5 w-60 max-h-72 overflow-y-auto bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGenre("");
                        handleApplyFilter({ genre: "" });
                      }}
                      className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center justify-between ${
                        !selectedGenre
                          ? "bg-emerald-50 text-emerald-800 font-semibold"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      Tất cả thể loại
                    </button>
                    {genresData?.map((genre) => {
                      const isSelected =
                        selectedGenre === genre.slug || selectedGenre === genre._id;
                      return (
                        <button
                          key={genre._id}
                          type="button"
                          onClick={() => {
                            const val = genre.slug || genre._id;
                            setSelectedGenre(val);
                            handleApplyFilter({ genre: val });
                          }}
                          className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center justify-between ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-800 font-semibold"
                              : "text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          <span>{genre.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dropdown Trạng thái */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "progress" ? null : "progress")
                  }
                  className={`w-full lg:w-auto min-w-[140px] flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors bg-white ${
                    selectedProgress
                      ? "border-emerald-600 text-emerald-800 bg-emerald-50/40"
                      : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <BookmarkIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="truncate">{currentProgressName}</span>
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>

                {openDropdown === "progress" && (
                  <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-50">
                    {PROGRESS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedProgress(opt.value);
                          handleApplyFilter({ progressState: opt.value });
                        }}
                        className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                          selectedProgress === opt.value
                            ? "bg-emerald-50 text-emerald-800 font-semibold"
                            : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown Sắp xếp */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "sort" ? null : "sort")
                  }
                  className="w-full lg:w-auto min-w-[155px] flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-zinc-300 bg-white transition-colors"
                >
                  <span className="flex items-center gap-2 truncate">
                    <SortIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="truncate">{currentSortName}</span>
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>

                {openDropdown === "sort" && (
                  <div className="absolute top-full left-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-50">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedSort(opt.value);
                          handleApplyFilter({ sortBy: opt.value });
                        }}
                        className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                          selectedSort === opt.value
                            ? "bg-emerald-50 text-emerald-800 font-semibold"
                            : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ô tìm kiếm */}
              <div className="relative flex-1 min-w-0">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleApplyFilter();
                    }
                  }}
                  placeholder="Tìm kiếm truyện, tác giả..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 placeholder-zinc-400 bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                />
              </div>

              {/* Nút Tìm kiếm */}
              <button
                type="button"
                onClick={() => handleApplyFilter()}
                className="shrink-0 px-6 py-2.5 bg-[#0d5c46] hover:bg-[#084232] text-white text-sm font-semibold rounded-xl transition-colors shadow-xs active:scale-[0.98]"
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>

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
          {/* CỘT TRÁI: DANH SÁCH TRUYỆN */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-4">
            {isLoadingStories ? (
              // Skeleton loading
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
              // Empty state
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
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm rounded-xl font-medium transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              // Danh sách Stories Cards
              storiesList.map((story) => {
                const primaryGenre =
                  story.genres && story.genres.length > 0
                    ? story.genres[0].name
                    : "Chưa phân loại";
                const isCompleted = story.progressState === "COMPLETED";

                return (
                  <div
                    key={story._id}
                    className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 sm:gap-5"
                  >
                    {/* Bìa truyện */}
                    <div className="relative w-28 h-38 sm:w-32 sm:h-44 shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60 shadow-2xs self-center sm:self-start">
                      {/* Badge "Mới" */}
                      <span className="absolute top-2 left-2 z-10 bg-zinc-900/90 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        Mới
                      </span>

                      {story.coverUrl ? (
                        <Image
                          src={story.coverUrl}
                          alt={story.title}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 112px, 128px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-white flex flex-col items-center justify-center p-2 text-center">
                          <BookIcon className="w-8 h-8 text-zinc-400 mb-1" />
                          <span className="text-[10px] line-clamp-2 font-medium">
                            {story.title}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Nội dung truyện ở giữa */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Tiêu đề */}
                        <Link
                          href={`/truyen/${story.slug}`}
                          className="text-base sm:text-lg font-bold text-zinc-900 hover:text-emerald-700 transition-colors line-clamp-2 leading-snug mb-2 font-sans"
                        >
                          {story.title}
                        </Link>

                        {/* Metadata hàng 1 */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 mb-1.5">
                          <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-medium">
                            {primaryGenre}
                          </span>
                          <span>
                            Tác giả:{" "}
                            <span className="text-zinc-900 font-medium">
                              {story.author?.name || "Đại Hiệp Mèo"}
                            </span>
                          </span>
                        </div>

                        {/* Cập nhật gần nhất */}
                        <div className="text-[11px] sm:text-xs text-zinc-400 mb-2.5">
                          Cập nhật gần nhất: {formatDateTime(story.updatedAt)}
                        </div>

                        {/* Mô tả tóm tắt */}
                        <p className="text-xs sm:text-sm text-zinc-600 line-clamp-2 leading-relaxed mb-3">
                          {story.description || "Tác phẩm chưa có mô tả tóm tắt."}
                        </p>
                      </div>

                      {/* Tag thể loại phía dưới */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {story.genres?.map((g) => (
                          <span
                            key={g._id}
                            className="bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 text-[11px] px-2.5 py-0.5 rounded-md transition-colors"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Cột thống kê & Nút thao tác bên phải card */}
                    <div className="sm:w-36 shrink-0 flex flex-col justify-between sm:items-end border-t sm:border-t-0 sm:border-l sm:border-zinc-100 pt-3 sm:pt-0 sm:pl-4 text-xs">
                      {/* Thống kê: Yêu cầu của bạn: Chương chưa làm để UI "0 chương" */}
                      <div className="space-y-1.5 text-zinc-600 sm:text-right w-full">
                        <div className="flex sm:justify-end items-center gap-1.5 text-zinc-700">
                          <BookIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-medium">0 chương</span>
                        </div>
                        <div className="flex sm:justify-end items-center gap-1.5 text-zinc-500">
                          <EyeIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formatNumber(story.stats?.viewCount)} lượt đọc</span>
                        </div>
                        <div className="flex sm:justify-end items-center gap-1.5 text-zinc-500">
                          <ClockIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formatRelativeTime(story.updatedAt)}</span>
                        </div>
                        <div className="pt-0.5 sm:text-right font-medium text-emerald-800 text-[11px]">
                          {isCompleted ? "Hoàn thành" : "Đang ra"}
                        </div>
                      </div>

                      {/* Nút Đọc ngay & Bookmark */}
                      <div className="flex items-center gap-2 mt-3 sm:mt-auto">
                        <Link
                          href={`/truyen/${story.slug}`}
                          className="px-3.5 py-1.5 bg-[#0d5c46] hover:bg-[#084232] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                        >
                          Đọc ngay
                        </Link>
                        <button
                          type="button"
                          title="Lưu truyện"
                          className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors"
                        >
                          <BookmarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Phân trang (Pagination) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-6 pb-4">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handleApplyFilter({ page: currentPage - 1 })}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  // Rút gọn trang nếu quá nhiều trang
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
                        className={`min-w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: TRUYỆN NỔI BẬT (TOP-VIEWS) */}
          <div className="lg:col-span-4 xl:col-span-4">
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs sticky top-24">
              {/* Header Widget */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                  Truyện nổi bật
                </h2>
                <Link
                  href="/bang-xep-hang"
                  className="text-xs text-zinc-500 hover:text-emerald-700 transition-colors"
                >
                  Xem tất cả
                </Link>
              </div>

              {/* Danh sách 6 truyện nổi bật */}
              {isLoadingTopViews ? (
                <div className="space-y-3.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-5 h-5 bg-zinc-200 rounded shrink-0" />
                      <div className="w-10 h-14 bg-zinc-200 rounded shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 bg-zinc-200 rounded w-3/4" />
                        <div className="h-3 bg-zinc-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {topViewsData?.slice(0, 6).map((item, index) => {
                    const rank = index + 1;
                    const rankBadgeStyle =
                      rank === 1
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : rank === 2
                        ? "bg-orange-100 text-orange-800 font-bold"
                        : rank === 3
                        ? "bg-yellow-100 text-yellow-800 font-bold"
                        : "bg-zinc-100 text-zinc-600 font-medium";

                    return (
                      <Link
                        key={item._id}
                        href={`/truyen/${item.slug}`}
                        className="group flex items-center gap-3 p-1 rounded-xl hover:bg-zinc-50/80 transition-colors"
                      >
                        {/* Thứ hạng */}
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 ${rankBadgeStyle}`}
                        >
                          {rank}
                        </span>

                        {/* Thumbnail bìa truyện */}
                        <div className="relative w-10 h-14 rounded overflow-hidden shrink-0 bg-zinc-100 border border-zinc-200/60 shadow-2xs">
                          {item.coverUrl ? (
                            <Image
                              src={item.coverUrl}
                              alt={item.title}
                              fill
                              unoptimized
                              sizes="40px"
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 text-zinc-400 flex items-center justify-center">
                              <BookIcon className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Thông tin truyện */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-tight">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-1">
                            {item.author} • {formatNumber(item.viewCount)} lượt đọc
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafaf8] py-8 flex items-center justify-center">
          <div className="text-sm text-zinc-500 animate-pulse">
            Đang tải danh sách truyện...
          </div>
        </div>
      }
    >
      <StoriesContent />
    </Suspense>
  );
}
