import React from "react";
import Link from "next/link";
import { READER_THEMES, type ReaderThemeMode } from "./ReaderThemes";

interface ReaderNavigationProps {
  slug: string;
  chapterNumber: number | string;
  totalChapters: number;
  prevChapter?: { chapterNumber: number; title: string } | null;
  nextChapter?: { chapterNumber: number; title: string } | null;
  theme: ReaderThemeMode;
  onOpenChapterModal: () => void;
  onScrollToTop: () => void;
}

export const ReaderNavigation: React.FC<ReaderNavigationProps> = ({
  slug,
  chapterNumber,
  totalChapters,
  prevChapter,
  nextChapter,
  theme,
  onOpenChapterModal,
  onScrollToTop,
}) => {
  const t = READER_THEMES[theme];

  return (
    <footer className={`border-t ${t.divider} pt-8 pb-16`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Nút Chương trước */}
        {prevChapter ? (
          <Link
            href={`/truyen/${slug}/chuong/${prevChapter.chapterNumber}`}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${t.navPrevBtn}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Chương trước</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm cursor-not-allowed ${t.navDisabledBtn}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Đầu tác phẩm</span>
          </button>
        )}

        {/* Nút mở Modal Mục lục & Nút cuộn lên đầu */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={onOpenChapterModal}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${t.navSelectorBtn}`}
            title="Mở mục lục để chọn chương"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>Chương {chapterNumber} / {totalChapters || "..."}</span>
          </button>

          <button
            type="button"
            onClick={onScrollToTop}
            className={`p-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${t.navScrollTopBtn}`}
            title="Cuộn lên đầu trang"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>

        {/* Nút Chương sau */}
        {nextChapter ? (
          <Link
            href={`/truyen/${slug}/chuong/${nextChapter.chapterNumber}`}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${t.navNextBtn}`}
          >
            <span>Chương tiếp</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm cursor-not-allowed ${t.navDisabledBtn}`}
          >
            <span>Hết chương</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </footer>
  );
};
