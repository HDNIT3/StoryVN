"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { READER_THEMES, formatReaderDate, type ReaderThemeMode } from "./ReaderThemes";
import { CONTENT_BLOCK_SELECTOR } from "@/lib/utils/htmlToPlainText";

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
  /** Đoạn văn đang được đọc — dùng để tô sáng. */
  activeBlockIndex?: number;
  /** Câu đang được đọc — tô sáng chính xác trong đoạn. */
  activeText?: string;
  /** Bật/tắt tô sáng. */
  highlighting?: boolean;
}

/**
 * Chèn style cho Highlight API lúc chạy (bộ build CSS không nhận `::highlight()`).
 */
function ensureHighlightStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById("tts-highlight-style")) return;

  const style = document.createElement("style");
  style.id = "tts-highlight-style";
  style.textContent = `::highlight(${HIGHLIGHT_NAME}) { background-color: rgba(250, 204, 21, 0.45); color: inherit; }`;
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
  activeBlockIndex = -1,
  activeText = "",
  highlighting = false,
}) => {
  const t = READER_THEMES[theme];
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledBlockRef = useRef<number>(-1);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const blocks = Array.from(
      container.querySelectorAll<HTMLElement>(CONTENT_BLOCK_SELECTOR)
    );

    blocks.forEach((element, index) => {
      element.classList.toggle("tts-reading-block", highlighting && index === activeBlockIndex);
    });

    const registry =
      typeof CSS !== "undefined"
        ? (CSS as unknown as { highlights?: HighlightRegistry }).highlights
        : undefined;
    const HighlightClass =
      typeof window !== "undefined"
        ? (window as unknown as { Highlight?: HighlightConstructor }).Highlight
        : undefined;

    if (registry && HighlightClass) {
      ensureHighlightStyle();
      registry.delete(HIGHLIGHT_NAME);

      if (highlighting && activeBlockIndex >= 0 && activeText) {
        const block = blocks[activeBlockIndex];
        if (block) {
          const range = findTextRange(block, activeText);
          if (range) registry.set(HIGHLIGHT_NAME, new HighlightClass(range));
        }
      }
    }

    if (highlighting && activeBlockIndex >= 0 && lastScrolledBlockRef.current !== activeBlockIndex) {
      lastScrolledBlockRef.current = activeBlockIndex;
      const block = blocks[activeBlockIndex];
      if (block) {
        const rect = block.getBoundingClientRect();
        const outOfView = rect.top < 80 || rect.bottom > window.innerHeight - 80;
        if (outOfView) {
          block.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }

    if (!highlighting) {
      lastScrolledBlockRef.current = -1;
    }

    return () => {
      blocks.forEach((element) => element.classList.remove("tts-reading-block"));
      if (registry) registry.delete(HIGHLIGHT_NAME);
    };
  }, [activeBlockIndex, activeText, highlighting, content]);

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
      <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold ${t.titleColor} tracking-tight leading-snug mb-3`}>
        Chương {chapterNumber}: {chapterTitle}
      </h1>

      {/* Thông tin phụ: Số từ, Lượt đọc, Ngày cập nhật */}
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm ${t.secondaryText} mb-8 pb-4 border-b ${t.divider}`}>
        {wordCount ? (
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h10M4 18h13" />
            </svg>
            {wordCount.toLocaleString("vi-VN")} chữ
          </span>
        ) : null}

        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {(viewCount || 0).toLocaleString("vi-VN")} lượt đọc
        </span>

        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatReaderDate(createdAt)}
        </span>
      </div>

      {/* Nội dung chương chữ */}
      {content ? (
        /<\/?[a-z][\s\S]*>/i.test(content) ? (
          <div
            ref={contentRef}
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
            className={`font-serif sm:font-sans ${t.textColor} tracking-normal text-justify select-text leading-relaxed ${t.selection} prose max-w-none [&_p]:mb-4 [&_p]:text-indent-sm [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div
            ref={contentRef}
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
            className={`font-serif sm:font-sans ${t.textColor} tracking-normal text-justify select-text whitespace-pre-wrap leading-relaxed ${t.selection}`}
          >
            {content.split("\n").map((para, idx) => {
              const trimmed = para.trim();
              if (!trimmed) {
                return <div key={idx} className="h-4" />;
              }
              return (
                <p key={idx} className="mb-4 text-indent-sm">
                  {trimmed}
                </p>
              );
            })}
          </div>
        )
      ) : (
        <p className="italic opacity-60">Nội dung chương đang được cập nhật...</p>
      )}
    </article>
  );
};
