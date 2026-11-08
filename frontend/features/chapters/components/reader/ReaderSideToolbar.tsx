"use client";

import React, { useState } from "react";
import { type ReaderThemeMode } from "./ReaderThemes";

interface ReaderSideToolbarProps {
  slug: string;
  chapterNumber: number | string;
  chapterId: string;
  theme: ReaderThemeMode;
  canEdit?: boolean;
  onOpenChapterModal: () => void;
  onToggleTts: () => void;
  ttsActive: boolean;
  showTts: boolean;
  ttsContent: React.ReactNode;
  ttsRef: React.RefObject<HTMLDivElement | null>;
  onToggleSettings: () => void;
  showSettings: boolean;
  settingsContent: React.ReactNode;
  settingsRef: React.RefObject<HTMLDivElement | null>;
  commentCount?: number;
  onToggleComments: () => void;
  showComments: boolean;
}

export const ReaderSideToolbar: React.FC<ReaderSideToolbarProps> = ({
  chapterNumber,
  theme,
  onOpenChapterModal,
  onToggleTts,
  ttsActive,
  showTts,
  ttsContent,
  ttsRef,
  onToggleSettings,
  showSettings,
  settingsContent,
  settingsRef,
  commentCount = 0,
  onToggleComments,
  showComments,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleScrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement?.scrollTo?.({ top: 0, behavior: "smooth" });
      document.body?.scrollTo?.({ top: 0, behavior: "smooth" });
    }
  };

  // Theme styling cho thanh công cụ
  const themeClasses = {
    vintage: {
      dockBg:
        "bg-[#fcfbf7]/95 border-[#ede7de] text-[#2c2725] shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
      btn: "text-[#5a524c] hover:text-[#8b1e17] hover:bg-[#f3eee6]",
      btnActive: "bg-[#faedd9] text-[#8b1e17] font-bold shadow-2xs",
      divider: "bg-[#ede7de]",
      tooltipBg: "bg-[#2c2725] text-[#fcfbf7]",
      badge: "bg-[#8b1e17] text-white",
    },
    light: {
      dockBg:
        "bg-white/95 border-zinc-200 text-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
      btn: "text-zinc-600 hover:text-sky-600 hover:bg-zinc-100",
      btnActive: "bg-sky-50 text-sky-600 font-bold shadow-2xs",
      divider: "bg-zinc-200",
      tooltipBg: "bg-zinc-900 text-white",
      badge: "bg-sky-500 text-white",
    },
    dark: {
      dockBg:
        "bg-[#282a32]/95 border-zinc-700/80 text-zinc-100 shadow-[0_12px_40px_rgb(0,0,0,0.4)]",
      btn: "text-zinc-400 hover:text-amber-400 hover:bg-[#32353f]",
      btnActive: "bg-[#333642] text-amber-400 font-bold shadow-2xs",
      divider: "bg-zinc-700/60",
      tooltipBg: "bg-zinc-800 text-zinc-100 border border-zinc-700",
      badge: "bg-amber-500 text-zinc-950 font-bold",
    },
  }[theme];

  return (
    <>
      {/* ─── DESKTOP TOOLBAR (Cố định bên trái nội dung đọc) ────────────── */}
      <aside
        data-reader-toolbar="true"
        aria-label="Bộ công cụ đọc truyện"
        className={`hidden lg:flex fixed ${
          showComments
            ? "left-2.5 xl:left-4"
            : "left-3 xl:left-[max(1rem,calc(50vw-24rem-5.5rem))]"
        } top-1/2 -translate-y-1/2 z-40 flex-col items-center p-1.5 rounded-2xl border backdrop-blur-md transition-all select-none ${themeClasses.dockBg}`}
      >
        {/* 1. Nút Mục lục / Phân chương */}
        <div className="relative group">
          <button
            type="button"
            onClick={onOpenChapterModal}
            className={`flex flex-col items-center justify-center w-11 h-12 rounded-xl transition-all cursor-pointer ${themeClasses.btn}`}
            aria-label={`Mục lục chương (Chương ${chapterNumber})`}
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
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">
              Chương
            </span>
          </button>
          <span
            role="tooltip"
            className={`absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-md z-50 ${themeClasses.tooltipBg}`}
          >
            Mục lục chương (Chương {chapterNumber})
          </span>
        </div>

        {/* 2. Nút Phát thanh / Nghe truyện (TTS) */}
        <div className="relative group" ref={ttsRef}>
          <button
            type="button"
            onClick={onToggleTts}
            className={`relative flex flex-col items-center justify-center w-11 h-12 rounded-xl transition-all cursor-pointer ${
              showTts || ttsActive ? themeClasses.btnActive : themeClasses.btn
            }`}
            aria-label="Phát thanh - Nghe truyện"
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
                d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
              />
            </svg>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">
              Phát thanh
            </span>
            {ttsActive && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </button>
          {!showTts && (
            <span
              role="tooltip"
              className={`absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-md z-50 ${themeClasses.tooltipBg}`}
            >
              Phát thanh ({ttsActive ? "Đang đọc" : "Nghe truyện"})
            </span>
          )}

          {/* Popover điều khiển phát thanh gắn ngay cạnh toolbar */}
          {showTts && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {ttsContent}
            </div>
          )}
        </div>

        {/* 3. Nút Bình luận (Mở khung bình luận bên phải kiểu YouTube Shorts) */}
        <div className="relative group">
          <button
            type="button"
            onClick={onToggleComments}
            className={`relative flex flex-col items-center justify-center w-11 h-12 rounded-xl transition-all cursor-pointer ${
              showComments ? themeClasses.btnActive : themeClasses.btn
            }`}
            aria-label={
              showComments ? "Đóng khung bình luận" : "Xem bình luận chương"
            }
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
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">
              Bình luận
            </span>

            {/* Huy hiệu số bình luận */}
            {commentCount > 0 && !showComments && (
              <span
                className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs ring-1 ring-white ${themeClasses.badge}`}
              >
                {commentCount > 99 ? "99+" : commentCount}
              </span>
            )}
          </button>
          <span
            role="tooltip"
            className={`absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-md z-50 ${themeClasses.tooltipBg}`}
          >
            {showComments
              ? "Đóng khung bình luận"
              : `Xem bình luận (${commentCount})`}
          </span>
        </div>

        {/* Đường phân cách */}
        <div className={`w-6 h-[1px] my-1 ${themeClasses.divider}`} />

        {/* 4. Nút Cài đặt giao diện đọc */}
        <div className="relative group" ref={settingsRef}>
          <button
            type="button"
            onClick={onToggleSettings}
            className={`flex flex-col items-center justify-center w-11 h-12 rounded-xl transition-all cursor-pointer ${
              showSettings ? themeClasses.btnActive : themeClasses.btn
            }`}
            aria-label="Cài đặt giao diện đọc"
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
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">
              Cài đặt
            </span>
          </button>
          {!showSettings && (
            <span
              role="tooltip"
              className={`absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-md z-50 ${themeClasses.tooltipBg}`}
            >
              Cài đặt hiển thị (chữ, nền)
            </span>
          )}

          {/* Popover cài đặt hiển thị ngay cạnh toolbar */}
          {showSettings && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {settingsContent}
            </div>
          )}
        </div>

        {/* 5. Nút Lên đầu trang */}
        <div className="relative group">
          <button
            type="button"
            onClick={handleScrollToTop}
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all cursor-pointer ${themeClasses.btn}`}
            aria-label="Cuộn lên đầu trang"
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
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            <span className="text-[9px] font-semibold tracking-tight mt-0.5">
              Lên đầu
            </span>
          </button>
          <span
            role="tooltip"
            className={`absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-md z-50 ${themeClasses.tooltipBg}`}
          >
            Cuộn lên đầu trang
          </span>
        </div>
      </aside>

      {/* ─── MOBILE POPUP PANEL CHO TTS (NGHE) & CÀI ĐẶT ─────────────────── */}
      {(showTts || showSettings) && (
        <div
          data-reader-toolbar="true"
          className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 pb-6 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-150"
          onClick={() => {
            if (showTts) onToggleTts();
            if (showSettings) onToggleSettings();
          }}
        >
          <div
            className="relative w-full max-w-sm animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                if (showTts) onToggleTts();
                if (showSettings) onToggleSettings();
              }}
              aria-label="Đóng bảng công cụ"
              className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                theme === "dark"
                  ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  : "bg-stone-200/80 text-stone-700 hover:bg-stone-300"
              }`}
            >
              ✕
            </button>
            {showTts && ttsContent}
            {showSettings && settingsContent}
          </div>
        </div>
      )}

      {/* ─── MOBILE TOOLBAR (Cố định góc trái phía dưới trên Mobile/Tablet) ──── */}
      <div
        data-reader-toolbar="true"
        className="lg:hidden fixed left-3 bottom-20 z-40 select-none touch-manipulation"
      >
        {/* Thanh công cụ mở rộng */}
        {isMobileOpen ? (
          <div
            className={`flex flex-col items-center p-1.5 rounded-2xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-left duration-200 ${themeClasses.dockBg}`}
          >
            {/* Phân chương */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                onOpenChapterModal();
              }}
              className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all cursor-pointer active:scale-95 ${themeClasses.btn}`}
              title="Mục lục chương"
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
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              <span className="text-[10px] font-semibold mt-0.5">Chương</span>
            </button>

            {/* Phát thanh (TTS) */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                onToggleTts();
              }}
              className={`relative flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all mt-1 cursor-pointer active:scale-95 ${
                showTts || ttsActive ? themeClasses.btnActive : themeClasses.btn
              }`}
              title="Phát thanh"
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
                  d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
                />
              </svg>
              <span className="text-[10px] font-semibold mt-0.5">Nghe</span>
              {ttsActive && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </button>

            {/* Bình luận */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                onToggleComments();
              }}
              className={`relative flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all mt-1 cursor-pointer active:scale-95 ${
                showComments ? themeClasses.btnActive : themeClasses.btn
              }`}
              title={showComments ? "Đóng bình luận" : "Bình luận"}
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-[10px] font-semibold mt-0.5">Bình luận</span>
              {commentCount > 0 && !showComments && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center ${themeClasses.badge}`}
                >
                  {commentCount > 99 ? "99+" : commentCount}
                </span>
              )}
            </button>

            {/* Cài đặt */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                onToggleSettings();
              }}
              className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all mt-1 cursor-pointer active:scale-95 ${
                showSettings ? themeClasses.btnActive : themeClasses.btn
              }`}
              title="Cài đặt"
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
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <span className="text-[10px] font-semibold mt-0.5">Cài đặt</span>
            </button>

            {/* Lên đầu */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                handleScrollToTop();
              }}
              className={`flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all mt-1 cursor-pointer active:scale-95 ${themeClasses.btn}`}
              title="Lên đầu trang"
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
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span className="text-[9px] font-semibold mt-0.5">Lên đầu</span>
            </button>

            {/* Nút đóng / thu gọn */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="mt-1 pt-1 border-t border-inherit/40 flex items-center justify-center w-12 h-7 text-xs opacity-60 hover:opacity-100 cursor-pointer"
              aria-label="Thu gọn công cụ"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          /* Nút thu gọn dạng Pill nổi bên mép trái màn hình */
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Mở bộ công cụ đọc truyện"
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full border shadow-lg backdrop-blur-md transition-all cursor-pointer active:scale-95 ${themeClasses.dockBg}`}
          >
            <div className="relative">
              <svg
                className="w-4 h-4 text-inherit"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
              {ttsActive && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </div>
            <span className="text-xs font-bold pr-0.5">Công cụ</span>
          </button>
        )}
      </div>
    </>
  );
};
