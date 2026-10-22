import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { StoryDetailData } from "@/features/stories";

interface AuthorSidebarCardProps {
  author?: StoryDetailData["author"];
}

export const AuthorSidebarCard: React.FC<AuthorSidebarCardProps> = ({ author }) => {
  const avatar = author?.avatar || null;
  const name =
    author?.penName ||
    author?.displayName ||
    author?.name ||
    author?.username ||
    "Tác giả StoryVN";
  const initial = name[0]?.toUpperCase() || "T";

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs relative overflow-hidden p-6 text-center">
      {/* Trang trí background nhẹ */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-amber-50/70 rounded-full blur-2xl pointer-events-none -mr-14 -mt-14" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-50/70 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12" />

      <div className="relative flex flex-col items-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-300 via-emerald-200 to-amber-200 p-[3px] shadow-sm">
          <div className="relative w-full h-full rounded-full overflow-hidden bg-emerald-50 border-2 border-white flex items-center justify-center text-emerald-800 text-2xl font-extrabold">
            {avatar ? (
              <Image
                src={avatar}
                alt={name}
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>
        </div>

        {/* Thông tin tác giả */}
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Tác giả truyện này
        </div>

        <h3 className="mt-1 text-lg font-extrabold text-zinc-900 tracking-tight leading-snug">
          {name}
        </h3>
        {author?.username && (
          <p className="text-xs text-zinc-400">@{author.username}</p>
        )}

        <p className="mt-2 text-xs text-zinc-600 leading-relaxed line-clamp-3">
          {author?.bio?.trim() || "Chào mừng bạn đến với trang tác phẩm của tôi trên StoryVN."}
        </p>

        {typeof author?.storyCount === "number" && author.storyCount > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {author.storyCount} tác phẩm đã đăng
          </div>
        )}

        {/* Nút xem trang tác giả */}
        <div className="mt-4 w-full">
          {author?.username ? (
            <Link
              href={`/tac-gia/${author.username}`}
              className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
            >
              <span>Xem trang tác giả</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ) : (
            <span className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-500 border border-zinc-200 cursor-default">
              Trang tác giả sắp ra mắt
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
