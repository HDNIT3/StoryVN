import React from "react";
import Link from "next/link";
import { READER_THEMES, CHAPTERS_PER_PAGE, type ReaderThemeMode } from "./ReaderThemes";

export interface ChapterModalItem {
  chapterNumber: number;
  title: string;
  isFree?: boolean;
  coinPrice?: number;
  isUnlocked?: boolean;
}

interface ReaderChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  currentChapterNumber: number | string;
  chapterList: ChapterModalItem[];
  chapterPage: number;
  onPageChange: (page: number) => void;
  theme: ReaderThemeMode;
}

export const ReaderChapterModal: React.FC<ReaderChapterModalProps> = ({
  isOpen,
  onClose,
  slug,
  currentChapterNumber,
  chapterList,
  chapterPage,
  onPageChange,
  theme,
}) => {
  if (!isOpen) return null;

  const t = READER_THEMES[theme];
  const totalChapterPages = Math.max(
    1,
    Math.ceil(chapterList.length / CHAPTERS_PER_PAGE)
  );
  const pagedChapters = chapterList.slice(
    (chapterPage - 1) * CHAPTERS_PER_PAGE,
    chapterPage * CHAPTERS_PER_PAGE
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 ${
          theme === "dark"
            ? "bg-[#282a32] border-zinc-700 text-zinc-100"
            : theme === "vintage"
            ? "bg-[#fcfbf7] border-stone-300 text-stone-800"
            : "bg-white border-zinc-200 text-zinc-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-inherit/40">
          <div>
            <h3 className="text-base sm:text-lg font-bold">Mục lục chương</h3>
            <p className="text-xs opacity-60">
              Tổng số {chapterList.length} chương đã phát hành
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-inherit/20 text-sm font-bold cursor-pointer opacity-70 hover:opacity-100"
            title="Đóng (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Danh sách 10 chương của trang hiện tại */}
        <div className="flex-1 overflow-y-auto py-3 space-y-1.5 min-h-0">
          {pagedChapters.map((ch) => {
            const isCurrent = Number(ch.chapterNumber) === Number(currentChapterNumber);
            const isFree = ch.isFree ?? (!ch.coinPrice || ch.coinPrice === 0);
            const isUnlocked = isFree || Boolean(ch.isUnlocked);

            return (
              <Link
                key={ch.chapterNumber}
                href={`/truyen/${slug}/chuong/${ch.chapterNumber}`}
                onClick={onClose}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                  isCurrent ? t.menuItemActive : t.menuItemHover
                }`}
              >
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-semibold truncate">
                    Chương {ch.chapterNumber}: {ch.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white shrink-0">
                      Đang đọc
                    </span>
                  )}
                  {isFree ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Miễn phí
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400">
                      Đã mở
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      🔒 {(ch.coinPrice || 0).toLocaleString("vi-VN")} Xu
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Phân trang modal mục lục */}
        {totalChapterPages > 1 && (
          <div className="pt-3 border-t border-inherit/40 flex items-center justify-between text-xs select-none">
            <button
              type="button"
              disabled={chapterPage <= 1}
              onClick={() => onPageChange(Math.max(1, chapterPage - 1))}
              className="px-3 py-1.5 rounded-lg border border-inherit/40 hover:bg-inherit/10 disabled:opacity-30 disabled:cursor-not-allowed font-semibold cursor-pointer"
            >
              ← Trang trước
            </button>
            <span className="opacity-70 font-semibold">
              Trang {chapterPage} / {totalChapterPages}
            </span>
            <button
              type="button"
              disabled={chapterPage >= totalChapterPages}
              onClick={() => onPageChange(Math.min(totalChapterPages, chapterPage + 1))}
              className="px-3 py-1.5 rounded-lg border border-inherit/40 hover:bg-inherit/10 disabled:opacity-30 disabled:cursor-not-allowed font-semibold cursor-pointer"
            >
              Trang sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
