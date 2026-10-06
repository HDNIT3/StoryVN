"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useTopStoriesByViews,
  useTopStoriesByLikes,
  usePublicStories,
} from "@/lib/hooks/queries/usePublicStoryQuery";
import { useCategories } from "@/lib/hooks/queries/useCategoryQuery";
import { DEFAULT_GENRES } from "@/components/layout/header/header.constants";
import type { PublicStoryItem } from "@/types/public-story";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatUpdateDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

function formatPublishDate(dateStr?: string | null): string {
  if (!dateStr) return "Mới";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Mới";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `Đăng ${day}/${month}`;
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
  if (state === "COMPLETED") return { label: "Hoàn thành", color: "text-emerald-600 bg-emerald-50" };
  if (state === "ON_HOLD") return { label: "Tạm ngưng", color: "text-amber-600 bg-amber-50" };
  return { label: "Đang ra", color: "text-sky-600 bg-sky-50" };
}

// ── Story Card (dạng vertical, dùng cho top like / danh sách) ──────────────

function StoryCard({ story }: { story: PublicStoryItem }) {
  const progress = getProgressLabel(story.progressState);
  const genres = getGenreNames(story);
  const author = getStoryAuthorName(story);

  return (
    <Link
      href={`/truyen/${story.slug || story._id}`}
      className="group block bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-lg hover:border-zinc-300 transition-all duration-200"
    >
      {/* Cover */}
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
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Stats overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-2 text-white text-xs font-medium">
          <span className="flex items-center gap-1 drop-shadow">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
            {formatNumber(story.stats?.viewCount || 0)}
          </span>
          <span className="flex items-center gap-1 drop-shadow">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
            {formatNumber(story.stats?.likeCount || 0)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {story.title}
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5 truncate">{author}</p>
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${progress.color}`}>
            {progress.label}
          </span>
          {genres.slice(0, 1).map((g) => (
            <span key={g} className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-full">
              {g}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
          <span className="flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
            {(story.stats?.ratingAverage || 0).toFixed(1)}
          </span>
          <span>{formatNumber(story.stats?.chapterCount || 0)} ch.</span>
        </div>
      </div>
    </Link>
  );
}

// ── Hero Slider cho Top View ───────────────────────────────────────────────────

function HeroSlider({ stories }: { stories: PublicStoryItem[] }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % stories.length);
  }, [stories.length]);

  useEffect(() => {
    if (!stories.length) return;
    timerRef.current = setInterval(next, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, stories.length]);

  if (!stories.length) return null;

  const story = stories[active];
  const genres = getGenreNames(story);
  const author = getStoryAuthorName(story);
  const progress = getProgressLabel(story.progressState);

  return (
    <div className="relative h-[460px] md:h-[520px] overflow-hidden rounded-2xl bg-zinc-900">
      {/* BG Image */}
      {story.coverUrl ? (
        <Image
          src={story.coverUrl}
          alt={story.title}
          fill
          className="object-cover opacity-40 scale-110 blur-sm transition-all duration-700"
          sizes="100vw"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full flex items-end pb-8 px-6 md:px-10">
        <div className="flex gap-6 items-end w-full max-w-4xl">
          {/* Book Cover */}
          <div className="hidden sm:block relative w-28 md:w-36 shrink-0">
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-white/10">
              {story.coverUrl ? (
                <Image
                  src={story.coverUrl}
                  alt={story.title}
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-purple-800 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Rank badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                TOP #{active + 1} Lượt xem
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${progress.color}`}>
                {progress.label}
              </span>
            </div>

            <h2 className="text-2xl md:text-4xl font-extrabold text-white line-clamp-2 leading-tight drop-shadow-lg">
              {story.title}
            </h2>
            <p className="text-zinc-300 text-sm mt-1">{author}</p>

            {/* Genre tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {genres.slice(0, 3).map((g) => (
                <span key={g} className="text-xs text-white/70 bg-white/10 border border-white/10 px-2 py-0.5 rounded-full">
                  {g}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-zinc-400 text-sm mt-3 line-clamp-2 max-w-xl">
              {story.description || "Không có mô tả."}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                {formatNumber(story.stats?.viewCount || 0)}
              </span>
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                {formatNumber(story.stats?.likeCount || 0)}
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                {(story.stats?.ratingAverage || 0).toFixed(1)}/5
              </span>
              <span className="text-zinc-400">{formatNumber(story.stats?.chapterCount || 0)} chương</span>
            </div>

            {/* CTA */}
            <Link
              href={`/truyen/${story.slug || story._id}`}
              className="inline-flex items-center gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-lg hover:shadow-indigo-500/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              Đọc ngay
            </Link>
          </div>
        </div>
      </div>

      {/* Dots nav */}
      <div className="absolute top-4 right-4 flex gap-1.5">
        {stories.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === active ? "bg-white w-6" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Mini top-view list (sidebar style) ─────────────────────────────────────

function TopViewSidebar({ stories }: { stories: PublicStoryItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
        <svg className="w-4 h-4 text-sky-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
        <span className="text-sm font-bold text-zinc-800">Top Lượt Xem</span>
      </div>
      <ul>
        {stories.slice(0, 8).map((story, i) => (
          <li key={story._id}>
            <Link
              href={`/truyen/${story.slug || story._id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors"
            >
              <span className={`text-sm font-bold w-5 text-center ${i < 3 ? "text-indigo-500" : "text-zinc-400"}`}>
                {i + 1}
              </span>
              <div className="relative w-9 h-12 shrink-0 rounded overflow-hidden bg-zinc-100">
                {story.coverUrl && (
                  <Image src={story.coverUrl} alt={story.title} fill className="object-cover" sizes="36px" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-800 line-clamp-1">{story.title}</p>
                <p className="text-[10px] text-sky-600 flex items-center gap-0.5 mt-0.5">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                  {formatNumber(story.stats?.viewCount || 0)} lượt xem
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Search & Filter Bar ────────────────────────────────────────────────────

interface FilterState {
  search: string;
  sortBy: string;
  genre: string;
  progressState: string;
}

function SearchFilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const handleSearch = (val: string) => {
    setLocalSearch(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange({ ...filters, search: val });
    }, 400);
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm tên truyện..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-zinc-400"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                onChange({ ...filters, search: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
          className="text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-zinc-700 bg-white cursor-pointer"
        >
          <option value="viewCount">Nhiều xem nhất</option>
          <option value="likeCount">Nhiều like nhất</option>
          <option value="followCount">Nhiều theo dõi nhất</option>
          <option value="ratingAverage">Đánh giá cao nhất</option>
          <option value="chapterCount">Nhiều chương nhất</option>
          <option value="updatedAt">Mới cập nhật</option>
          <option value="createdAt">Mới đăng</option>
        </select>

        {/* Progress */}
        <select
          value={filters.progressState}
          onChange={(e) => onChange({ ...filters, progressState: e.target.value })}
          className="text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-zinc-700 bg-white cursor-pointer"
        >
          <option value="">Tất cả tiến độ</option>
          <option value="ONGOING">Đang ra</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="ON_HOLD">Tạm ngưng</option>
        </select>
      </div>

      {/* Active filter badges */}
      {(filters.genre || filters.search) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 text-xs">
          <span className="text-zinc-400 font-medium">Đang lọc:</span>
          {filters.genre && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 font-medium">
              <span>Thể loại: <strong className="capitalize">{filters.genre}</strong></span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, genre: "" })}
                className="hover:text-indigo-900 cursor-pointer font-bold ml-0.5"
                title="Bỏ lọc thể loại này"
              >
                ✕
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 px-3 py-1 rounded-full border border-sky-200 font-medium">
              <span>Từ khóa: <strong>"{filters.search}"</strong></span>
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  onChange({ ...filters, search: "" });
                }}
                className="hover:text-sky-900 cursor-pointer font-bold ml-0.5"
                title="Bỏ tìm kiếm từ khóa này"
              >
                ✕
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setLocalSearch("");
              onChange({ ...filters, genre: "", search: "" });
            }}
            className="text-zinc-500 hover:text-red-600 text-xs hover:underline cursor-pointer ml-auto"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}

// ── Story List Grid ─────────────────────────────────────────────────────────

function StoryGrid({
  stories,
  isLoading,
}: {
  stories: PublicStoryItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-zinc-200 rounded-xl mb-3" />
            <div className="h-3 bg-zinc-200 rounded w-3/4 mb-1.5" />
            <div className="h-3 bg-zinc-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!stories.length) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
        <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-3">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-zinc-700">Không tìm thấy truyện phù hợp</p>
        <p className="text-xs text-zinc-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {stories.map((story) => (
        <StoryCard key={story._id} story={story} />
      ))}
    </div>
  );
}

// ── Top Like Row ────────────────────────────────────────────────────────────

function TopLikeRow({ stories }: { stories: PublicStoryItem[] }) {
  if (!stories.length) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-rose-500 rounded-full" />
          <h2 className="text-base font-bold text-zinc-900">Top Lượt Like</h2>
          <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
        </div>
        <Link href="/kham-pha?sortBy=likeCount" className="text-xs text-indigo-600 hover:underline font-medium">
          Xem tất cả →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {stories.slice(0, 6).map((story, i) => (
          <Link
            key={story._id}
            href={`/truyen/${story.slug || story._id}`}
            className="group block bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-md hover:border-rose-200 transition-all duration-200"
          >
            <div className="relative aspect-[2/3] bg-zinc-100 overflow-hidden">
              {story.coverUrl ? (
                <Image
                  src={story.coverUrl}
                  alt={story.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-pink-200" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                #{i + 1}
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-0.5 text-white text-[10px] font-semibold">
                <svg className="w-3 h-3 text-rose-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                {formatNumber(story.stats?.likeCount || 0)}
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs font-semibold text-zinc-800 line-clamp-2">{story.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Section: Mới Cập Nhật (Image 1) ────────────────────────────────────────

function LatestUpdatedSection() {
  const { data: updatedData, isLoading } = usePublicStories({
    sortBy: "updatedAt",
    sortOrder: "desc",
    limit: 10,
  });

  const stories = updatedData?.items || [];

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-wider uppercase inline-block">
            MỚI NHẤT
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
            Mới cập nhật
          </h2>
        </div>
        <Link
          href="/the-loai?sortBy=updatedAt"
          className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 hover:underline transition-colors pb-1"
        >
          Tất cả
        </Link>
      </div>

      {/* Table / List Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        {isLoading && (
          <div className="divide-y divide-zinc-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-3.5 animate-pulse">
                <div className="h-4 bg-zinc-200 rounded w-20 shrink-0" />
                <div className="h-4 bg-zinc-200 rounded w-1/3 flex-1" />
                <div className="h-4 bg-zinc-200 rounded w-36 shrink-0 hidden md:block" />
                <div className="h-4 bg-zinc-200 rounded w-28 shrink-0 hidden sm:block" />
                <div className="h-4 bg-zinc-200 rounded w-20 shrink-0 ml-auto" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && stories.length > 0 && (
          <div className="divide-y divide-zinc-100">
            {stories.map((story) => {
              const genreName =
                (story.genreIds && story.genreIds[0]
                  ? typeof story.genreIds[0] === "string"
                    ? story.genreIds[0]
                    : story.genreIds[0].name
                  : null) || "Tổng hợp";

              const authorName = getStoryAuthorName(story);
              const chapterLabel = story.stats?.chapterCount
                ? `Chương ${story.stats.chapterCount}`
                : "Chương 1";

              return (
                <Link
                  key={story._id}
                  href={`/truyen/${story.slug || story._id}`}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 hover:bg-zinc-50/80 transition-colors group text-sm"
                >
                  {/* Cột 1: Thể loại */}
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-600 w-24 sm:w-28 shrink-0 truncate">
                    {genreName}
                  </span>

                  {/* Cột 2: Tên truyện */}
                  <span className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors flex-1 min-w-[140px] truncate">
                    {story.title}
                  </span>

                  {/* Cột 3: Tên chương mới nhất */}
                  <span className="text-xs text-zinc-500 w-44 sm:w-56 shrink-0 truncate hidden md:block">
                    {chapterLabel}
                  </span>

                  {/* Cột 4: Tác giả */}
                  <span className="text-xs text-zinc-500 w-28 sm:w-36 shrink-0 truncate hidden sm:block">
                    {authorName}
                  </span>

                  {/* Cột 5: Thời gian */}
                  <span className="text-xs text-zinc-400 font-medium w-24 shrink-0 text-right">
                    {formatUpdateDateTime(story.updatedAt)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && stories.length === 0 && (
          <div className="py-8 text-center text-xs text-zinc-400 italic">
            Chưa có truyện cập nhật gần đây.
          </div>
        )}
      </div>
    </section>
  );
}

// ── Section: Truyện Mới Xuất Bản (Image 2) ──────────────────────────────────

function NewlyPublishedSection() {
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [sortBy, setSortBy] = useState<"createdAt" | "viewCount">("createdAt");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Danh mục thể loại
  const { data: categoriesData } = useCategories({ all: true, isActive: true });
  const rawItems = categoriesData?.items;
  const categories = useMemo(() => {
    if (rawItems && rawItems.length > 0) return rawItems;
    return DEFAULT_GENRES.map((g) => ({
      _id: g.id,
      name: g.name,
      slug: g.id,
      description: "",
    }));
  }, [rawItems]);

  // Query truyện mới xuất bản theo genre và sort
  const { data: storiesData, isLoading } = usePublicStories({
    sortBy,
    sortOrder: "desc",
    genre: selectedGenre || undefined,
    page: currentPage,
    limit: 6,
  });

  const stories = storiesData?.items || [];
  const totalPages = Math.min(storiesData?.pagination?.totalPages || 1, 3);

  const handleSelectGenre = (genreIdOrSlug: string) => {
    setSelectedGenre(genreIdOrSlug);
    setCurrentPage(1);
  };

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs font-bold text-red-800 tracking-wider uppercase inline-block">
            TRUYỆN MỚI
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif sm:font-sans text-zinc-900 tracking-tight mt-0.5">
            Truyện mới xuất bản
          </h2>
        </div>
        <Link
          href="/the-loai?sortBy=createdAt"
          className="text-xs font-semibold text-red-800 hover:text-red-900 hover:underline transition-colors pb-1"
        >
          Xem tất cả
        </Link>
      </div>

      {/* Main Card Container */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-7 shadow-2xs">
        {/* Filter bar: Genre pills + Sort buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-zinc-100">
          {/* Genre pills */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Tất cả */}
            <button
              type="button"
              onClick={() => handleSelectGenre("")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedGenre === ""
                  ? "bg-red-800 text-white shadow-xs"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              Tất cả
            </button>

            {/* Các thể loại */}
            {categories.slice(0, 7).map((cat) => {
              const isActive = selectedGenre === cat._id || selectedGenre === cat.slug;
              return (
                <button
                  type="button"
                  key={cat._id}
                  onClick={() => handleSelectGenre(cat.slug || cat._id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-red-800 text-white font-bold shadow-xs"
                      : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Sort toggle buttons */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-full shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setSortBy("createdAt");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                sortBy === "createdAt"
                  ? "bg-red-800 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Mới nhất
            </button>
            <button
              type="button"
              onClick={() => {
                setSortBy("viewCount");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                sortBy === "viewCount"
                  ? "bg-red-800 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Nhiều đọc
            </button>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="pt-4 pb-2">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center p-2 rounded-2xl animate-pulse">
                  <div className="w-14 h-20 bg-zinc-200 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-zinc-200 rounded w-4/5" />
                    <div className="h-3 bg-zinc-200 rounded w-1/2" />
                    <div className="h-3 bg-zinc-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && stories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {stories.map((story) => {
                const genreName =
                  (story.genreIds && story.genreIds[0]
                    ? typeof story.genreIds[0] === "string"
                      ? story.genreIds[0]
                      : story.genreIds[0].name
                    : null) || "Tổng hợp";

                const authorName = getStoryAuthorName(story);

                return (
                  <Link
                    key={story._id}
                    href={`/truyen/${story.slug || story._id}`}
                    className="flex gap-3 items-center group p-2.5 rounded-2xl hover:bg-zinc-50/90 transition-all border border-transparent hover:border-zinc-200/60"
                  >
                    {/* Ảnh bìa */}
                    <div className="relative w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200/80 shadow-2xs group-hover:shadow-md transition-shadow">
                      {story.coverUrl ? (
                        <Image
                          src={story.coverUrl}
                          alt={story.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-100 to-amber-100 flex items-center justify-center text-xs text-red-500 font-bold">
                          {story.title.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Thông tin */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      {/* Tiêu đề & ngày đăng */}
                      <div className="flex items-start justify-between gap-1.5">
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-red-800 transition-colors line-clamp-1 leading-snug">
                          {story.title}
                        </h3>
                        <span className="text-[11px] text-zinc-400 font-medium shrink-0">
                          {formatPublishDate(story.publishedAt || story.createdAt)}
                        </span>
                      </div>

                      {/* Tác giả */}
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                        {authorName}
                      </p>

                      {/* Tags & thống kê */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-1">
                        <span className="text-[10px] text-red-800 bg-red-50/90 border border-red-200/60 px-2 py-0.5 rounded-full font-medium inline-block shrink-0">
                          {genreName}
                        </span>
                        <span>{story.stats?.chapterCount || 0} chương</span>
                        <span>{formatNumber(story.stats?.viewCount || 0)} lượt đọc</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!isLoading && stories.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-400 italic">
              Chưa có truyện trong thể loại này.
            </div>
          )}
        </div>

        {/* Carousel / Pagination Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 pt-4 pb-1">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`transition-all rounded-full cursor-pointer ${
                    isActive ? "w-5 h-2 bg-red-800" : "w-2 h-2 bg-zinc-300 hover:bg-zinc-400"
                  }`}
                  aria-label={`Trang ${pageNum}`}
                />
              );
            })}
          </div>
        )}

        {/* Action Button: Xem thêm truyện mới */}
        <div className="text-center pt-3 border-t border-zinc-100 mt-3">
          <Link
            href="/the-loai?sortBy=createdAt"
            className="inline-block px-6 py-2 rounded-full border border-red-800 text-red-800 hover:bg-red-50 text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
          >
            Xem thêm truyện mới
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, link, linkLabel = "Xem tất cả" }: {
  icon: React.ReactNode;
  title: string;
  link?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-indigo-500 rounded-full" />
        <h2 className="text-base font-bold text-zinc-900">{title}</h2>
        {icon}
      </div>
      {link && (
        <Link href={link} className="text-xs text-indigo-600 hover:underline font-medium">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

// ── Pagination ──────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
      >
        ← Trước
      </button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 text-sm rounded-lg transition cursor-pointer ${
              p === page
                ? "bg-indigo-600 text-white font-semibold"
                : "border border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {p}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
      >
        Tiếp →
      </button>
    </div>
  );
}

// ── Main Home Page ─────────────────────────────────────────────────────────

export default function HomePage() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const urlGenre = searchParams.get("genre") || "";

  const [filters, setFilters] = useState<FilterState>({
    search: urlSearch,
    sortBy: "viewCount",
    genre: urlGenre,
    progressState: "",
  });
  const [page, setPage] = useState(1);

  // Đồng bộ khi URL searchParams thay đổi từ header/menu
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: urlSearch,
      genre: urlGenre,
    }));
    setPage(1);
    if (urlSearch || urlGenre) {
      setTimeout(() => {
        const el = document.getElementById("kham-pha");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [urlSearch, urlGenre]);

  const handleFilterChange = (f: FilterState) => {
    setFilters(f);
    setPage(1);
  };

  const { data: topViews, isLoading: topViewsLoading } = useTopStoriesByViews(8);
  const { data: topLikes, isLoading: topLikesLoading } = useTopStoriesByLikes(6);
  const { data: storiesData, isLoading: storiesLoading } = usePublicStories({
    search: filters.search || undefined,
    sortBy: filters.sortBy as any,
    progressState: filters.progressState as any || undefined,
    genre: filters.genre || undefined,
    page,
    limit: 20,
  });

  const stories = storiesData?.items ?? [];
  const totalPages = storiesData?.pagination?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="w-full bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-5 items-start">
            {/* Hero Slider - chiếm 3/4 */}
            <div className="flex-1 min-w-0">
              {topViewsLoading ? (
                <div className="h-[460px] bg-zinc-200 rounded-2xl animate-pulse" />
              ) : (
                <HeroSlider stories={topViews || []} />
              )}
            </div>

            {/* Top View Sidebar - chiếm 1/4 */}
            <div className="hidden xl:block w-64 shrink-0">
              {topViewsLoading ? (
                <div className="h-[460px] bg-zinc-200 rounded-xl animate-pulse" />
              ) : (
                <TopViewSidebar stories={topViews || []} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Danh Sách Mới Cập Nhật ── */}
        <LatestUpdatedSection />

        {/* ── Truyện Mới Xuất Bản ── */}
        <NewlyPublishedSection />

        {/* Top Like Section */}
        {!topLikesLoading && (topLikes?.length || 0) > 0 && (
          <TopLikeRow stories={topLikes || []} />
        )}
        {topLikesLoading && (
          <div>
            <div className="h-5 bg-zinc-200 rounded w-32 mb-4 animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-zinc-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* ── Browse All Stories ─────────────────────────────────────────── */}
        <section id="kham-pha" className="scroll-mt-24">
          <SectionHeader
            icon={<svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>}
            title="Khám Phá Truyện"
          />

          {/* Filter Bar */}
          <div className="mb-5">
            <SearchFilterBar filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Story Grid */}
          <StoryGrid stories={stories} isLoading={storiesLoading} />

          {/* Pagination */}
          {!storiesLoading && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </section>
      </div>
    </div>
  );
}
