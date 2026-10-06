"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { usePublicStories } from "@/lib/hooks/queries/usePublicStoryQuery";
import { useCategories } from "@/lib/hooks/queries/useCategoryQuery";
import type { PublicStoryItem } from "@/types/public-story";
import { DEFAULT_GENRES } from "@/components/layout/header/header.constants";

// Map emoji/icon gợi ý cho các thể loại phổ biến
const GENRE_EMOJIS: Record<string, string> = {
  "tien-hiep": "⚔️",
  "huyen-huyen": "🌌",
  "do-thi": "🏙️",
  "ngon-tinh": "💖",
  "trong-sinh": "🔄",
  "kiem-hiep": "🗡️",
  "khoa-huyen": "🚀",
  "vong-du": "🎮",
  "di-gioi": "🔮",
  "lanh-chua-xay-thanh": "🏰",
  "tong-mon-xay-dung": "🏯",
  "dam-my": "🌸",
  "bach-hop": "🌺",
  "mat-the": "🧟",
  "xuyen-nhanh": "⚡",
  "dong-nhan": "🎭",
  "hai-huoc": "😂",
  "co-dai": "📜",
  "cung-dau": "👑",
  "dien-van": "🌾",
  "hao-mon-the-gia": "💎",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return (n || 0).toString();
}

function getStoryAuthorName(story: PublicStoryItem): string {
  if (story.author?.penName) return story.author.penName;
  if (story.author?.displayName) return story.author.displayName;
  return "Tác giả ẩn danh";
}

function getGenreNames(story: PublicStoryItem): string[] {
  return (story.genreIds || []).map((g) => (typeof g === "string" ? g : g.name));
}

