"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FilteredStoryItem } from "@/features/stories";

function BookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ArrowUpRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

interface HomeNewestStoriesSectionProps {
  stories: FilteredStoryItem[];
  isLoading: boolean;
}

export function HomeNewestStoriesSection({ stories, isLoading }: HomeNewestStoriesSectionProps) {
  return (
    <section id="truyen-moi-nhat" aria-labelledby="newest-stories-heading" className="space-y-5 scroll-mt-36">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-600">
            Truyện mới nhất
          </p>
          <h2
            id="newest-stories-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900"
          >
            Truyện mới lên kệ
          </h2>
          <p className="max-w-[65ch] text-sm sm:text-base leading-relaxed text-slate-500 italic">
            Những tác phẩm vừa được xuất bản gần đây nhất trên StoryVN.
          </p>
        </div>

        <Link
          href="/truyen?sortBy=published"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)] transition-colors hover:border-sky-200 hover:text-sky-600 sm:self-auto sm:text-base"
        >
          Xem tất cả
          <ArrowUpRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] w-full rounded-lg bg-slate-100" />
              <div className="space-y-1.5 pt-2">
                <div className="h-3.5 w-4/5 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-500 ring-1 ring-sky-100">
            <BookIcon className="h-6 w-6" />
          </div>
          <p className="text-base font-medium text-slate-500">Chưa có truyện nào được xuất bản.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {stories.map((story) => (
            <Link
              key={story._id}
              href={`/truyen/${story.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-slate-200/70 bg-white p-1.5 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_40px_-26px_rgba(14,165,233,0.35)]"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-slate-100">
                {story.coverUrl ? (
                  <Image
                    src={story.coverUrl}
                    alt={story.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-400">
                    <BookIcon className="h-6 w-6" />
                  </div>
                )}

                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                  {story.stats.chapterCount} chương
                </span>
              </div>

              <div className="px-0.5 pt-2 pb-0.5">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-sky-600">
                  {story.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                  {story.author?.name || "Ẩn danh"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
