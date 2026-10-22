import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { AuthorStoryItem, PublicAuthorProfile, PaginationMeta } from "@/features/author";

interface AuthorStoriesTabProps {
  author: PublicAuthorProfile;
  stories: AuthorStoryItem[];
  isLoading: boolean;
  searchKeyword: string;
  onSearchChange: (val: string) => void;
  debouncedSearch: string;
  progressTab: string;
  onProgressTabChange: (tab: string) => void;
  sortBy: "latest" | "views" | "rating" | "chapters";
  onSortByChange: (sort: "latest" | "views" | "rating" | "chapters") => void;
  pagination?: PaginationMeta;
  currentPage: number;
  onPageChange: (page: number) => void;
  formatNumber: (num?: number) => string;
}

export function AuthorStoriesTab({
  author,
  stories,
  isLoading,
  searchKeyword,
  onSearchChange,
  debouncedSearch,
  progressTab,
  onProgressTabChange,
  sortBy,
  onSortByChange,
  pagination,
  currentPage,
  onPageChange,
  formatNumber,
}: AuthorStoriesTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE7DF] p-5 sm:p-7 shadow-xs space-y-6">
      {/* Search, Filter & Sort */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#EDE7DF]">
        <div className="relative w-full lg:w-72">
          <svg
            className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm tác phẩm của tác giả..."
            className="w-full pl-10 pr-8 py-2 text-sm bg-[#FAF7F2] text-stone-800 placeholder:text-stone-400 rounded-xl border border-[#EDE7DF] focus:border-[#8B1E2D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E2D]/10 transition-all"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
              aria-label="Xóa tìm kiếm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
          {/* Progress Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => onProgressTabChange("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                progressTab === "ALL"
                  ? "bg-[#8B1E2D] text-white"
                  : "bg-[#FAF7F2] text-stone-600 hover:bg-[#F2ECE2] border border-[#EDE7DF]"
              }`}
            >
              Tất cả ({author.counts?.all ?? author.storyCount ?? 0})
            </button>

            <button
              type="button"
              onClick={() => onProgressTabChange("ONGOING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                progressTab === "ONGOING"
                  ? "bg-emerald-800 text-white"
                  : "bg-[#FAF7F2] text-stone-600 hover:bg-[#F2ECE2] border border-[#EDE7DF]"
              }`}
            >
              Đang ra ({author.counts?.ongoing ?? 0})
            </button>

            <button
              type="button"
              onClick={() => onProgressTabChange("COMPLETED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                progressTab === "COMPLETED"
                  ? "bg-stone-800 text-white"
                  : "bg-[#FAF7F2] text-stone-600 hover:bg-[#F2ECE2] border border-[#EDE7DF]"
              }`}
            >
              Hoàn thành ({author.counts?.completed ?? 0})
            </button>
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label htmlFor="sort-select" className="text-xs text-stone-500 font-medium whitespace-nowrap hidden sm:inline">
              Sắp xếp:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FAF7F2] text-stone-800 border border-[#EDE7DF] focus:outline-none focus:ring-2 focus:ring-[#8B1E2D]/20 cursor-pointer shadow-2xs"
            >
              <option value="latest">Mới cập nhật</option>
              <option value="views">Lượt xem nhiều</option>
              <option value="rating">Đánh giá cao</option>
              <option value="chapters">Số chương nhiều</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF] animate-pulse" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="py-14 px-4 text-center rounded-2xl bg-[#FAF7F2] border border-dashed border-[#EDE7DF]">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white text-[#8B1E2D] flex items-center justify-center text-2xl shadow-2xs border border-[#EDE7DF]">
            📚
          </div>
          <h3 className="text-base font-bold text-stone-800 font-serif">
            Không tìm thấy tác phẩm phù hợp
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
            {debouncedSearch
              ? `Không có tác phẩm nào khớp với từ khóa "${debouncedSearch}". Thử tìm kiếm với từ khóa khác.`
              : progressTab !== "ALL"
              ? "Tác giả hiện chưa có tác phẩm nào trong trạng thái này."
              : "Tác giả hiện chưa xuất bản tác phẩm công khai nào."}
          </p>
          {(debouncedSearch || progressTab !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                onProgressTabChange("ALL");
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#8B1E2D] text-white hover:bg-[#721422] transition-colors cursor-pointer"
            >
              Xem tất cả tác phẩm
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {stories.map((story: AuthorStoryItem) => (
            <article
              key={story._id}
              className="group flex gap-4 p-3.5 sm:p-4 rounded-xl bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] border border-[#EDE7DF] hover:border-[#8B1E2D]/30 transition-colors shadow-2xs"
            >
              {/* Cover */}
              <Link
                href={`/truyen/${story.slug}`}
                className="relative w-24 sm:w-28 md:w-32 aspect-[3/4] shrink-0 rounded-xl overflow-hidden shadow-2xs border border-[#EDE7DF] bg-stone-100 block group"
              >
                {story.coverUrl ? (
                  <Image
                    src={story.coverUrl}
                    alt={story.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 96px, 128px"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-[#EAE3D9] to-[#DED4C7]">
                    <span className="text-2xl mb-1">📖</span>
                    <span className="text-[10px] font-semibold text-stone-700 line-clamp-2">
                      {story.title}
                    </span>
                  </div>
                )}

                {/* Progress badge */}
                <div className="absolute top-1.5 left-1.5">
                  {story.progressState === "COMPLETED" ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-900/85 text-white backdrop-blur-xs">
                      Hoàn thành
                    </span>
                  ) : story.progressState === "ON_HOLD" ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-800/85 text-white backdrop-blur-xs">
                      Tạm ngưng
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8B1E2D]/90 text-white backdrop-blur-xs">
                      Đang ra
                    </span>
                  )}
                </div>

                {/* Chapter count */}
                <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/70 text-white backdrop-blur-xs">
                  {story.stats?.chapterCount || 0} ch
                </div>
              </Link>

              {/* Story info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="space-y-1.5">
                  {story.genres && story.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {story.genres.slice(0, 2).map((g) => (
                        <span
                          key={g._id}
                          className="text-[11px] font-medium text-[#8B1E2D] bg-white border border-[#8B1E2D]/15 px-2 py-0.5 rounded-md"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <h3 className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#8B1E2D] transition-colors line-clamp-1 font-serif">
                    <Link href={`/truyen/${story.slug}`}>{story.title}</Link>
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {story.description || "Tác phẩm chưa có tóm tắt nội dung giới thiệu."}
                  </p>
                </div>

                <div className="pt-2.5 mt-2 border-t border-[#EDE7DF]/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-xs text-stone-500">
                    <span className="inline-flex items-center gap-1" title="Lượt đọc">
                      <span>👁️</span>
                      <span className="font-medium text-stone-700">{formatNumber(story.stats?.viewCount || 0)}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-amber-600" title="Điểm đánh giá">
                      <span>⭐</span>
                      <span className="font-medium">{story.stats?.ratingAverage > 0 ? story.stats.ratingAverage.toFixed(1) : "5.0"}</span>
                    </span>
                  </div>

                  <Link
                    href={`/truyen/${story.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-[#8B1E2D] hover:bg-[#721422] text-white transition-colors shadow-2xs shrink-0"
                  >
                    <span>Đọc truyện</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pt-4 flex items-center justify-center gap-1.5 border-t border-[#EDE7DF]">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={!pagination.hasPrevPage}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FAF7F2] text-stone-700 border border-[#EDE7DF] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F2ECE2] transition-colors cursor-pointer"
          >
            Trước
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                pageNum === currentPage
                  ? "bg-[#8B1E2D] text-white shadow-2xs"
                  : "bg-[#FAF7F2] text-stone-700 border border-[#EDE7DF] hover:bg-[#F2ECE2]"
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPageChange(Math.min(currentPage + 1, pagination.totalPages))}
            disabled={!pagination.hasNextPage}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FAF7F2] text-stone-700 border border-[#EDE7DF] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F2ECE2] transition-colors cursor-pointer"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
