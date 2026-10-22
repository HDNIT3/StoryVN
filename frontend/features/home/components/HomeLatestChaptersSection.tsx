"use client";

import React from "react";
import Link from "next/link";
import { RecentUpdatedStoryItem } from "@/features/stories";

function ClockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
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

function UpcomingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1 text-xs font-bold text-amber-600 ring-1 ring-amber-100">
      <ClockIcon className="h-3 w-3" />
      Sắp cập nhật
    </span>
  );
}

interface HomeLatestChaptersSectionProps {
  stories: RecentUpdatedStoryItem[];
  isLoading: boolean;
}

export function HomeLatestChaptersSection({ stories, isLoading }: HomeLatestChaptersSectionProps) {
  return (
    <section id="moi-cap-nhat" aria-labelledby="latest-chapters-heading" className="space-y-5 scroll-mt-36">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sky-600 shadow-[0_10px_30px_-22px_rgba(14,165,233,0.9)] backdrop-blur-xl">
            <ClockIcon className="h-3.5 w-3.5" />
            Mới nhất
          </span>
          <h2
            id="latest-chapters-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
          >
            Mới cập nhật
          </h2>
          <p className="max-w-[65ch] text-base text-slate-500">
            Những chương truyện vừa lên kệ, cập nhật liên tục mỗi ngày.
          </p>
        </div>

        <Link
          href="/truyen"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)] transition-colors hover:border-sky-200 hover:text-sky-600 sm:self-auto sm:text-base"
        >
          Xem tất cả
          <ArrowUpRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_20px_60px_-45px_rgba(14,165,233,0.4)]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 px-4 py-4 sm:px-6">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-3.5 flex-1 rounded bg-slate-100" />
              <div className="hidden h-3.5 w-40 rounded bg-slate-100 sm:block" />
              <div className="h-3 w-16 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-500 ring-1 ring-sky-100">
            <ClockIcon className="h-6 w-6" />
          </div>
          <p className="text-base font-medium text-slate-500">
            Chưa có chương truyện nào mới cập nhật.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_20px_60px_-45px_rgba(14,165,233,0.4)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
                  <th scope="col" className="hidden px-5 py-3 font-bold sm:table-cell">
                    Thể loại
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                    Truyện
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold sm:px-5">
                    Chương mới
                  </th>
                  <th scope="col" className="hidden px-5 py-3 font-bold md:table-cell">
                    Tác giả
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-bold sm:px-5">
                    Cập nhật
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm sm:text-base">
                {stories.map((item) => {
                  const dateObj = item.updatedAt ? new Date(item.updatedAt) : new Date();
                  const dateStr = !isNaN(dateObj.getTime())
                    ? `${String(dateObj.getDate()).padStart(2, "0")}/${String(
                        dateObj.getMonth() + 1
                      ).padStart(2, "0")} ${String(dateObj.getHours()).padStart(
                        2,
                        "0"
                      )}:${String(dateObj.getMinutes()).padStart(2, "0")}`
                    : "—";

                  const chapterLink = item.latestChapterNumber
                    ? `/truyen/${item.slug}/chuong/${item.latestChapterNumber}`
                    : `/truyen/${item.slug}`;

                  return (
                    <tr key={item._id} className="group transition-colors hover:bg-sky-50/60">
                      <td className="hidden px-5 py-3.5 sm:table-cell">
                        <span className="inline-flex max-w-[9rem] truncate rounded-full border border-sky-100 bg-sky-50/70 px-2.5 py-1 text-xs font-semibold text-sky-600">
                          {item.genre || "Chưa phân loại"}
                        </span>
                      </td>

                      <td className="max-w-[14rem] px-4 py-4 sm:max-w-md sm:px-5">
                        <Link
                          href={`/truyen/${item.slug}`}
                          className="block truncate font-semibold text-slate-900 transition-colors group-hover:text-sky-600"
                          title={item.title}
                        >
                          {item.title}
                        </Link>
                      </td>

                      <td className="max-w-[11rem] px-4 py-4 text-slate-500 sm:max-w-md sm:px-5">
                        {item.latestChapter ? (
                          <Link
                            href={chapterLink}
                            className="block truncate transition-colors hover:text-sky-600"
                            title={item.latestChapter}
                          >
                            {item.latestChapter}
                          </Link>
                        ) : (
                          <UpcomingBadge />
                        )}
                      </td>

                      <td className="hidden max-w-[12rem] truncate px-5 py-4 font-medium text-slate-500 md:table-cell">
                        {item.author}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-slate-400 sm:px-5">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
