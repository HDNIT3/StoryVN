import React from "react";
import type { CategoryItem } from "@/features/categories";

interface AuthorListFilterBarProps {
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  sortBy: "featured" | "newest" | "updated" | "stories";
  onSortByChange: (val: "featured" | "newest" | "updated" | "stories") => void;
  selectedGenre: string;
  onSelectedGenreChange: (val: string) => void;
  selectedProgress: string;
  onSelectedProgressChange: (val: string) => void;
  selectedBio: "all" | "yes" | "no";
  onSelectedBioChange: (val: "all" | "yes" | "no") => void;
  categories: CategoryItem[];
  onApply: () => void;
  onReset: () => void;
}

export function AuthorListFilterBar({
  searchInput,
  onSearchInputChange,
  sortBy,
  onSortByChange,
  selectedGenre,
  onSelectedGenreChange,
  selectedProgress,
  onSelectedProgressChange,
  selectedBio,
  onSelectedBioChange,
  categories,
  onApply,
  onReset,
}: AuthorListFilterBarProps) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 items-end">
        {/* Search Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="search-author"
            className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
          >
            TÌM TÁC GIẢ
          </label>
          <div className="relative">
            <input
              id="search-author"
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onApply();
              }}
              placeholder="Tên tác giả, bút danh hoặc slug"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#8b181b]/30 focus:border-[#8b181b] transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => onSearchInputChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-1.5">
          <label
            htmlFor="sort-by"
            className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
          >
            SẮP XẾP
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#8b181b]/30 cursor-pointer shadow-none"
          >
            <option value="featured">Nổi bật</option>
            <option value="newest">Mới tham gia</option>
            <option value="updated">Mới cập nhật</option>
            <option value="stories">Nhiều tác phẩm</option>
          </select>
        </div>

        {/* Genre */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-genre"
            className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
          >
            THỂ LOẠI
          </label>
          <select
            id="filter-genre"
            value={selectedGenre}
            onChange={(e) => onSelectedGenreChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#8b181b]/30 cursor-pointer shadow-none"
          >
            <option value="">Tất cả thể loại</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Story Status */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-progress"
            className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
          >
            TRẠNG THÁI TRUYỆN
          </label>
          <select
            id="filter-progress"
            value={selectedProgress}
            onChange={(e) => onSelectedProgressChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#8b181b]/30 cursor-pointer shadow-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ONGOING">Đang ra</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="ON_HOLD">Tạm ngưng</option>
          </select>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-bio"
            className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
          >
            TIỂU SỬ
          </label>
          <select
            id="filter-bio"
            value={selectedBio}
            onChange={(e) => onSelectedBioChange(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#8b181b]/30 cursor-pointer shadow-none"
          >
            <option value="all">Tất cả tác giả</option>
            <option value="yes">Đã có tiểu sử</option>
            <option value="no">Chưa có tiểu sử</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="space-y-1.5 flex flex-col justify-end">
          <span className="block text-[11px] font-bold text-transparent select-none uppercase tracking-wider hidden xl:block">
            THAO TÁC
          </span>
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={onApply}
              className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors whitespace-nowrap cursor-pointer text-center"
            >
              Áp dụng
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-3.5 py-2.5 rounded-xl font-medium text-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors whitespace-nowrap cursor-pointer text-center"
              title="Đặt lại bộ lọc"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
