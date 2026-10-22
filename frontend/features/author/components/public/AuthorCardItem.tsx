import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { AuthorListItem } from "@/features/author";

interface AuthorCardItemProps {
  author: AuthorListItem;
  formatNumber: (num?: number) => string;
}

export function AuthorCardItem({ author, formatNumber }: AuthorCardItemProps) {
  return (
    <Link
      href={`/tac-gia/${author.username}`}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-900/60 transition-colors cursor-pointer overflow-hidden shadow-2xs"
    >
      <div>
        {/* Avatar + Name + Tags + Arrow */}
        <div className="flex items-start gap-3.5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 dark:from-zinc-800 dark:to-zinc-700 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center text-amber-900 dark:text-zinc-200 font-bold text-lg shrink-0 shadow-inner">
            {author.avatarUrl ? (
              <Image
                src={author.avatarUrl}
                alt={author.penName}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <span>{author.penName?.charAt(0)?.toUpperCase() || "A"}</span>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 font-serif group-hover:text-[#8b181b] dark:group-hover:text-amber-400 transition-colors truncate">
              {author.penName}
            </h3>

            {/* Genres */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {author.genres && author.genres.length > 0 ? (
                author.genres.slice(0, 2).map((g, idx) => (
                  <span
                    key={g._id || idx}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                      idx === 0
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60"
                        : "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60"
                    }`}
                  >
                    {g.name}
                  </span>
                ))
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Sáng tác StoryVN
                </span>
              )}
            </div>
          </div>

          {/* Navigation Arrow */}
          <div className="text-zinc-300 dark:text-zinc-600 group-hover:text-[#8b181b] dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all pt-1 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Bio quote */}
        <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/70">
          <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 italic line-clamp-2 leading-relaxed">
            {author.biography ? (
              `“${author.biography}”`
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500 not-italic">
                Tác giả chưa cập nhật tiểu sử sáng tác.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stories count & views count */}
      <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
        <span>{author.storyCount} tác phẩm</span>
        <span>👁️ {formatNumber(author.totalViews)} lượt đọc</span>
      </div>
    </Link>
  );
}
