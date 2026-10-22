import React from "react";
import Link from "next/link";
import { READER_THEMES, type ReaderThemeMode } from "./ReaderThemes";

interface ReaderTopBarProps {
  slug: string;
  storyTitle?: string;
  chapterNumber: number | string;
  theme: ReaderThemeMode;
  onToggleSettings: () => void;
  showSettings: boolean;
  settingsContent: React.ReactNode;
  settingsRef: React.RefObject<HTMLDivElement | null>;
}

export const ReaderTopBar: React.FC<ReaderTopBarProps> = ({
  slug,
  storyTitle,
  chapterNumber,
  theme,
  onToggleSettings,
  showSettings,
  settingsContent,
  settingsRef,
}) => {
  const t = READER_THEMES[theme];

  return (
    <header className={`border-b ${t.border} py-3 px-4 sm:px-8 select-none transition-colors duration-200 sticky top-0 z-30 backdrop-blur-md ${theme === "dark" ? "bg-[#202228]/90" : theme === "vintage" ? "bg-[#fcfbf7]/90" : "bg-white/90"}`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Nút quay lại chi tiết truyện */}
        <Link
          href={`/truyen/${slug}`}
          className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold ${t.topBackBtn} transition-colors`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="truncate max-w-[150px] sm:max-w-xs">{storyTitle || "Trang truyện"}</span>
        </Link>

        {/* Nút cài đặt hiển thị (Font, Size, Theme) */}
        <div className="relative" ref={settingsRef}>
          <button
            type="button"
            onClick={onToggleSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${t.settingsBtn}`}
            title="Cài đặt giao diện đọc"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Cài đặt</span>
          </button>

          {showSettings && settingsContent}
        </div>
      </div>
    </header>
  );
};
