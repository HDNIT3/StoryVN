"use client";

import React, { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { chapterService } from "@/lib/services/chapter.service";
import { queryKeys } from "@/lib/query-keys";

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

  const settingsRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Khôi phục cài đặt đọc cá nhân từ localStorage (nếu có)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("reader_theme") as "vintage" | "light" | "dark" | null;
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
    } catch {
      // Bỏ qua lỗi truy cập storage
    }
  }, []);

  const handleThemeChange = (newTheme: "vintage" | "light" | "dark") => {
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

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setShowChapterSelector(false);
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
      titleColor: "text-[#2c2725]",
      storyLink: "text-[#b42b24] hover:text-[#8b1e17]",
      textColor: "text-[#2b2b2b]",
      secondaryText: "text-[#736b63]",
      border: "border-[#ede7de]",
      divider: "border-stone-200/60",
      tagBg: "bg-[#f3eee6] text-[#736b63] border border-[#e6ded1]",
      topBackBtn: "text-stone-500 hover:text-stone-800",
      settingsBtn: "bg-white text-stone-700 hover:bg-stone-50 border-stone-200 shadow-2xs",
      settingsPopup: "bg-white border-stone-200 text-stone-700 shadow-xl",
      settingsLabel: "text-stone-700",
      settingsBtnSecondary: "bg-stone-100 hover:bg-stone-200 text-stone-800",
      rangeAccent: "accent-[#8b251e]",
      navPrevBtn: "bg-[#d69f95] hover:bg-[#c98e83] text-white shadow-xs",
      navNextBtn: "bg-[#8b1e17] hover:bg-[#721913] text-white shadow-xs",
      navDisabledBtn: "bg-stone-200/70 text-stone-400",
      navSelectorBtn: "bg-[#faedd9] hover:bg-[#f5e3ca] border-[#e8d2b7] text-stone-800 shadow-2xs",
      navScrollTopBtn: "bg-[#faedd9] hover:bg-[#f5e3ca] border-[#e8d2b7] text-stone-800 shadow-2xs",
      menuDropdown: "bg-white border-stone-200 divide-stone-100 text-stone-700 shadow-2xl",
      menuItemActive: "bg-[#8b251e] text-white font-bold",
      menuItemHover: "hover:bg-stone-50 text-stone-700",
      menuHeader: "text-stone-400",
      selection: "selection:bg-amber-200 selection:text-stone-900",
    },
    light: {
      bg: "bg-white",
      cardBg: "bg-zinc-50",
      titleColor: "text-zinc-900",
      storyLink: "text-rose-600 hover:text-rose-700",
      textColor: "text-zinc-800",
      secondaryText: "text-zinc-500",
      border: "border-zinc-200",
      divider: "border-zinc-200",
      tagBg: "bg-zinc-100 text-zinc-600 border border-zinc-200",
      topBackBtn: "text-zinc-500 hover:text-zinc-900",
      settingsBtn: "bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 shadow-2xs",
      settingsPopup: "bg-white border-zinc-200 text-zinc-700 shadow-xl",
      settingsLabel: "text-zinc-700",
      settingsBtnSecondary: "bg-zinc-100 hover:bg-zinc-200 text-zinc-800",
      rangeAccent: "accent-zinc-900",
      navPrevBtn: "bg-zinc-300 hover:bg-zinc-400 text-zinc-800 shadow-xs",
      navNextBtn: "bg-zinc-900 hover:bg-black text-white shadow-xs",
      navDisabledBtn: "bg-zinc-100 text-zinc-400",
      navSelectorBtn: "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800 shadow-2xs",
      navScrollTopBtn: "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800 shadow-2xs",
      menuDropdown: "bg-white border-zinc-200 divide-zinc-100 text-zinc-800 shadow-2xl",
      menuItemActive: "bg-zinc-900 text-white font-bold",
      menuItemHover: "hover:bg-zinc-100 text-zinc-800",
      menuHeader: "text-zinc-400",
      selection: "selection:bg-zinc-200 selection:text-zinc-900",
    },
    dark: {
      // Nền hơi tối dịu mắt (soft dark charcoal, không bị tối đen thui)
      bg: "bg-[#202228]",
      cardBg: "bg-[#282a32]",
      // Tiêu đề & chữ sáng trắng/sáng rõ nét tương phản cao
      titleColor: "text-white",
      storyLink: "text-amber-400 hover:text-amber-300",
      textColor: "text-zinc-100",
      secondaryText: "text-zinc-400",
      border: "border-zinc-750",
      divider: "border-zinc-700/60",
      tagBg: "bg-[#282a32] text-zinc-300 border border-zinc-700/70",
      topBackBtn: "text-zinc-400 hover:text-zinc-100",
      settingsBtn: "bg-[#282a32] text-zinc-200 hover:bg-[#32353f] border-zinc-700 shadow-2xs",
      settingsPopup: "bg-[#282a32] border-zinc-700 text-zinc-200 shadow-2xl",
      settingsLabel: "text-zinc-200",
      settingsBtnSecondary: "bg-[#333642] hover:bg-[#3d414f] text-zinc-100",
      rangeAccent: "accent-amber-400",
      navPrevBtn: "bg-zinc-700 hover:bg-zinc-600 text-white shadow-xs",
      navNextBtn: "bg-[#9b2c23] hover:bg-[#b5342a] text-white shadow-xs",
      navDisabledBtn: "bg-zinc-800 text-zinc-600",
      navSelectorBtn: "bg-[#282a32] hover:bg-[#32353f] border-zinc-700 text-zinc-200 shadow-2xs",
      navScrollTopBtn: "bg-[#282a32] hover:bg-[#32353f] border-zinc-700 text-zinc-200 shadow-2xs",
      menuDropdown: "bg-[#282a32] border-zinc-700 divide-zinc-700/60 text-zinc-200 shadow-2xl",
      menuItemActive: "bg-[#9b2c23] text-white font-bold",
      menuItemHover: "hover:bg-[#333642] text-zinc-100",
      menuHeader: "text-zinc-400",
      selection: "selection:bg-amber-400/30 selection:text-amber-200",
    },
  }[theme];

  const getThemeOptionClass = (optTheme: "vintage" | "light" | "dark") => {
    if (theme === optTheme) {
      if (optTheme === "vintage") return "border-amber-700 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-700/40";
      if (optTheme === "light") return "border-zinc-900 bg-zinc-100 text-zinc-900 font-bold ring-2 ring-zinc-900/40";
      return "border-amber-400 bg-zinc-800 text-amber-300 font-bold ring-2 ring-amber-400/40";
    }
    if (theme === "dark") {
      return "border-zinc-700 text-zinc-400 bg-[#1e2026] hover:bg-[#252830] hover:text-zinc-200";
    }
    return "border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100";
  };

  const getLineHeightOptionClass = (lh: number) => {
    if (lineHeight === lh) {
      if (theme === "dark") return "border-amber-400 bg-amber-400/15 text-amber-300 font-bold";
      if (theme === "light") return "border-zinc-900 bg-zinc-100 text-zinc-900 font-bold";
      return "border-[#8b251e] bg-amber-50 text-[#8b251e] font-bold";
    }
    if (theme === "dark") {
      return "border-zinc-700 text-zinc-400 bg-[#1e2026] hover:bg-[#252830] hover:text-zinc-200";
    }
    return "border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100";
  };

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
        
        {/* Thanh công cụ / Breadcrumb đầu trang */}
        <div className={`flex items-center justify-between pb-6 border-b ${themes.divider} mb-8`}>
          <Link
            href={`/truyen/${slug}`}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${themes.topBackBtn} transition-colors`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Quay lại trang truyện</span>
          </Link>

          {/* Công cụ tùy chỉnh cỡ chữ & màu nền */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${themes.settingsBtn}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Cài đặt đọc</span>
            </button>

            {/* Popup Cài đặt */}
            {showSettings && (
              <div className={`absolute right-0 mt-2 w-64 p-4 rounded-2xl border ${themes.settingsPopup} z-30 space-y-3.5 text-xs`}>
                <div>
                  <label className={`font-bold block mb-1.5 ${themes.settingsLabel}`}>Màu nền</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleThemeChange("vintage")}
                      className={`p-1.5 rounded-lg border text-center transition-colors cursor-pointer ${getThemeOptionClass("vintage")}`}
                    >
                      Cổ điển
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange("light")}
                      className={`p-1.5 rounded-lg border text-center transition-colors cursor-pointer ${getThemeOptionClass("light")}`}
                    >
                      Sáng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange("dark")}
                      className={`p-1.5 rounded-lg border text-center transition-colors cursor-pointer ${getThemeOptionClass("dark")}`}
                    >
                      Tối
                    </button>
                  </div>
                </div>

                <div>
                  <div className={`flex justify-between items-center mb-1.5 font-bold ${themes.settingsLabel}`}>
                    <span>Cỡ chữ</span>
                    <span>{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFontSizeChange(fontSize - 1)}
                      className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-colors ${themes.settingsBtnSecondary}`}
                      title="Giảm cỡ chữ"
                    >
                      A-
                    </button>
                    <input
                      type="range"
                      min="14"
                      max="28"
                      value={fontSize}
                      onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                      className={`flex-1 ${themes.rangeAccent} cursor-pointer`}
                    />
                    <button
                      type="button"
                      onClick={() => handleFontSizeChange(fontSize + 1)}
                      className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-colors ${themes.settingsBtnSecondary}`}
                      title="Tăng cỡ chữ"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div>
                  <div className={`flex justify-between items-center mb-1.5 font-bold ${themes.settingsLabel}`}>
                    <span>Giãn dòng</span>
                    <span>{lineHeight}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1.6, 1.8, 2.2].map((lh) => (
                      <button
                        key={lh}
                        type="button"
                        onClick={() => handleLineHeightChange(lh)}
                        className={`p-1.5 rounded-lg border text-center transition-colors cursor-pointer ${getLineHeightOptionClass(lh)}`}
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

        {/* Tiêu đề truyện & Chương căn giữa hoàn toàn theo yêu cầu */}
        <div className="space-y-3 mb-8 text-center flex flex-col items-center justify-center">
          {story && (
            <Link
              href={`/truyen/${slug}`}
              className={`text-sm sm:text-base font-bold hover:underline transition-colors block max-w-2xl ${themes.storyLink}`}
            >
              {story.title}
            </Link>
          )}

          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight font-serif max-w-3xl leading-snug ${themes.titleColor}`}>
            {`Chương ${chapter.chapterNumber}${chapter.title ? `: ${chapter.title}` : ""}`}
          </h1>

          {/* Badges thông tin: Đăng ngày, số từ, lượt đọc căn giữa hoàn toàn */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-2xs ${themes.tagBg}`}>
              Đăng: {formatDate(chapter.createdAt)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-2xs ${themes.tagBg}`}>
              {(chapter.wordCount || 0).toLocaleString("vi-VN")} từ
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-2xs ${themes.tagBg}`}>
              {(chapter.viewCount || 0).toLocaleString("vi-VN")} lượt đọc
            </span>
          </div>
        </div>

        {/* Điều hướng chương (Nút Previous, Chọn chương, Next) */}
        <div className="flex items-center justify-center gap-3 my-8 relative">
          {/* Nút Chương trước */}
          {chapter.prevChapter ? (
            <Link
              href={`/truyen/${slug}/chuong/${chapter.prevChapter.chapterNumber}`}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${themes.navPrevBtn}`}
              title={`Chương trước: Chương ${chapter.prevChapter.chapterNumber}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center opacity-40 cursor-not-allowed ${themes.navDisabledBtn}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          )}

          {/* Nút Chọn Chương (Dropdown popup) */}
          <div className="relative" ref={selectorRef}>
            <button
              type="button"
              onClick={() => setShowChapterSelector(!showChapterSelector)}
              className={`px-8 py-2.5 rounded-full border text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${themes.navSelectorBtn}`}
            >
              <span>{`Chương ${chapter.chapterNumber}`}</span>
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Menu danh sách chương nhanh */}
            {showChapterSelector && (
              <div className={`absolute left-1/2 -translate-x-1/2 mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl border z-40 p-2 ${themes.menuDropdown}`}>
                <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider ${themes.menuHeader}`}>
                  Mục lục chương ({chapter.chaptersList?.length || 0})
                </div>
                {chapter.chaptersList?.map((c) => (
                  <Link
                    key={c.chapterNumber}
                    href={`/truyen/${slug}/chuong/${c.chapterNumber}`}
                    onClick={() => setShowChapterSelector(false)}
                    className={`block px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      c.chapterNumber === chapter.chapterNumber
                        ? themes.menuItemActive
                        : themes.menuItemHover
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
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${themes.navNextBtn}`}
              title={`Chương sau: Chương ${chapter.nextChapter.chapterNumber}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center opacity-40 cursor-not-allowed ${themes.navDisabledBtn}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Nội dung chương truyện */}
        <article
          className={`font-serif tracking-normal ${themes.selection} my-10 prose max-w-none prose-p:text-inherit prose-headings:text-inherit prose-strong:text-inherit prose-em:text-inherit prose-a:text-inherit [&_p]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 leading-relaxed ${themes.textColor} ${theme === "dark" ? "prose-invert" : ""}`}
          style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          dangerouslySetInnerHTML={{
            __html: chapter.content
              ? chapter.content
              : "<p class='text-stone-400 italic text-center py-8'>(Chương này hiện chưa có nội dung văn bản)</p>",
          }}
        />

        {/* Điều hướng chương dưới chân bài đọc */}
        <div className={`pt-8 border-t ${themes.divider} flex items-center justify-center gap-3 my-8`}>
          {chapter.prevChapter ? (
            <Link
              href={`/truyen/${slug}/chuong/${chapter.prevChapter.chapterNumber}`}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${themes.navPrevBtn}`}
              title={`Chương trước: Chương ${chapter.prevChapter.chapterNumber}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center opacity-40 cursor-not-allowed ${themes.navDisabledBtn}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`px-6 py-2.5 rounded-full border text-sm font-semibold transition-colors cursor-pointer ${themes.navScrollTopBtn}`}
          >
            Lên đầu trang ↑
          </button>

          {chapter.nextChapter ? (
            <Link
              href={`/truyen/${slug}/chuong/${chapter.nextChapter.chapterNumber}`}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${themes.navNextBtn}`}
              title={`Chương sau: Chương ${chapter.nextChapter.chapterNumber}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center opacity-40 cursor-not-allowed ${themes.navDisabledBtn}`}>
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

