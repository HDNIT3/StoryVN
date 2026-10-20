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
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`relative flex w-full items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-[0_6px_20px_-16px_rgba(15,23,42,0.5)] transition-all duration-200 hover:border-slate-300 focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-500/15 sm:px-5 ${className}`}
    >
      {/* Search Icon from public */}
      <button
        type="submit"
        aria-label="Tìm kiếm"
        className="relative mr-2.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center text-zinc-400 transition-colors hover:text-zinc-600"
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
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Tìm kiếm truyện"
        className="w-full min-w-0 bg-transparent text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden"
      />

      {/* Clear Button */}
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Xóa từ khóa"
          className="ml-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-sm text-zinc-400 hover:text-zinc-600"
        >
          ✕
        </button>
      )}
    </form>
  );
}
