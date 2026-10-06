"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { GenreItem as GenreItemType } from "./header.types";
import { DEFAULT_GENRES } from "./header.constants";
import { GenreItem } from "./GenreItem";

interface GenreDropdownProps {
  label?: string;
  genres?: GenreItemType[];
  isOpen?: boolean;
  isActive?: boolean;
  onOpenChange?: (open: boolean) => void;
  onGenreClick?: (genre: GenreItemType) => void;
  className?: string;
  chevronDownSrc?: string;
  chevronUpSrc?: string;
}

export function GenreDropdown({
  label = "Thể Loại",
  genres = DEFAULT_GENRES,
  isOpen: controlledIsOpen,
  isActive = false,
  onOpenChange,
  onGenreClick,
  className = "",
  chevronDownSrc = "/icon/chevron-down.svg",
  chevronUpSrc = "/icon/chevron-up.svg",
}: GenreDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalOpen;

  const setOpen = (val: boolean) => {
    if (!isControlled) {
      setInternalOpen(val);
    }
    onOpenChange?.(val);
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleGenreItemClick = (genre: GenreItemType) => {
    setOpen(false);
    onGenreClick?.(genre);
  };

  // Nếu danh sách thể loại dài thì chỉ preview 12 thể loại đầu và có nút Xem thêm
  const displayedGenres = genres.length > 14 ? genres.slice(0, 12) : genres;

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 2xl:gap-2 px-3 2xl:px-4 py-1.5 2xl:py-2 text-xs xl:text-sm 2xl:text-base rounded-full transition-all duration-150 select-none whitespace-nowrap cursor-pointer ${
          open
            ? "bg-zinc-100 text-zinc-900"
            : isActive
            ? "bg-sky-50 text-sky-600 font-medium shadow-xs hover:bg-sky-100/70"
            : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/70"
        }`}
      >
        <span>{label}</span>
        <div className="relative w-3.5 h-3.5 2xl:w-4 2xl:h-4 shrink-0 transition-transform duration-200">
          <Image
            src={open ? chevronUpSrc : chevronDownSrc}
            alt="Dropdown arrow"
            width={16}
            height={16}
            className="w-full h-full object-contain"
          />
        </div>
      </button>

      {/* Dropdown Popover Card */}
      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute left-0 mt-2 w-[360px] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-zinc-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header row */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Danh mục thể loại</span>
            <Link
              href="/the-loai"
              onClick={() => setOpen(false)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
            >
              Xem trang thể loại →
            </Link>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {displayedGenres.map((genre) => (
              <GenreItem
                key={genre.id}
                genre={genre}
                onClick={handleGenreItemClick}
              />
            ))}
          </div>

          {/* Footer: Xem thêm tất cả thể loại qua tab/trang riêng */}
          <div className="pt-2.5 mt-2.5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/80 -mx-4 -mb-4 p-3 rounded-b-2xl">
            <span className="text-[11px] text-zinc-500 font-medium">
              {genres.length > 12
                ? `Hiển thị 12 trong ${genres.length} thể loại`
                : `${genres.length} thể loại có sẵn`}
            </span>
            <Link
              href="/the-loai"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
            >
              <span>Xem tất cả thể loại</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
