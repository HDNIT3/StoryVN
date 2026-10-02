"use client";

import React, { useState } from "react";
import Image from "next/image";
import { HeaderSearchProps } from "./header.types";
import { DEFAULT_SEARCH } from "./header.constants";

export function HeaderSearch({
  placeholder = DEFAULT_SEARCH.placeholder ?? "Tìm tên truyện, tác giả...",
  iconSrc = DEFAULT_SEARCH.iconSrc ?? "/icon/search.svg",
  defaultValue = "",
  onSearch,
  className = "",
}: HeaderSearchProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`relative flex items-center w-full bg-zinc-100/90 hover:bg-zinc-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-400 border border-transparent rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-200 ${className}`}
    >
      {/* Search Icon from public */}
      <button
        type="submit"
        aria-label="Tìm kiếm"
        className="relative w-4 h-4 shrink-0 mr-2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer flex items-center justify-center"
      >
        <Image
          src={iconSrc}
          alt="Icon tìm kiếm"
          width={16}
          height={16}
          className="w-full h-full object-contain opacity-75"
        />
      </button>

      {/* Input Field */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Tìm kiếm truyện"
        className="w-full min-w-0 bg-transparent text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden"
      />

      {/* Clear Button */}
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Xóa từ khóa"
          className="ml-1 text-xs text-zinc-400 hover:text-zinc-600 rounded-full w-4 h-4 flex items-center justify-center shrink-0 cursor-pointer"
        >
          ✕
        </button>
      )}
    </form>
  );
}
