import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { StoryDetailData } from "@/features/stories";

interface AuthorSidebarCardProps {
  author?: StoryDetailData["author"];
  isFollowingAuthor?: boolean;
  isFollowAuthorPending?: boolean;
  onToggleFollowAuthor?: () => void;
}

export const AuthorSidebarCard: React.FC<AuthorSidebarCardProps> = ({
  author,
  isFollowingAuthor,
  isFollowAuthorPending,
  onToggleFollowAuthor,
}) => {
  const avatar = author?.avatar || null;
  const name =
    author?.penName ||
    author?.displayName ||
    author?.name ||
    author?.username ||
    "Tác giả StoryVN";
  const initial = name[0]?.toUpperCase() || "T";

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden p-6 text-center">
      {/* Trang trí background nhẹ */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-100/30 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

      <div className="relative flex flex-col items-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 via-teal-300 to-sky-300 p-[3px] shadow-md">
          <div className="relative w-full h-full rounded-full overflow-hidden bg-emerald-50 border-2 border-white flex items-center justify-center text-emerald-800 text-2xl font-black">
            {avatar ? (
              <Image
                src={avatar}
                alt={name}
                fill
                loading="lazy"
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>
        </div>

        {/* Thông tin tác giả */}
        <div className="mt-3.5 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 shadow-2xs">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Tác giả truyện
        </div>

        <h3 className="mt-2 text-lg font-black text-slate-900 tracking-tight leading-snug">
          {name}
        </h3>
        {author?.username && (
          <p className="text-xs font-medium text-slate-400">@{author.username}</p>
        )}

        <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
          {author?.bio?.trim() || "Chào mừng bạn đến với trang tác phẩm của tôi trên StoryVN."}
        </p>

        {typeof author?.storyCount === "number" && author.storyCount > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {author.storyCount} tác phẩm đã đăng
          </div>
        )}

        {/* Nút thao tác tác giả */}
        <div className="mt-4 w-full flex flex-col gap-2.5">
          {author?.username && onToggleFollowAuthor && (
            <button
              type="button"
              onClick={onToggleFollowAuthor}
              disabled={isFollowAuthorPending}
              className={`inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                isFollowingAuthor
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs active:scale-[0.98]"
              }`}
            >
              {isFollowingAuthor ? (
                <>
                  <svg className="w-4 h-4 text-emerald-700 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>Đang theo dõi tác giả</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Theo dõi tác giả</span>
                </>
              )}
            </button>
          )}

          {author?.username ? (
            <Link
              href={`/tac-gia/${author.username}`}
              className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all"
            >
              <span>Xem trang tác giả</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ) : (
            <span className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-400 border border-slate-200 cursor-default">
              Trang tác giả sắp ra mắt
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
