"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BookmarkInfo } from "./header.types";
import { DEFAULT_BOOKMARK } from "./header.constants";

interface HeaderBookmarkProps {
  bookmark?: BookmarkInfo;
  onClick?: () => void;
  className?: string;
}

export function HeaderBookmark({
  bookmark = DEFAULT_BOOKMARK,
  onClick,
  className = "",
}: HeaderBookmarkProps) {
  const count = bookmark.count ?? 0;
  const iconSrc = bookmark.iconSrc ?? "/icon/bookmark.svg";
  const href = bookmark.href ?? "/tai-khoan/tu-truyen";

  const content = (
    <div
      className={`relative p-1 sm:p-2 rounded-full hover:bg-zinc-100 text-zinc-700 transition-colors select-none group cursor-pointer shrink-0 ${className}`}
      title="Tủ truyện đã lưu"
      aria-label={`Tủ truyện: ${count} truyện đã lưu`}
    >
      <div className="relative w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform group-hover:scale-105">
        <Image
          src={iconSrc}
          alt="Icon tủ truyện"
          width={20}
          height={20}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Badge Count */}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[15px] sm:min-w-[20px] h-[15px] sm:h-[20px] px-0.5 sm:px-1 bg-sky-500 text-white text-[9px] sm:text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs ring-1.5 sm:ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );

  if (bookmark.onClick || onClick) {
    return (
      <button
        type="button"
        onClick={() => {
          onClick?.();
          bookmark.onClick?.();
        }}
      >
        {content}
      </button>
    );
  }

  return <Link href={href}>{content}</Link>;
}
