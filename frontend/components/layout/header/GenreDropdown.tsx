"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { GenreItem as GenreItemType } from "./header.types";
import { DEFAULT_GENRES } from "./header.constants";
import { GenreItem } from "./GenreItem";

interface GenreDropdownProps {
  label?: string;
  genres?: GenreItemType[];
  isOpen?: boolean;
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

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-150 select-none ${
          open
            ? "bg-zinc-100 text-zinc-900"
            : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/60"
        }`}
      >
        <span>{label}</span>
        <div className="relative w-3.5 h-3.5 shrink-0 transition-transform duration-200">
          <Image
            src={open ? chevronUpSrc : chevronDownSrc}
            alt="Dropdown arrow"
            width={14}
            height={14}
            className="w-full h-full object-contain"
          />
        </div>
      </button>

      {/* Dropdown Popover Card */}
      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute left-0 mt-2 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-xl border border-zinc-100/80 p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* 2-Column Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {genres.map((genre) => (
              <GenreItem
                key={genre.id}
                genre={genre}
                onClick={handleGenreItemClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
