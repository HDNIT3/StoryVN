"use client";

import React, { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { chapterService } from "@/lib/services/chapter.service";
import { queryKeys } from "@/lib/query-keys";
import { cleanVietnameseText } from "@/lib/utils/vietnamese";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
}

export default function ChapterReadingPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string; chapterNumber: string }>;
}) {
  const unwrappedParams = use(paramsPromise);
  const router = useRouter();
  const slug = unwrappedParams.slug;
  const chapterNumber = unwrappedParams.chapterNumber;

  const [fontSize, setFontSize] = useState<number>(18); // px
  const [lineHeight, setLineHeight] = useState<number>(1.8);
  const [theme, setTheme] = useState<"vintage" | "light" | "dark">("vintage");
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);

  const {
    data: chapterRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.chapters.reading(slug, chapterNumber),
    queryFn: () =>
      chapterService.getChapterReadingBySlugAndNumber(slug, chapterNumber),
    enabled: Boolean(slug && chapterNumber),
  });

  const chapter = chapterRes?.data;
  const story = chapter?.story;

  // Lắng nghe phím tắt điều hướng mũi tên trái/phải
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [chapter, router, slug]);

  // Cuộn lên đầu trang khi đổi chương
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [chapterNumber]);

  const themes = {
    vintage: {
      bg: "bg-[#fcfbf7]",
      cardBg: "bg-[#fbf9f4]",
      textColor: "text-[#2b2b2b]",
      secondaryText: "text-[#736b63]",
      border: "border-[#ede7de]",
      tagBg: "bg-[#f3eee6]",
      activeBtn: "bg-[#8b251e] text-white",
      inactiveBtn: "bg-[#ebdcd1] text-[#8b251e] hover:bg-[#e4d1c4]",
      selectorBtn: "bg-[#f4efe6] text-[#332f2c] border-[#e7decb]",
    },
    light: {
      bg: "bg-white",
      cardBg: "bg-zinc-50",
      textColor: "text-zinc-900",
      secondaryText: "text-zinc-500",
      border: "border-zinc-200",
      tagBg: "bg-zinc-100",
      activeBtn: "bg-zinc-900 text-white",
      inactiveBtn: "bg-zinc-200 text-zinc-700 hover:bg-zinc-300",
      selectorBtn: "bg-zinc-100 text-zinc-800 border-zinc-200",
    },
    dark: {
      bg: "bg-[#18181b]",
      cardBg: "bg-[#27272a]",
      textColor: "text-zinc-200",
      secondaryText: "text-zinc-400",
      border: "border-zinc-800",
      tagBg: "bg-zinc-800",
      activeBtn: "bg-emerald-600 text-white",
      inactiveBtn: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
      selectorBtn: "bg-zinc-800 text-zinc-200 border-zinc-700",
    },
  }[theme];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfbf7] flex flex-col items-center justify-center py-20 px-4">
        <div className="w-10 h-10 border-3 border-[#8b251e] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-stone-600">Đang tải nội dung chương truyện...</p>
      </div>
    );
  }

  if (isError || !chapter) {
    return (
      <div className="min-h-screen bg-[#fcfbf7] flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-stone-800 mb-1">Chưa có chương này hoặc chương chưa xuất bản</h2>
        <p className="text-xs text-stone-500 max-w-sm mb-6">
          Chương bạn đang tìm có thể chưa được tác giả đăng tải hoặc đang trong quá trình kiểm duyệt.
        </p>
        <Link
          href={`/truyen/${slug}`}
          className="px-5 py-2.5 rounded-xl bg-[#8b251e] text-white text-xs font-bold shadow-xs hover:bg-[#721f19] transition-colors"
        >
          Quay lại trang truyện
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themes.bg} py-8 sm:py-12`}>
      {/* Container chính */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Thanh công cụ nổi / Breadcrumb đầu trang */}
        <div className="flex items-center justify-between pb-6 border-b border-stone-200/60 mb-8">
          <Link
            href={`/truyen/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Quay lại trang truyện</span>
          </Link>

          {/* Công cụ tùy chỉnh cỡ chữ & màu nền */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer bg-white text-stone-700 hover:bg-stone-50 border-stone-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Cài đặt đọc</span>
            </button>

            {/* Popup Cài đặt */}
            {showSettings && (
              <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-white border border-stone-200 shadow-xl z-30 space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1.5">Màu nền</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTheme("vintage")}
                      className={`p-1.5 rounded-lg border text-center font-bold transition-colors cursor-pointer ${
                        theme === "vintage" ? "border-amber-700 bg-[#fbf9f4] text-amber-900" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      Cổ điển
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`p-1.5 rounded-lg border text-center font-bold transition-colors cursor-pointer ${
                        theme === "light" ? "border-zinc-900 bg-white text-zinc-900" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      Sáng
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`p-1.5 rounded-lg border text-center font-bold transition-colors cursor-pointer ${
                        theme === "dark" ? "border-emerald-500 bg-zinc-900 text-white" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      Tối
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 font-bold text-stone-700">
                    <span>Cỡ chữ</span>
                    <span>{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                      className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center cursor-pointer"
                    >
                      A-
                    </button>
                    <input
                      type="range"
                      min="14"
                      max="28"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="flex-1 accent-[#8b251e] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setFontSize((s) => Math.min(28, s + 1))}
                      className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center cursor-pointer"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 font-bold text-stone-700">
                    <span>Giãn dòng</span>
                    <span>{lineHeight}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1.6, 1.8, 2.2].map((lh) => (
                      <button
                        key={lh}
                        type="button"
                        onClick={() => setLineHeight(lh)}
                        className={`p-1.5 rounded-lg border text-center font-bold transition-colors cursor-pointer ${
                          lineHeight === lh ? "border-[#8b251e] bg-amber-50 text-[#8b251e]" : "border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        {lh === 1.6 ? "Gọn" : lh === 1.8 ? "Vừa" : "Rộng"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tiêu đề truyện & Chương theo đúng hình ảnh */}
        <div className="space-y-3 mb-8">
          {story && (
            <Link
              href={`/truyen/${slug}`}
              className="text-sm font-bold text-[#b42b24] hover:underline transition-colors block"
            >
              {story.title}
            </Link>
          )}

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#2c2725] font-serif">
            {`Chương ${chapter.chapterNumber}${chapter.title ? `: ${cleanVietnameseText(chapter.title)}` : ""}`}
          </h1>

          {/* Badges thông tin: Đăng ngày, số từ, lượt đọc y hệt mẫu ảnh */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${themes.tagBg} ${themes.secondaryText}`}>
              Đăng: {formatDate(chapter.createdAt)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${themes.tagBg} ${themes.secondaryText}`}>
              {(chapter.wordCount || 0).toLocaleString("vi-VN")} từ
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${themes.tagBg} ${themes.secondaryText}`}>
              {(chapter.viewCount || 0).toLocaleString("vi-VN")} lượt đọc
            </span>
          </div>
        </div>

        {/* Điều hướng chương (Nút Previous, Chọn chương, Next y hệt mẫu ảnh) */}
        <div className="flex items-center justify-center gap-3 my-8 relative">
          {/* Nút Chương trước */}
          {chapter.prevChapter ? (
            <Link
              href={`/truyen/${slug}/chuong/${chapter.prevChapter.chapterNumber}`}
              className="w-10 h-10 rounded-full bg-[#d69f95] hover:bg-[#c98e83] text-white flex items-center justify-center shadow-xs transition-transform active:scale-90"
              title={`Chương trước: Chương ${chapter.prevChapter.chapterNumber}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-200/70 text-stone-400 flex items-center justify-center opacity-40 cursor-not-allowed">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          )}

          {/* Nút Chọn Chương (Dropdown popup) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowChapterSelector(!showChapterSelector)}
              className="px-8 py-2.5 rounded-full bg-[#faedd9] hover:bg-[#f5e3ca] border border-[#e8d2b7] text-stone-800 text-sm font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <span>{`Chương ${chapter.chapterNumber}`}</span>
              <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Menu danh sách chương nhanh */}
            {showChapterSelector && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl bg-white border border-stone-200 shadow-2xl z-40 p-2 divide-y divide-stone-100">
                <div className="px-3 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Mục lục chương ({chapter.chaptersList?.length || 0})
                </div>
                {chapter.chaptersList?.map((c) => (
                  <Link
                    key={c.chapterNumber}
                    href={`/truyen/${slug}/chuong/${c.chapterNumber}`}
                    onClick={() => setShowChapterSelector(false)}
                    className={`block px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      c.chapterNumber === chapter.chapterNumber
                        ? "bg-[#8b251e] text-white font-bold"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    Chương {c.chapterNumber}: {c.title || `Chương ${c.chapterNumber}`}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Nút Chương sau */}
          {chapter.nextChapter ? (
            <Link
              href={`/truyen/${slug}/chuong/${chapter.nextChapter.chapterNumber}`}
              className="w-10 h-10 rounded-full bg-[#8b1e17] hover:bg-[#721913] text-white flex items-center justify-center shadow-xs transition-transform active:scale-90"
              title={`Chương sau: Chương ${chapter.nextChapter.chapterNumber}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-200/70 text-stone-400 flex items-center justify-center opacity-40 cursor-not-allowed">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Nội dung chương truyện */}
        <article
          className={`font-serif tracking-normal selection:bg-amber-200 selection:text-stone-900 my-10 prose max-w-none [&_p]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 leading-relaxed ${themes.textColor}`}
          style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          dangerouslySetInnerHTML={{
            __html: chapter.content
              ? cleanVietnameseText(chapter.content)
              : "<p class='text-stone-400 italic'>(Chương này hiện chưa có nội dung văn bản)</p>",
          }}
        />

        {/* Điều hướng chương dưới chân bài đọc */}
        <div className="pt-8 border-t border-stone-200/60 flex items-center justify-center gap-3 my-8">
          {chapter.prevChapter ? (
            <Link
              href={`/truyen/${slug}/chuong/${chapter.prevChapter.chapterNumber}`}
              className="w-10 h-10 rounded-full bg-[#d69f95] hover:bg-[#c98e83] text-white flex items-center justify-center shadow-xs transition-transform active:scale-90"
              title={`Chương trước: Chương ${chapter.prevChapter.chapterNumber}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-200/70 text-stone-400 flex items-center justify-center opacity-40 cursor-not-allowed">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="px-6 py-2.5 rounded-full bg-[#faedd9] hover:bg-[#f5e3ca] border border-[#e8d2b7] text-stone-800 text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Lên đầu trang ↑
          </button>

          {chapter.nextChapter ? (
            <Link
              href={`/truyen/${slug}/chuong/${chapter.nextChapter.chapterNumber}`}
              className="w-10 h-10 rounded-full bg-[#8b1e17] hover:bg-[#721913] text-white flex items-center justify-center shadow-xs transition-transform active:scale-90"
              title={`Chương sau: Chương ${chapter.nextChapter.chapterNumber}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-200/70 text-stone-400 flex items-center justify-center opacity-40 cursor-not-allowed">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
