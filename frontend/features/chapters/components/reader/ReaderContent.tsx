"use client";

import React, { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { READER_THEMES, formatReaderDate, type ReaderThemeMode } from "./ReaderThemes";
import { parseChapterBlocks } from "@/lib/utils/htmlToPlainText";

const HIGHLIGHT_NAME = "tts-sentence";

interface HighlightRegistry {
  set: (name: string, highlight: unknown) => void;
  delete: (name: string) => void;
}

type HighlightConstructor = new (...ranges: Range[]) => unknown;

interface ReaderContentProps {
  slug: string;
  storyTitle?: string;
  chapterNumber: number | string;
  chapterTitle?: string;
  wordCount?: number;
  viewCount?: number;
  createdAt?: string;
  content?: string;
  theme: ReaderThemeMode;
  fontSize: number;
  lineHeight: number;
  isLocked?: boolean;
  coinPrice?: number;
  requirePreviousChapter?: boolean;
  isAuthenticated?: boolean;
  onRequestUnlock?: () => void;
  /** Đoạn văn đang được đọc — dùng để tô sáng. */
  activeBlockIndex?: number;
  /** Câu đang được đọc — tô sáng chính xác trong đoạn. */
  activeText?: string;
  /** Bật/tắt tô sáng. */
  highlighting?: boolean;
  /** Bấm vào một đoạn văn để bắt đầu nghe từ đoạn đó. */
  onSelectBlock?: (blockIndex: number) => void;
}

/**
 * Chèn style cho Highlight API và hiệu ứng đoạn văn được chọn đọc lúc chạy.
 */
function ensureHighlightStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById("tts-highlight-style")) return;

  const style = document.createElement("style");
  style.id = "tts-highlight-style";
  style.textContent = `
    ::highlight(${HIGHLIGHT_NAME}) {
      background-color: rgba(250, 204, 21, 0.45);
      color: inherit;
    }
    .tts-reading-block {
      border-left: 3.5px solid #10b981 !important;
      padding-left: 0.75rem !important;
      background-color: rgba(16, 185, 129, 0.08);
      border-radius: 0.5rem;
      transition: all 0.2s ease;
    }
    .reader-block-item {
      position: relative;
      cursor: pointer;
      border-radius: 0.375rem;
      transition: background-color 0.15s ease;
    }
    .reader-block-item:hover:not(.tts-reading-block) {
      background-color: rgba(0, 0, 0, 0.035);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Tìm đoạn text khớp trong một phần tử để tạo Range tô sáng.
 * Trả về null nếu không khớp (khi đó chỉ tô sáng cả đoạn).
 */
function findTextRange(root: HTMLElement, needle: string): Range | null {
  if (!needle) return null;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let combined = "";
  let node = walker.nextNode();

  while (node) {
    textNodes.push(node as Text);
    combined += node.textContent ?? "";
    node = walker.nextNode();
  }

  const start = combined.indexOf(needle);
  if (start === -1) return null;

  const end = start + needle.length;
  let cursor = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  for (const textNode of textNodes) {
    const length = textNode.textContent?.length ?? 0;

    if (!startNode && start < cursor + length) {
      startNode = textNode;
      startOffset = start - cursor;
    }

    if (startNode && end <= cursor + length) {
      endNode = textNode;
      endOffset = end - cursor;
      break;
    }

    cursor += length;
  }

  if (!startNode || !endNode) return null;

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

export const ReaderContent: React.FC<ReaderContentProps> = ({
  slug,
  storyTitle,
  chapterNumber,
  chapterTitle,
  wordCount,
  viewCount,
  createdAt,
  content,
  theme,
  fontSize,
  lineHeight,
  isLocked = false,
  coinPrice = 0,
  requirePreviousChapter = false,
  isAuthenticated = false,
  onRequestUnlock,
  activeBlockIndex = -1,
  activeText = "",
  highlighting = false,
  onSelectBlock,
}) => {
  const t = READER_THEMES[theme];
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledBlockRef = useRef<number>(-1);

  // Chuẩn hoá và phân tách nội dung thành từng đoạn văn mạch lạc
  const blocks = useMemo(() => parseChapterBlocks(content), [content]);

  useEffect(() => {
    ensureHighlightStyle();
    const container = contentRef.current;
    if (!container) return;

    const registry =
      typeof CSS !== "undefined"
        ? (CSS as unknown as { highlights?: HighlightRegistry }).highlights
        : undefined;
    const HighlightClass =
      typeof window !== "undefined"
        ? (window as unknown as { Highlight?: HighlightConstructor }).Highlight
        : undefined;

    if (registry && HighlightClass) {
      registry.delete(HIGHLIGHT_NAME);

      if (highlighting && activeBlockIndex >= 0 && activeText) {
        const targetBlock = container.querySelector<HTMLElement>(
          `[data-block-index="${activeBlockIndex}"]`
        );
        if (targetBlock) {
          const range = findTextRange(targetBlock, activeText);
          if (range) registry.set(HIGHLIGHT_NAME, new HighlightClass(range));
        }
      }
    }

    // Tự động cuộn mượt tới đoạn văn đang phát thanh
    if (
      highlighting &&
      activeBlockIndex >= 0 &&
      lastScrolledBlockRef.current !== activeBlockIndex
    ) {
      lastScrolledBlockRef.current = activeBlockIndex;
      const targetBlock = container.querySelector<HTMLElement>(
        `[data-block-index="${activeBlockIndex}"]`
      );
      if (targetBlock) {
        const rect = targetBlock.getBoundingClientRect();
        const outOfView =
          rect.top < 80 || rect.bottom > window.innerHeight - 80;
        if (outOfView) {
          targetBlock.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }

    if (!highlighting) {
      lastScrolledBlockRef.current = -1;
    }

    return () => {
      if (registry) registry.delete(HIGHLIGHT_NAME);
    };
  }, [activeBlockIndex, activeText, highlighting, blocks]);

  /**
   * Bấm vào đoạn văn để nghe từ đoạn đó.
   * Nếu người dùng đang bôi đen sao chép văn bản thì không kích hoạt.
   */
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSelectBlock) return;

    // Không can thiệp nếu người dùng đang bôi đen văn bản
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("a, button, input, textarea")) return;

    const blockEl = target.closest("[data-block-index]") as HTMLElement | null;
    if (blockEl && contentRef.current?.contains(blockEl)) {
      const idxAttr = blockEl.getAttribute("data-block-index");
      if (idxAttr !== null) {
        const idx = parseInt(idxAttr, 10);
        if (!isNaN(idx)) {
          onSelectBlock(idx);
        }
      }
    }
  };

  return (
    <article className="mt-8 mb-12">
      {/* Tên truyện */}
      <div className="mb-2">
        <Link
          href={`/truyen/${slug}`}
          className={`text-sm sm:text-base font-bold uppercase tracking-wider ${t.storyLink} transition-colors inline-block`}
        >
          {storyTitle || "Đang tải tên truyện..."}
        </Link>
      </div>

      {/* Tiêu đề chương */}
      <h1
        className={`text-2xl sm:text-3xl md:text-4xl font-extrabold ${t.titleColor} tracking-tight leading-snug mb-3`}
      >
        Chương {chapterNumber}: {chapterTitle}
      </h1>

      {/* Thông tin phụ: Số từ, Lượt đọc, Ngày cập nhật */}
      <div
        className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm ${t.secondaryText} mb-8 pb-4 border-b ${t.divider}`}
      >
        {wordCount ? (
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4 6h16M4 12h10M4 18h13"
              />
            </svg>
            {wordCount.toLocaleString("vi-VN")} chữ
          </span>
        ) : null}

        <span className="flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          {(viewCount || 0).toLocaleString("vi-VN")} lượt đọc
        </span>

        <span className="flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {formatReaderDate(createdAt)}
        </span>
      </div>

      {/* Nội dung chương chữ hoặc Khung mở khóa chương trả phí */}
      {isLocked ? (
        <div
          className={`rounded-3xl border p-8 sm:p-10 text-center space-y-5 my-8 ${
            theme === "dark"
              ? "bg-zinc-900/70 border-zinc-800 text-zinc-100"
              : theme === "vintage"
              ? "bg-[#f5f0e6]/80 border-[#e2d8c7] text-[#2c2725]"
              : "bg-zinc-50 border-zinc-200 text-zinc-900"
          }`}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
              Chương trả phí • {coinPrice.toLocaleString("vi-VN")} Xu
            </span>
            <h2 className="text-lg sm:text-xl font-bold">
              Mở khóa để đọc toàn bộ Chương {chapterNumber}
            </h2>
            <p className={`text-xs sm:text-sm ${t.secondaryText} leading-relaxed`}>
              Chương này yêu cầu <strong className="font-bold">{coinPrice.toLocaleString("vi-VN")} Xu</strong> để mở khóa. Bạn chỉ cần thanh toán một lần duy nhất để sở hữu vĩnh viễn chương này.
            </p>
            {requirePreviousChapter && Number(chapterNumber) > 1 && (
              <p className="text-xs text-amber-600 font-medium">
                Lưu ý: Chương này yêu cầu đã mở khóa chương trả phí liền trước.
              </p>
            )}
          </div>

          <div className="pt-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onRequestUnlock}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow-sm cursor-pointer"
              >
                Mở khóa chương ({coinPrice.toLocaleString("vi-VN")} Xu)
              </button>
            ) : (
              <Link
                href={`/dang-nhap?returnUrl=${encodeURIComponent(`/truyen/${slug}/chuong/${chapterNumber}`)}`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow-sm"
              >
                Đăng nhập để mở khóa ({coinPrice.toLocaleString("vi-VN")} Xu)
              </Link>
            )}
          </div>
        </div>
      ) : blocks.length > 0 ? (
        <div
          ref={contentRef}
          onClick={handleContentClick}
          style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          className={`font-serif sm:font-sans ${t.textColor} tracking-normal text-justify select-text leading-relaxed ${t.selection} prose max-w-none [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`}
        >
          {blocks.map((block) => {
            const isReading = highlighting && activeBlockIndex === block.index;
            return (
              <p
                key={block.index}
                data-block-index={block.index}
                className={`reader-block-item mb-5 text-indent-sm transition-all duration-150 ${
                  isReading ? "tts-reading-block" : ""
                }`}
                title="Chạm để nghe từ đoạn này"
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            );
          })}
        </div>
      ) : (
        <p className="italic opacity-60">
          Nội dung chương đang được cập nhật...
        </p>
      )}
    </article>
  );
};
