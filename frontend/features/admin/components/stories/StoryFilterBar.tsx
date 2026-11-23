"use client";

import { useAllCategories } from "@/features/categories";

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  selectedGenreId: string;
  onGenreChange: (genreId: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function StoryFilterBar({
  search,
  onSearchChange,
  selectedGenreId,
  onGenreChange,
  sortBy,
  onSortChange,
  onRefresh,
  isRefreshing,
}: Props) {
  // Lấy toàn bộ thể loại để chọn lọc
  const { data: categories = [] } = useAllCategories();

  return (
    <div className="admin-filter-bar bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-admin-card flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
      {/* Ô tìm kiếm */}
      <div className="relative flex-1 xl:max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên truyện, slug, bút danh hoặc email tác giả..."
          className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-admin-brand-500 focus:bg-white focus:ring-4 focus:ring-admin-brand-500/10 transition-all text-gray-800 placeholder-gray-400 font-medium"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Lọc theo Thể loại & Sắp xếp & Làm mới */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Dropdown Thể loại */}
        <select
          value={selectedGenreId}
          onChange={(e) => onGenreChange(e.target.value)}
          className="px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-admin-brand-500 focus:bg-white focus:ring-4 focus:ring-admin-brand-500/10 text-gray-700 cursor-pointer font-medium transition-all"
        >
          <option value="">Tất cả thể loại</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Dropdown Sắp xếp */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-admin-brand-500 focus:bg-white focus:ring-4 focus:ring-admin-brand-500/10 text-gray-700 cursor-pointer font-medium transition-all"
        >
          <option value="createdAt">Mới tạo nhất</option>
          <option value="updatedAt">Cập nhật mới nhất</option>
          <option value="viewsToday">Lượt xem hôm nay cao nhất</option>
          <option value="viewsWeek">Lượt xem 7 ngày cao nhất</option>
          <option value="viewsMonth">Lượt xem 30 ngày cao nhất</option>
          <option value="viewsYear">Lượt xem năm nay cao nhất</option>
          <option value="viewCount">Tổng lượt xem cao nhất</option>
          <option value="chapterCount">Nhiều chương nhất</option>
          <option value="title">Tên truyện (A-Z)</option>
        </select>

        {/* Nút Làm mới */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-3 border border-gray-300 text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-admin-card"
          title="Tải lại dữ liệu"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-admin-brand-600" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
