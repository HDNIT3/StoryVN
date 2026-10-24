"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { authorService, authorKeys, type AuthorListItem } from "@/features/author";

/* ─────────────────────────────────────────────────────────────
   Helpers & Icons
   ───────────────────────────────────────────────────────────── */

function formatCompactNumber(num?: number): string {
  if (!num || num <= 0) return "0";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString("vi-VN");
}

function PenIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.707 5.293l-3-3a.999.999 0 0 0-1.414 0l-13 13A1 1 0 0 0 4 16v4a1 1 0 0 0 1 1h4a1 1 0 0 0 .707-.293l13-13a.999.999 0 0 0 0-1.414zM8.586 19H6v-2.586l10-10L18.586 9l-10 10zM19.293 7.586L16.414 4.707 18 3.121 20.879 6l-1.586 1.586z" />
    </svg>
  );
}

function UserIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// Bảng màu badge tick xác minh xoay vòng giống ảnh mẫu
const VERIFIED_BADGE_COLORS = [
  "bg-amber-500",
  "bg-sky-500",
  "bg-indigo-600",
  "bg-blue-600",
  "bg-amber-500",
  "bg-violet-600",
  "bg-sky-500",
  "bg-amber-500",
];

export function HomeFeaturedAuthorsSection() {
  const { data: authorsData, isLoading } = useQuery({
    queryKey: authorKeys.list({ limit: 8, sortBy: "featured" }),
    queryFn: async () => {
      const res = await authorService.getAuthorsList({ limit: 8, sortBy: "featured" });
      return res.data;
    },
  });

  const authors: AuthorListItem[] = authorsData?.items || [];

  return (
    <section
      id="tac-gia-noi-bat"
      aria-labelledby="featured-authors-heading"
      className="space-y-6 scroll-mt-28"
    >
      {/* ─── Header: Tiêu đề 3 tầng chuẩn mực + Xem tất cả ───────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-600">
            Tác giả nổi bật
          </p>
          <h2
            id="featured-authors-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900"
          >
            Những cây bút được yêu thích nhất
          </h2>
          <p className="max-w-[65ch] text-sm sm:text-base leading-relaxed text-slate-500 italic">
            Những tác giả tài năng đang được cộng đồng yêu thích.
          </p>
        </div>

        <Link
          href="/tac-gia"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition-colors hover:border-sky-300 hover:text-sky-600 sm:self-auto"
        >
          <span>Xem tất cả</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ─── Loading Skeleton ─────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5 shrink-0 animate-pulse w-24 sm:w-28">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-slate-100 ring-4 ring-slate-50" />
              <div className="h-4 w-16 rounded-md bg-slate-100" />
              <div className="h-3 w-12 rounded-md bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* ─── Danh sách Avatar tròn + Tên + Lượt đọc (theo ảnh mẫu) ─────── */}
      {!isLoading && authors.length > 0 && (
        <div className="relative">
          <div className="flex items-start justify-between gap-3 overflow-x-auto pb-3 pt-2 sm:gap-6 scrollbar-none">
            {authors.map((author, index) => {
              const name = author.penName || author.displayName || author.username;
              const badgeBg = VERIFIED_BADGE_COLORS[index % VERIFIED_BADGE_COLORS.length];
              const totalViews = author.totalViews ?? 0;

              return (
                <Link
                  key={author._id}
                  href={`/tac-gia/${encodeURIComponent(author.username)}`}
                  className="group flex flex-col items-center gap-2 text-center shrink-0 w-24 sm:w-28 focus:outline-hidden transition-transform duration-200 hover:-translate-y-1"
                >
                  {/* Avatar hình tròn có badge tích xác minh */}
                  <div className="relative">
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full border-2 border-white shadow-md shadow-slate-900/10 ring-2 ring-slate-100 group-hover:ring-sky-400 group-hover:shadow-lg group-hover:shadow-sky-500/15 transition-all">
                      {author.avatarUrl ? (
                        <Image
                          src={author.avatarUrl}
                          alt={name}
                          fill
                          sizes="(max-width: 640px) 80px, 96px"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-400 to-indigo-500 text-lg font-bold text-white uppercase sm:text-xl">
                          {name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Huy hiệu tích xanh / vàng góc dưới avatar */}
                    <span
                      aria-label="Tác giả được xác minh"
                      className={`absolute bottom-0.5 right-0.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-white shadow-xs ring-2 ring-white text-[10px] sm:text-xs font-black ${badgeBg}`}
                    >
                      ✓
                    </span>
                  </div>

                  {/* Tên tác giả */}
                  <span className="line-clamp-1 w-full text-sm font-bold text-slate-800 transition-colors group-hover:text-sky-600 sm:text-base">
                    {name}
                  </span>

                  {/* Tổng lượt đọc */}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-slate-500 sm:text-sm">
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatCompactNumber(totalViews)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback khi không có dữ liệu */}
      {!isLoading && authors.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center text-slate-400">
          <PenIcon className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium">Chưa có dữ liệu tác giả nổi bật.</p>
        </div>
      )}
    </section>
  );
}
