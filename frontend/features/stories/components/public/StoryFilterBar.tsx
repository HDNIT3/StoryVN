"use client";

import React, { useRef, useEffect } from "react";
import type { CategoryItem } from "@/features/categories";
import type { StoryProgressState, StorySortOption } from "@/features/stories";
import { GridIcon, BookmarkIcon, SortIcon, SearchIcon, ChevronDownIcon } from "./StoryIcons";

export const SORT_OPTIONS: { label: string; value: StorySortOption }[] = [
  { label: "Mới xuất bản", value: "published" },
  { label: "Mới cập nhật", value: "updated" },
  { label: "Lượt đọc nhiều nhất", value: "views" },
  { label: "Nhiều chương nhất", value: "chapters" },
  { label: "Đánh giá cao nhất", value: "rating" },
];

export const PROGRESS_OPTIONS: { label: string; value: StoryProgressState | "" }[] = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Hoàn thành", value: "COMPLETED" },
  { label: "Đang ra", value: "ONGOING" },
  { label: "Tạm ngưng", value: "ON_HOLD" },
];

interface StoryFilterBarProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  selectedGenre: string;
  setSelectedGenre: (val: string) => void;
  selectedProgress: string;
  setSelectedProgress: (val: string) => void;
  selectedSort: StorySortOption;
  setSelectedSort: (val: StorySortOption) => void;
  genresData: CategoryItem[];
  currentGenreName: string;
  currentProgressName: string;
  currentSortName: string;
  openDropdown: "genre" | "progress" | "sort" | null;
  setOpenDropdown: (val: "genre" | "progress" | "sort" | null) => void;
  onApplyFilter: (overrideParams?: {
    search?: string;
    genre?: string;
    progressState?: string;
    sortBy?: StorySortOption;
    page?: number;
  }) => void;
}

export const StoryFilterBar: React.FC<StoryFilterBarProps> = ({
  searchInput,
  setSearchInput,
  selectedGenre,
  setSelectedGenre,
  selectedProgress,
  setSelectedProgress,
  selectedSort,
  setSelectedSort,
  genresData,
  currentGenreName,
  currentProgressName,
  currentSortName,
  openDropdown,
  setOpenDropdown,
  onApplyFilter,
}) => {
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpenDropdown]);

  return (
    <div
      ref={filterRef}
      className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-xs mb-6 z-20"
    >
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

        {/* Filters */}
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
                    onApplyFilter({ genre: "" });
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
                        onApplyFilter({ genre: val });
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
                      onApplyFilter({ progressState: opt.value });
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
                      onApplyFilter({ sortBy: opt.value });
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
                  onApplyFilter();
                }
              }}
              placeholder="Tìm kiếm truyện, tác giả..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 placeholder-zinc-400 bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
            />
          </div>

          {/* Nút Tìm kiếm */}
          <button
            type="button"
            onClick={() => onApplyFilter()}
            className="shrink-0 px-6 py-2.5 bg-[#0d5c46] hover:bg-[#084232] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Tìm kiếm
          </button>
        </div>
      </div>
    </div>
  );
};
