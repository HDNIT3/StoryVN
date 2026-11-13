"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HeaderSearchProps, DEFAULT_SEARCH } from "./header.config";

export function HeaderSearch({
  placeholder = DEFAULT_SEARCH.placeholder ?? "Tìm tên truyện, tác giả...",
  iconSrc = DEFAULT_SEARCH.iconSrc ?? "/icon/search.svg",
  defaultValue = "",
  onSearch,
  className = "",
}: HeaderSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (onSearch) {
      onSearch(trimmed);
    } else {
      router.push(`/truyen?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`relative flex w-full items-center rounded-full border border-slate-200/90 bg-white/95 px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xs transition-all duration-200 hover:border-slate-300 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-500/10 ${className}`}
    >
      {/* Search Icon from public */}
      <button
        type="submit"
        aria-label="Tìm kiếm"
        className="relative mr-2.5 flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:text-sky-600"
      >
        <Image
          src={iconSrc}
          alt="Icon tìm kiếm"
          width={20}
          height={20}
          className="h-full w-full object-contain opacity-75"
        />
      </button>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Tìm kiếm truyện"
        className="w-full min-w-0 bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
      />

      {/* Clear Button or Keyboard Shortcut */}
      {query ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Xóa từ khóa"
          className="ml-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          ✕
        </button>
      ) : (
        <kbd className="hidden xl:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 rounded-md border border-slate-200 select-none">
          Ctrl K
        </kbd>
      )}
    </form>
  );
}
