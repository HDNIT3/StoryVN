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
  iconSrc = DEFAULT_LOGO.iconSrc ?? "/image/logo-icon.svg",
  href = DEFAULT_LOGO.href ?? "/",
  className = "",
}: LogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-3 group transition-transform active:scale-95 ${className}`}
      aria-label={`${title}${suffix} - ${subtitle}`}
    >
      {/* Brand Icon Box */}
      <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden shadow-xs group-hover:shadow-md transition-shadow">
        <Image
          src={iconSrc}
          alt={`${title}${suffix} Icon`}
          width={40}
          height={40}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col select-none">
        <span className="text-xl font-bold tracking-tight leading-none text-zinc-900 flex items-center">
          {title}
          <span className="text-orange-600 ml-0.5">{suffix}</span>
        </span>
        <span className="text-[9px] font-semibold tracking-wider text-zinc-400 mt-1 uppercase leading-none">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}
