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
import { ReaderTtsBar } from "./ReaderTtsBar";
import { ReaderContent } from "./ReaderContent";
import { ReaderNavigation } from "./ReaderNavigation";
import { ReaderChapterModal } from "./ReaderChapterModal";
import { ReaderSideToolbar } from "./ReaderSideToolbar";
import { ReaderCommentDrawer } from "./ReaderCommentDrawer";
import { useSpeechReader } from "../../hooks/useSpeechReader";
import { useStoryComments } from "@/features/comments";

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
  const [showTts, setShowTts] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const ttsRef = useRef<HTMLDivElement>(null);

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
      const target = event.target as Node;
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
      }
      if (ttsRef.current && !ttsRef.current.contains(target)) {
        setShowTts(false);
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

  // Đọc truyện bằng giọng nói tiếng Việt (Web Speech API, miễn phí)
  const tts = useSpeechReader(chapter?.content);

  // Record reading history (if authenticated)
  const { user, isAuthenticated } = useAuth();
  const { mutate: recordReading } = useRecordReading();

  // Kiểm tra quyền chỉnh sửa chương (Tác giả, Quản trị viên, Quản lý)
  const canEdit = Boolean(
    user &&
      chapterId &&
      (user.role === "ADMIN" ||
        user.role === "MANAGER" ||
        user.role === "AUTHOR" ||
        user._id === (story as any)?.authorId ||
        user._id === (story as any)?.author?._id ||
        user._id === (story as any)?.author ||
        user.username === (story as any)?.author?.username ||
        user.username === (story as any)?.author)
  );

  // Lấy số lượng bình luận của chương hiện tại
  const { data: commentsRes } = useStoryComments(story?._id || "", {
    page: 1,
    limit: 1,
    chapterId: chapterId,
  });
  const commentCount = commentsRes?.data?.pagination?.totalItems ?? 0;

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

  // Scroll to top on chapter change (nếu có commentId thì tự động mở khung bình luận)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("commentId") || window.location.hash.includes("comment-")) {
        setShowComments(true);
        return;
      }
    }
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
      {/* Top bar (Thanh điều hướng đầu trang gọn gàng, không lặp lại nút cài đặt/nghe) */}
      <ReaderTopBar
        slug={slug}
        storyTitle={story?.title}
        chapterNumber={chapter.chapterNumber}
        theme={theme}
      />

      {/* Bộ công cụ đọc truyện cố định bên trái (Desktop & Mobile) */}
      {chapterId && (
        <ReaderSideToolbar
          slug={slug}
          chapterNumber={chapter.chapterNumber}
          chapterId={chapterId}
          theme={theme}
          onOpenChapterModal={openChapterModal}
          onToggleTts={() => {
            setShowTts(!showTts);
            setShowSettings(false);
          }}
          ttsActive={
            tts.status === "playing" || tts.status === "paused" || tts.status === "loading"
          }
          showTts={showTts}
          ttsContent={
            <ReaderTtsBar
              theme={theme}
              reader={tts}
              className="w-80 rounded-2xl border p-4 shadow-2xl"
            />
          }
          ttsRef={ttsRef}
          onToggleSettings={() => {
            setShowSettings(!showSettings);
            setShowTts(false);
          }}
          showSettings={showSettings}
          settingsContent={
            <ReaderSettingsModal
              theme={theme}
              onThemeChange={handleThemeChange}
              fontSize={fontSize}
              onFontSizeChange={handleFontSizeChange}
              lineHeight={lineHeight}
              onLineHeightChange={handleLineHeightChange}
              className="w-72 rounded-2xl border p-4 shadow-2xl"
            />
          }
          settingsRef={settingsRef}
          commentCount={commentCount}
          onToggleComments={() => setShowComments((prev) => !prev)}
          showComments={showComments}
        />
      )}

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
          activeBlockIndex={tts.activeBlockIndex}
          activeText={tts.activeText}
          highlighting={tts.highlighting}
          onSelectBlock={tts.playFromBlock}
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

        {/* Nút mở khung bình luận ở cuối chương */}
        {story?._id && chapter?._id && (
          <div className="mt-8 mb-16">
            <button
              type="button"
              onClick={() => setShowComments(true)}
              className={`w-full p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                theme === "dark"
                  ? "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-100 hover:bg-zinc-900"
                  : theme === "vintage"
                  ? "bg-[#f5f0e6]/60 border-[#ede7de] hover:border-[#ded5c7] text-[#2c2725] hover:bg-[#f5f0e6]"
                  : "bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-800 hover:bg-zinc-100/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    theme === "dark"
                      ? "bg-zinc-800 text-amber-400"
                      : theme === "vintage"
                      ? "bg-[#faedd9] text-[#8b1e17]"
                      : "bg-sky-50 text-sky-600"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">Bình luận chương</span>
                    {commentCount > 0 && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          theme === "dark"
                            ? "bg-amber-500/20 text-amber-300"
                            : theme === "vintage"
                            ? "bg-[#8b1e17]/10 text-[#8b1e17]"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {commentCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {commentCount > 0
                      ? "Xem thảo luận và chia sẻ cảm nghĩ của bạn"
                      : "Chưa có bình luận nào. Hãy là người đầu tiên để lại cảm nghĩ!"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-current opacity-80 group-hover:opacity-100">
                <span>Mở khung bình luận</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </div>
        )}
      </main>

      {/* Khung bình luận cạnh phải (Kiểu YouTube Shorts) */}
      {story?._id && chapter?._id && (
        <ReaderCommentDrawer
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          storyId={story._id}
          chapterId={chapter._id}
          chapterNumber={chapter.chapterNumber}
          storyAuthorId={(story as any)?.authorId || (story as any)?.author?._id}
          storySlug={slug}
          theme={theme}
        />
      )}

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
