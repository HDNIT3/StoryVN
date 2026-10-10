"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { LogoProps } from "./header.types";
import { DEFAULT_LOGO } from "./header.constants";

export function HeaderLogo({
  title = DEFAULT_LOGO.title ?? "Story",
  suffix = DEFAULT_LOGO.suffix ?? "VN",
  subtitle = DEFAULT_LOGO.subtitle ?? "TIỂU THUYẾT TRỰC TUYẾN",
  iconSrc = DEFAULT_LOGO.iconSrc ?? "/icon/iconweb.png",
  href = DEFAULT_LOGO.href ?? "/",
  className = "",
}: LogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 sm:gap-2.5 group transition-transform active:scale-95 shrink-0 ${className}`}
      aria-label={`${title}${suffix} - ${subtitle}`}
    >
      {/* Brand Icon Box */}
      <div className="relative w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 rounded-xl overflow-hidden shadow-xs group-hover:shadow-md transition-shadow border border-zinc-100">
        <Image
          src={iconSrc}
          alt={`${title}${suffix} Icon`}
          width={40}
          height={40}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col select-none">
        <span className="text-base sm:text-xl md:text-2xl font-black tracking-tight leading-none text-zinc-900 flex items-center">
          {title}
          <span className="text-sky-500 ml-0.5">{suffix}</span>
        </span>
        <span className="hidden 2xl:block text-[9px] font-bold tracking-widest text-zinc-400 mt-0.5 uppercase leading-none truncate max-w-[140px]">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}
