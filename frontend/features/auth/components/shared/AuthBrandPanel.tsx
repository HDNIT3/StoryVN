"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface AuthBrandPanelProps {
  title?: string;
  subtitle?: string;
}

export function AuthBrandPanel({
  title = "Đắm chìm trong thế giới tiểu thuyết bất tận",
  subtitle = "Khám phá hàng ngàn bộ truyện kỳ ảo đặc sắc mỗi ngày.",
}: AuthBrandPanelProps) {
  return (
    <div className="relative w-full h-full max-h-screen bg-gradient-to-b from-[#060b18] via-[#091e42] to-[#025a8d] text-white p-6 lg:p-8 xl:p-12 flex flex-col justify-between overflow-hidden select-none">
      {/* Ambient Lighting & Star Orbs Backdrop */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-sky-600/25 rounded-full blur-2xl" />

        {/* Twinkle stars */}
        <span className="absolute top-12 left-[18%] text-sky-300 text-xs opacity-70 animate-pulse">✦</span>
        <span className="absolute top-1/3 left-[75%] text-sky-200 text-sm opacity-60 animate-pulse delay-700">✧</span>
        <span className="absolute bottom-1/4 left-[15%] text-indigo-200 text-xs opacity-80 animate-pulse delay-1000">✦</span>
        <span className="absolute top-2/3 right-[18%] text-sky-300 text-xs opacity-60 animate-pulse delay-500">✧</span>
        <span className="absolute top-8 right-[25%] text-white text-sm opacity-50 animate-pulse delay-300">✦</span>
      </div>

      {/* Brand Identity Header: Centered on Left Panel */}
      <div className="relative z-10 flex items-center justify-center w-full">
        <Link href="/" className="inline-flex items-center gap-3 group focus:outline-none">
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-lg shadow-sky-500/30 group-hover:scale-105 transition-transform duration-200">
            <Image
              src="/icon/iconweb.png"
              alt="StoryVN Icon"
              width={48}
              height={48}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-2xl sm:text-[28px] font-black tracking-tight leading-none text-white">
              Story<span className="bg-gradient-to-r from-sky-400 to-indigo-300 bg-clip-text text-transparent ml-0.5">VN</span>
            </span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-sky-200/70 mt-1">
              Tiểu Thuyết Trực Tuyến
            </span>
          </div>
        </Link>
      </div>

      {/* Center Hero Area: 3D Celestial Book & Headlines: All Centered */}
      <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center max-w-lg mx-auto w-full text-center">
        {/* 3D Glowing Celestial Magic Book: Seamless floating transparent visual */}
        <div className="relative w-full max-w-[420px] aspect-[16/11] max-h-[36vh] mx-auto group mb-4 shrink flex items-center justify-center">
          <Image
            src="/image/auth-showcase-3d.png"
            alt="StoryVN 3D Celestial Grimoire"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={100}
            priority
            className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_12px_40px_rgba(14,165,233,0.3)] transform group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>

        {/* Headlines: Centered */}
        <div className="space-y-2 max-w-md mx-auto">
          <h1 className="text-xl sm:text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-snug">
            {title}
          </h1>
          <p className="text-sky-100/80 text-xs sm:text-sm leading-relaxed font-light">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Copyright: Centered at Bottom */}
      <div className="relative z-10 text-center text-xs text-sky-200/50 font-normal">
        <span>© StoryVN • Khám phá tri thức & sáng tạo</span>
      </div>
    </div>
  );
}

export default AuthBrandPanel;
