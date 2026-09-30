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
      className={`group flex items-center justify-between py-2.5 px-3 rounded-xl text-base transition-colors duration-150 hover:bg-sky-50/80 ${className}`}
    >
      <span className="font-semibold text-zinc-800 group-hover:text-sky-600 transition-colors">
        {genre.name}
      </span>
      {genre.count !== undefined && (
        <span className="text-xs text-zinc-400 font-semibold group-hover:text-sky-500 transition-colors ml-3 bg-zinc-100 group-hover:bg-sky-100/70 px-2 py-0.5 rounded-full">
          {genre.count}
        </span>
      )}
    </Link>
  );
}
