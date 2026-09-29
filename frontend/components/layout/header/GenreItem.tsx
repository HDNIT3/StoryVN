"use client";

import React from "react";
import Link from "next/link";
import { GenreItem as GenreItemType } from "./header.types";

interface GenreItemProps {
  genre: GenreItemType;
  onClick?: (genre: GenreItemType) => void;
  className?: string;
}

export function GenreItem({ genre, onClick, className = "" }: GenreItemProps) {
  return (
    <Link
      href={genre.href}
      onClick={() => onClick?.(genre)}
      className={`group flex items-center justify-between py-2 px-2.5 rounded-lg text-sm transition-colors duration-150 hover:bg-orange-50/60 ${className}`}
    >
      <span className="font-medium text-zinc-700 group-hover:text-orange-600 transition-colors">
        {genre.name}
      </span>
      {genre.count !== undefined && (
        <span className="text-xs text-zinc-400 font-normal group-hover:text-orange-500/80 transition-colors ml-3">
          {genre.count}
        </span>
      )}
    </Link>
  );
}
