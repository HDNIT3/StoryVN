import React from "react";
import Image from "next/image";
import type { PublicAuthorProfile } from "@/features/author";

interface AuthorProfileHeaderProps {
  author: PublicAuthorProfile;
  isFollowedDemo: boolean;
  onFollowToggle: () => void;
  onShareClick: () => void;
  onOpenDonate: () => void;
  hasDonateInfo: boolean;
  totalChaptersCount: number;
  formatNumber: (num?: number) => string;
  formatJoinedDate: (dateStr?: string | null) => string;
  effectiveFollowerCount: number;
}

export function AuthorProfileHeader({
  author,
  isFollowedDemo,
  onFollowToggle,
  onShareClick,
  onOpenDonate,
  hasDonateInfo,
  totalChaptersCount,
  formatNumber,
  formatJoinedDate,
  effectiveFollowerCount,
}: AuthorProfileHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE7DF] p-5 sm:p-7 md:p-8 shadow-xs relative overflow-hidden">
      {/* Decorative radial gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#8B1E2D]/5 via-transparent to-transparent pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8 relative z-10">
        {/* Avatar */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-4 border-[#FAF7F2] shadow-md ring-2 ring-[#8B1E2D]/20 overflow-hidden shrink-0 bg-[#8B1E2D]/5 flex items-center justify-center">
          {author.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={author.penName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 160px"
              priority
            />
          ) : (
            <span className="text-4xl sm:text-5xl font-serif font-bold text-[#8B1E2D]">
              {author.penName?.charAt(0)?.toUpperCase() || "A"}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 w-full text-center md:text-left space-y-3.5">
          {/* Badge & Meta */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8B1E2D]/10 text-[#8B1E2D] border border-[#8B1E2D]/20">
              <svg className="w-3.5 h-3.5 text-[#8B1E2D]" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Tác giả chính thức
            </span>

            {author.username && (
              <span className="text-xs font-mono text-stone-500 bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#EDE7DF]">
                @{author.username}
              </span>
            )}

            {author.joinedAt && (
              <span className="text-xs text-stone-500 hidden sm:inline-flex items-center gap-1">
                <span>•</span>
                <span>Sáng tác từ {formatJoinedDate(author.joinedAt)}</span>
              </span>
            )}
          </div>

          {/* Pen name */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight font-serif">
            {author.penName}
          </h1>

          {/* Bio */}
          {author.biography && (
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-3xl">
              {author.biography}
            </p>
          )}

          {/* Website & Socials */}
          {(author.website || (author.socialLinks && Object.keys(author.socialLinks).length > 0)) && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-0.5">
              {author.website && (
                <a
                  href={author.website.startsWith("http") ? author.website : `https://${author.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#FAF7F2] hover:bg-[#F3ECE2] text-stone-700 border border-[#EDE7DF] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#8B1E2D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website cá nhân
                </a>
              )}

              {author.socialLinks &&
                Object.entries(author.socialLinks).map(([network, link]) => {
                  if (!link || typeof link !== "string") return null;
                  const cleanUrl = link.startsWith("http") ? link : `https://${link}`;
                  return (
                    <a
                      key={network}
                      href={cleanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#FAF7F2] hover:bg-[#F3ECE2] text-stone-700 border border-[#EDE7DF] capitalize transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B1E2D]" />
                      {network}
                    </a>
                  );
                })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
            <button
              type="button"
              onClick={onFollowToggle}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer ${
                isFollowedDemo
                  ? "bg-[#FAF7F2] hover:bg-[#F2ECE2] text-stone-800 border border-[#EDE7DF]"
                  : "bg-[#8B1E2D] hover:bg-[#741824] text-white shadow-[#8B1E2D]/20"
              }`}
            >
              {isFollowedDemo ? (
                <>
                  <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Đang theo dõi</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Theo dõi tác giả</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onShareClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FAF7F2] hover:bg-[#F2ECE2] text-stone-700 border border-[#EDE7DF] transition-colors cursor-pointer"
              title="Sao chép liên kết trang tác giả"
            >
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Chia sẻ</span>
            </button>

            {hasDonateInfo && (
              <button
                type="button"
                onClick={onOpenDonate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-50/80 hover:bg-amber-100/90 text-amber-900 border border-amber-200/80 transition-colors cursor-pointer"
              >
                <span>☕</span>
                <span>Ủng hộ tác giả</span>
              </button>
            )}
          </div>

          {/* Stats Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-3">
            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF] text-center sm:text-left">
              <span className="text-[11px] font-medium text-stone-500 block uppercase tracking-wider">
                Tác phẩm
              </span>
              <span className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5 block">
                {author.storyCount || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF] text-center sm:text-left">
              <span className="text-[11px] font-medium text-stone-500 block uppercase tracking-wider">
                Lượt đọc
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#8B1E2D] mt-0.5 block">
                {formatNumber(author.totalViews || 0)}
              </span>
            </div>

            {totalChaptersCount > 0 ? (
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF] text-center sm:text-left">
                <span className="text-[11px] font-medium text-stone-500 block uppercase tracking-wider">
                  Số chương
                </span>
                <span className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5 block">
                  {totalChaptersCount}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF] text-center sm:text-left">
                <span className="text-[11px] font-medium text-stone-500 block uppercase tracking-wider">
                  Đánh giá
                </span>
                <span className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5 block">
                  {author.ratingAverage > 0 ? `${author.ratingAverage.toFixed(1)} ⭐` : "5.0 ⭐"}
                </span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF] text-center sm:text-left">
              <span className="text-[11px] font-medium text-stone-500 block uppercase tracking-wider">
                Theo dõi
              </span>
              <span className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5 block">
                {formatNumber(effectiveFollowerCount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
