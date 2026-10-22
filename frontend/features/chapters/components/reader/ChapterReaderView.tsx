"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { chapterService, chapterKeys } from "@/features/chapters";
import { useAuth } from "@/lib/context/AuthContext";
import { useRecordReading } from "@/features/reading-history";
import { READER_THEMES, CHAPTERS_PER_PAGE, type ReaderThemeMode } from "./ReaderThemes";
import { ReaderTopBar } from "./ReaderTopBar";
import { ReaderSettingsModal } from "./ReaderSettingsModal";
import { ReaderContent } from "./ReaderContent";
import { ReaderNavigation } from "./ReaderNavigation";
import { ReaderChapterModal } from "./ReaderChapterModal";

interface ChapterReaderViewProps {
  slug: string;
  chapterNumber: string;
}

export const ChapterReaderView: React.FC<ChapterReaderViewProps> = ({
  slug,
  chapterNumber,
}) => {
  const router = useRouter();

  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight, setLineHeight] = useState<number>(1.8);
  const [theme, setTheme] = useState<ReaderThemeMode>("vintage");
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterPage, setChapterPage] = useState(1);

  const settingsRef = useRef<HTMLDivElement>(null);

  // Restore personal reader settings from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("reader_theme") as ReaderThemeMode | null;
      if (savedTheme && ["vintage", "light", "dark"].includes(savedTheme)) {
        setTheme(savedTheme);
      }
      const savedFontSize = localStorage.getItem("reader_fontSize");
      if (savedFontSize) {
        const val = Number(savedFontSize);
        if (!isNaN(val) && val >= 14 && val <= 28) {
          setFontSize(val);
        }
      }
      const savedLineHeight = localStorage.getItem("reader_lineHeight");
      if (savedLineHeight) {
        const val = Number(savedLineHeight);
        if (!isNaN(val) && [1.6, 1.8, 2.2].includes(val)) {
          setLineHeight(val);
        }
      }
    } catch {}
  }, []);

  const handleThemeChange = (newTheme: ReaderThemeMode) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("reader_theme", newTheme);
    } catch {}
  };

  const handleFontSizeChange = (newSize: number) => {
    const clamped = Math.max(14, Math.min(28, newSize));
    setFontSize(clamped);
    try {
      localStorage.setItem("reader_fontSize", String(clamped));
    } catch {}
  };

  const handleLineHeightChange = (newLH: number) => {
    setLineHeight(newLH);
    try {
      localStorage.setItem("reader_lineHeight", String(newLH));
    } catch {}
  };

  // Close popup settings on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    data: chapterRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: chapterKeys.reading(slug, chapterNumber),
    queryFn: () =>
      chapterService.getChapterReadingBySlugAndNumber(slug, chapterNumber),
    enabled: Boolean(slug && chapterNumber),
  });

  const chapter = chapterRes?.data;
  const story = chapter?.story;
  const chapterId = chapter?._id;

  // Record reading history (if authenticated)
  const { isAuthenticated } = useAuth();
  const { mutate: recordReading } = useRecordReading();

  useEffect(() => {
    if (isAuthenticated && chapterId) {
      recordReading(chapterId);
    }
  }, [isAuthenticated, chapterId, recordReading]);

  const chapterList = chapter?.chaptersList ?? [];

  const openChapterModal = () => {
    const idx = chapterList.findIndex(
      (c) => c.chapterNumber === chapter?.chapterNumber
    );
    setChapterPage(Math.floor((idx >= 0 ? idx : 0) / CHAPTERS_PER_PAGE) + 1);
    setShowChapterModal(true);
  };

  useEffect(() => {
    if (!showChapterModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showChapterModal]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowChapterModal(false);
        return;
      }
      if (showChapterModal) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft" && chapter?.prevChapter) {
        router.push(`/truyen/${slug}/chuong/${chapter.prevChapter.chapterNumber}`);
      } else if (e.key === "ArrowRight" && chapter?.nextChapter) {
        router.push(`/truyen/${slug}/chuong/${chapter.nextChapter.chapterNumber}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chapter, router, slug, showChapterModal]);

  // Scroll to top on chapter change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [chapterNumber]);

  const t = READER_THEMES[theme];

  if (isLoading) {
    return (
      <div className={`min-h-screen ${t.bg} transition-colors duration-200 py-20 px-4`}>
        <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
          <div className="h-4 bg-zinc-200/60 rounded w-1/4 mb-4" />
          <div className="h-8 bg-zinc-200/60 rounded w-3/4 mb-6" />
          <div className="h-4 bg-zinc-200/60 rounded w-1/3 mb-10" />
          <div className="space-y-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-4 bg-zinc-200/40 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !chapter) {
    return (
      <div className={`min-h-screen ${t.bg} transition-colors duration-200 py-20 px-4 flex items-center justify-center`}>
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Chưa tìm thấy chương truyện</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Chương này có thể chưa được tác giả xuất bản hoặc liên kết chương không tồn tại.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/truyen/${slug}`}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
            >
              Về mục lục truyện
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.bg} transition-colors duration-200`}>
      {/* Top bar */}
      <ReaderTopBar
        slug={slug}
        storyTitle={story?.title}
        chapterNumber={chapter.chapterNumber}
        theme={theme}
        onToggleSettings={() => setShowSettings(!showSettings)}
        showSettings={showSettings}
        settingsRef={settingsRef}
        settingsContent={
          <ReaderSettingsModal
            theme={theme}
            onThemeChange={handleThemeChange}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
            lineHeight={lineHeight}
            onLineHeightChange={handleLineHeightChange}
          />
        }
      />

      {/* Main Reading Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <ReaderContent
          slug={slug}
          storyTitle={story?.title}
          chapterNumber={chapter.chapterNumber}
          chapterTitle={chapter.title}
          wordCount={chapter.wordCount}
          viewCount={chapter.viewCount}
          createdAt={chapter.createdAt}
          content={chapter.content}
          theme={theme}
          fontSize={fontSize}
          lineHeight={lineHeight}
        />

        {/* Bottom Navigation */}
        <ReaderNavigation
          slug={slug}
          chapterNumber={chapter.chapterNumber}
          totalChapters={chapterList.length}
          prevChapter={chapter.prevChapter}
          nextChapter={chapter.nextChapter}
          theme={theme}
          onOpenChapterModal={openChapterModal}
          onScrollToTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
      </main>

      {/* Modal mục lục */}
      <ReaderChapterModal
        isOpen={showChapterModal}
        onClose={() => setShowChapterModal(false)}
        slug={slug}
        currentChapterNumber={chapter.chapterNumber}
        chapterList={chapterList}
        chapterPage={chapterPage}
        onPageChange={setChapterPage}
        theme={theme}
      />
    </div>
  );
};
