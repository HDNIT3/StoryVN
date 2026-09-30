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
      className={`inline-flex items-center gap-3.5 group transition-transform active:scale-95 ${className}`}
      aria-label={`${title}${suffix} - ${subtitle}`}
    >
      {/* Brand Icon Box */}
      <div className="relative w-12 h-12 shrink-0 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow border border-zinc-100">
        <Image
          src={iconSrc}
          alt={`${title}${suffix} Icon`}
          width={48}
          height={48}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col select-none">
        <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-zinc-900 flex items-center">
          {title}
          <span className="text-sky-500 ml-0.5">{suffix}</span>
        </span>
        <span className="text-[11px] font-bold tracking-widest text-zinc-400 mt-1 uppercase leading-none">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}
