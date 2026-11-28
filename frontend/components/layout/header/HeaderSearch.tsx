"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchSuggestions } from "@/features/search/hooks/useSearchSuggestions";
import { HeaderSearchProps, DEFAULT_SEARCH, SMART_SEARCH_LABEL } from "./header.config";

const EXAMPLE_QUERIES = [
  "Truyện về người quay lại quá khứ để cứu gia đình",
  "Truyện phiêu lưu khám phá một thế giới mới",
];

function storyHref(slug: string) {
  return `/truyen/${encodeURIComponent(slug)}`;
}

export function HeaderSearch({
  placeholder = DEFAULT_SEARCH.placeholder,
  iconSrc = DEFAULT_SEARCH.iconSrc ?? "/icon/search.svg",
  defaultValue = "",
  className = "",
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: HeaderSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [composing, setComposing] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const panelId = React.useId();
  const listId = React.useId();
  const { items, loading, error, searchedQuery, search, reset } = useSearchSuggestions();
  const hasQuery = query.trim().length >= 2 && !composing;
  const showResults = Boolean(searchedQuery) && !loading && !error;

  const updateQuery = (value: string) => {
    reset();
    setQuery(value);
    setActive(-1);
  };

  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (!open) {
      if (panel.matches(":popover-open")) panel.hidePopover();
      return;
    }
    const positionPanel = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const gutter = viewportWidth < 640 ? 8 : 16;
      const centered = window.innerWidth < 1280;
      const width = Math.min(560, viewportWidth - gutter * 2);
      const left = centered || !trigger
        ? viewportLeft + (viewportWidth - width) / 2
        : Math.max(viewportLeft + gutter, Math.min(trigger.left + (trigger.width - width) / 2, viewportLeft + viewportWidth - width - gutter));
      const bottom = viewportTop + viewportHeight;
      const minimumHeight = Math.min(220, viewportHeight - gutter * 2);
      const top = centered
        ? viewportTop + viewportHeight / 2
        : Math.max(viewportTop + gutter, Math.min((trigger?.bottom ?? viewportTop) + 10, bottom - minimumHeight - gutter));
      Object.assign(panel.style, {
        width: `${width}px`, left: `${left}px`, top: `${top}px`,
        transform: centered ? "translateY(-50%)" : "none",
        maxHeight: `${Math.max(0, Math.min(520, centered ? viewportHeight - gutter * 2 : bottom - top - gutter))}px`,
      });
    };
    positionPanel();
    if (!panel.matches(":popover-open")) panel.showPopover();
    inputRef.current?.focus({ preventScroll: true });
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    window.visualViewport?.addEventListener("resize", positionPanel);
    window.visualViewport?.addEventListener("scroll", positionPanel);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
      window.visualViewport?.removeEventListener("resize", positionPanel);
      window.visualViewport?.removeEventListener("scroll", positionPanel);
    };
  }, [open]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k" && triggerRef.current?.getBoundingClientRect().width) {
        event.preventDefault();
        triggerRef.current.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Closing only hides the panel; keep the query and results for the next visit.
  const close = () => { setOpen(false); setActive(-1); };
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (composing || loading || !hasQuery) return;
    setActive(-1);
    void search(query);
  };

  return (
    <div className={`header-search ${className}`}>
      {!hideTrigger && <button
        ref={triggerRef}
        type="button"
        onClick={() => { setActive(-1); setOpen(!open); }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-2xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:text-base"
      >
        <Image src={iconSrc} alt="" width={20} height={20} className="h-5 w-5 shrink-0" />
        <span className="whitespace-nowrap">{SMART_SEARCH_LABEL}</span>
      </button>}

      <div
        ref={panelRef}
        id={panelId}
        popover="auto"
        role="dialog"
        aria-modal="false"
        aria-labelledby={`${panelId}-title`}
        onToggle={(event) => {
          if (event.newState === "open") setOpen(true);
          else { setOpen(false); setActive(-1); }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
            triggerRef.current?.focus();
          }
        }}
        className="fixed bottom-auto right-auto m-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 text-slate-900 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.22)] backdrop:bg-black/40 xl:backdrop:bg-transparent"
      >
        <form onSubmit={handleSubmit} role="search" className="flex max-h-[inherit] flex-col">
          <div className="shrink-0 border-b border-slate-100 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 id={`${panelId}-title`} className="text-sm font-semibold leading-snug text-slate-800">{SMART_SEARCH_LABEL}</h2>
              </div>
              <button type="button" onClick={close} aria-label="Đóng tìm kiếm" className="flex h-11 w-11 shrink-0 cursor-pointer sm:h-9 sm:w-9 items-center justify-center rounded-lg text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">✕</button>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-0.5 sm:gap-2 sm:px-2.5 sm:py-1 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
              <button type="submit" disabled={!hasQuery || loading} aria-label={loading ? "Đang phân tích" : "Tìm kiếm"} title="Tìm kiếm" className="flex h-11 w-11 shrink-0 cursor-pointer sm:h-9 sm:w-9 items-center justify-center rounded-lg transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600 motion-reduce:animate-none" /> : <Image src={iconSrc} alt="" width={22} height={22} />}
              </button>
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                onCompositionStart={() => setComposing(true)}
                onCompositionEnd={() => setComposing(false)}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing || composing) {
                    if (event.key === "Enter") event.preventDefault();
                    return;
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (showResults && active >= 0 && items[active]) {
                      close();
                      router.push(storyHref(items[active].slug));
                    } else {
                      // Use the same submit path for hardware and mobile keyboards.
                      event.currentTarget.form?.requestSubmit();
                    }
                    return;
                  }
                  if (showResults && items.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
                    event.preventDefault();
                    const direction = event.key === "ArrowDown" ? 1 : -1;
                    const next = (active + direction + items.length) % items.length;
                    setActive(next);
                    document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
                  }
                }}
                role="combobox"
                aria-autocomplete="none"
                aria-expanded={showResults && items.length > 0}
                aria-controls={showResults ? listId : undefined}
                aria-activedescendant={showResults && items[active] ? `${listId}-${active}` : undefined}
                autoComplete="off"
                maxLength={256}
                placeholder={placeholder}
                aria-label={SMART_SEARCH_LABEL}
                className="w-full min-w-0 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query && <button type="button" onClick={() => { updateQuery(""); inputRef.current?.focus(); }} aria-label="Xóa từ khóa" className="flex h-11 w-9 shrink-0 sm:h-9 cursor-pointer items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700">✕</button>}
            </div>
          </div>

          <div aria-busy={loading} className="min-h-0 overflow-y-auto overscroll-contain p-2">
            <div role="status" aria-live="polite" className="px-2 py-2 text-xs leading-relaxed text-slate-500 sm:px-3 sm:py-2">
              {loading ? (
                <div className="flex items-center gap-3 py-3">
                  <span aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-600 motion-reduce:animate-none" />
                  <span className="font-medium text-slate-700">Đang phân tích nội dung tìm kiếm…</span>
                </div>
              ) : error ? "Tìm kiếm chưa thành công. Vui lòng thử lại." : !searchedQuery ? "Nhập tên hoặc mô tả truyện rồi nhấn Enter." : items.length ? `${items.length} kết quả phù hợp` : "Không tìm thấy truyện phù hợp."}
            </div>
            {!query.trim() && (
              <div className="flex flex-wrap gap-2 px-2 pb-2 sm:px-3">
                {EXAMPLE_QUERIES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => { updateQuery(example); inputRef.current?.focus(); }}
                    className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}
            {showResults && <ul id={listId} role="listbox" aria-label="Kết quả tìm truyện" className="space-y-1">
              {items.map((item, index) => (
                <li key={item._id} id={`${listId}-${index}`} role="option" aria-selected={active === index}>
                  <Link href={storyHref(item.slug)} onClick={close} className={`flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-500 ${active === index ? "bg-emerald-50" : ""}`}>
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverUrl} alt="" loading="lazy" className="h-16 w-11 shrink-0 rounded object-cover sm:h-20 sm:w-14 shadow-sm" />
                    ) : <span aria-hidden="true" className="h-16 w-11 shrink-0 rounded bg-slate-100 sm:h-20 sm:w-14" />}
                    <span className="min-w-0 flex-1 py-1">
                      <span className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{item.title}</span>
                      <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{item.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>}
          </div>
        </form>
      </div>
    </div>
  );
}