function getProgressLabel(state?: string) {
  if (state === "COMPLETED") return { label: "Hoàn thành", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (state === "ON_HOLD") return { label: "Tạm ngưng", color: "text-amber-700 bg-amber-50 border-amber-200" };
  return { label: "Đang ra", color: "text-sky-700 bg-sky-50 border-sky-200" };
}

function StoryCard({ story }: { story: PublicStoryItem }) {
  const progress = getProgressLabel(story.progressState);
  const genres = getGenreNames(story);
  const author = getStoryAuthorName(story);

  return (
    <Link
      href={`/truyen/${story.slug || story._id}`}
      className="group flex flex-col bg-white rounded-2xl border border-zinc-200/80 overflow-hidden hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-200"
    >
      <div className="relative aspect-[2/3] bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
        {story.coverUrl ? (
          <Image
            src={story.coverUrl}
            alt={story.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            📖
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-semibold drop-shadow">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {formatNumber(story.stats?.viewCount || 0)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            {formatNumber(story.stats?.likeCount || 0)}
          </span>
        </div>
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
            {story.title}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 truncate">
            {author}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${progress.color}`}>
              {progress.label}
            </span>
            {genres.slice(0, 1).map((g) => (
              <span key={g} className="text-[10px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full font-medium">
                {g}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1 font-semibold text-amber-600">
            ★ {(story.stats?.ratingAverage || 0).toFixed(1)}
          </span>
          <span>{formatNumber(story.stats?.chapterCount || 0)} chương</span>
        </div>
      </div>
    </Link>
  );
}

function TheLoaiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedGenre = searchParams.get("genre") || "";
  const initialSort = searchParams.get("sortBy") || "viewCount";
  const initialProgress = searchParams.get("progressState") || "";
  const initialSearch = searchParams.get("search") || "";

  const [sortBy, setSortBy] = useState(initialSort);
  const [progressState, setProgressState] = useState(initialProgress);
  const [keyword, setKeyword] = useState(initialSearch);
  const [page, setPage] = useState(1);

  // Lấy danh mục thể loại từ backend
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories({
    all: true,
    isActive: true,
  });

  const categories = useMemo(() => {
    const items = categoriesData?.items;
    if (items && items.length > 0) {
      return items;
    }
    return DEFAULT_GENRES.map((g) => ({
      _id: g.id,
      name: g.name,
      slug: g.id,
      description: "",
      isActive: true,
    }));
  }, [categoriesData]);

  // Thông tin thể loại hiện tại đang chọn
  const currentCategoryInfo = useMemo(() => {
    if (!selectedGenre) return null;
    return categories.find(
      (c) => c.slug === selectedGenre || c._id === selectedGenre
    );
  }, [categories, selectedGenre]);

  // Query truyện theo thể loại và các bộ lọc
  const { data: storiesData, isLoading: storiesLoading } = usePublicStories({
    genre: selectedGenre || undefined,
    search: keyword || undefined,
    sortBy: sortBy as any,
    progressState: (progressState as any) || undefined,
    page,
    limit: 20,
  });

  const stories = storiesData?.items || [];
  const totalPages = storiesData?.pagination?.totalPages || 1;
  const totalItems = storiesData?.pagination?.totalItems || 0;

  const handleSelectGenre = (slugOrId: string) => {
    setPage(1);
    if (!slugOrId) {
      router.push("/the-loai");
    } else {
      router.push(`/the-loai?genre=${encodeURIComponent(slugOrId)}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-16">
      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-900 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-indigo-950">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-sky-200 font-semibold">
            <span>🏷️</span>
            <span>Khám Phá Toàn Diện</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            {currentCategoryInfo ? `Thể Loại: ${currentCategoryInfo.name}` : "Tất Cả Thể Loại Truyện"}
          </h1>
          <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {currentCategoryInfo?.description
              ? currentCategoryInfo.description
              : "Tìm kiếm các câu chuyện hấp dẫn thuộc các dòng Tiên Hiệp, Huyền Huyễn, Đô Thị, Ngôn Tình, Trùng Sinh và hàng chục thể loại phong phú khác."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* ── Category Chips Bar ───────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-md p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>📂</span> Danh Mục Thể Loại ({categories.length})
            </span>
            {selectedGenre && (
              <button
                type="button"
                onClick={() => handleSelectGenre("")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
              >
                ✕ Xóa chọn thể loại
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {/* Chip Tất cả */}
            <button
              type="button"
              onClick={() => handleSelectGenre("")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                !selectedGenre
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                  : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              🌟 Tất cả thể loại
            </button>

            {categories.map((cat) => {
              const catKey = cat.slug || cat._id;
              const isSelected = selectedGenre === catKey || selectedGenre === cat._id || selectedGenre === cat.name;
              const emoji = GENRE_EMOJIS[catKey] || "📖";

              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => handleSelectGenre(cat.slug || cat._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                      : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Toolbar & Filters ────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="text-xs sm:text-sm font-semibold text-zinc-700">
            Tìm thấy <span className="font-black text-indigo-600">{totalItems}</span> bộ truyện
            {currentCategoryInfo ? ` thuộc "${currentCategoryInfo.name}"` : ""}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search within genre */}
            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                placeholder="Tìm truyện..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <svg className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
            </div>

            {/* Sắp xếp */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-xl border border-zinc-200 px-3 py-1.5 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="viewCount">🔥 Nhiều xem nhất</option>
              <option value="likeCount">❤️ Nhiều like nhất</option>
              <option value="ratingAverage">⭐ Đánh giá cao</option>
              <option value="followCount">🔖 Nhiều theo dõi</option>
              <option value="updatedAt">🕒 Mới cập nhật</option>
              <option value="chapterCount">📚 Nhiều chương</option>
            </select>

            {/* Tiến độ */}
            <select
              value={progressState}
              onChange={(e) => {
                setProgressState(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-xl border border-zinc-200 px-3 py-1.5 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="">Tất cả tiến độ</option>
              <option value="ONGOING">Đang ra</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="ON_HOLD">Tạm ngưng</option>
            </select>
          </div>
        </div>

        {/* ── Story Grid ───────────────────────────────────────────────────── */}
        <div className="mt-6">
          {storiesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white p-3 rounded-2xl border border-zinc-200">
                  <div className="aspect-[2/3] bg-zinc-200 rounded-xl mb-3" />
                  <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner">
                🔍
              </div>
              <h3 className="text-base font-bold text-zinc-800">Không tìm thấy truyện phù hợp</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Hiện chưa có truyện nào thuộc thể loại này hoặc theo bộ lọc hiện tại. Bạn hãy thử chọn thể loại khác nhé!
              </p>
              <button
                type="button"
                onClick={() => handleSelectGenre("")}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Xem tất cả truyện
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {stories.map((story) => (
                <StoryCard key={story._id} story={story} />
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3.5 py-2 text-xs font-semibold border border-zinc-200 bg-white rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Trang trước
            </button>
            <span className="text-xs text-zinc-600 font-bold px-3">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3.5 py-2 text-xs font-semibold border border-zinc-200 bg-white rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Trang sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TheLoaiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center">Đang tải thể loại...</div>}>
      <TheLoaiContent />
    </Suspense>
  );
}
