import React from "react";
import Link from "next/link";
import { READER_THEMES, type ReaderThemeMode } from "./ReaderThemes";

interface ReaderTopBarProps {
  slug: string;
  storyTitle?: string;
  chapterNumber: number | string;
  theme: ReaderThemeMode;
}

export const ReaderTopBar: React.FC<ReaderTopBarProps> = ({
  slug,
  storyTitle,
  chapterNumber,
  theme,
}) => {
  const t = READER_THEMES[theme];

  return (
    <header
      className={`border-b ${t.border} py-3 px-4 sm:px-8 select-none transition-colors duration-200 sticky top-0 z-30 backdrop-blur-md ${
        theme === "dark"
          ? "bg-[#202228]/90"
          : theme === "vintage"
          ? "bg-[#fcfbf7]/90"
          : "bg-white/90"
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Nút quay lại chi tiết truyện */}
        <Link
          href={`/truyen/${slug}`}
          className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold ${t.topBackBtn} transition-colors`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="truncate max-w-[200px] sm:max-w-md">
            {storyTitle || "Trang truyện"}
          </span>
        </Link>

        {/* Huy hiệu chương */}
        <div
          className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
            theme === "dark"
              ? "border-zinc-700/70 text-zinc-300 bg-zinc-800/50"
              : theme === "vintage"
              ? "border-[#ede7de] text-[#5a524c] bg-[#f5f0e6]"
              : "border-zinc-200 text-zinc-600 bg-zinc-50"
          }`}
        >
          Chương {chapterNumber}
        </div>
      </div>
    </header>
  );
};
