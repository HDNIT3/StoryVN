"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authorService } from "@/lib/services/author.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type { AuthorStoryItem } from "@/types/author";

// Helper định dạng số dạng 1.5K, 2.4M
function formatNumber(num?: number): string {
  if (!num || isNaN(num)) return "0";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString("vi-VN");
}

// Helper định dạng ngày tháng tham gia: Tháng MM/YYYY
function formatJoinedDate(dateStr?: string | null): string {
  if (!dateStr) return "Gần đây";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Gần đây";
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `Tháng ${month}/${year}`;
  } catch {
    return "Gần đây";
  }
}

// Helper tính khoảng thời gian tương đối
function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Vừa xong";
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return "Vừa xong";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  } catch {
    return "Vừa xong";
  }
}

export default function AuthorDetailPage() {
  const params = useParams();
  const usernameParam = Array.isArray(params?.username)
    ? params.username[0]
    : (params?.username as string) || "";

  // Bộ lọc danh sách tác phẩm
  const [progressTab, setProgressTab] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "views" | "rating" | "chapters">("latest");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Trạng thái modal Donate / Ủng hộ
  const [showDonateModal, setShowDonateModal] = useState<boolean>(false);
  const [isCopiedBank, setIsCopiedBank] = useState<boolean>(false);

  // Trạng thái nút Theo dõi hiển thị trên giao diện (chưa lưu database)
  const [isFollowedDemo, setIsFollowedDemo] = useState<boolean>(false);

  // 1. Query thông tin tác giả
  const {
    data: authorData,
    isLoading: isLoadingAuthor,
    isError: isErrorAuthor,
  } = useQuery({
    queryKey: queryKeys.author.profile(usernameParam),
    queryFn: () => authorService.getPublicProfile(usernameParam),
    enabled: !!usernameParam,
  });

  const author = authorData?.data?.author;

  // 2. Query danh sách tác phẩm của tác giả
  const {
    data: storiesData,
    isLoading: isLoadingStories,
  } = useQuery({
    queryKey: queryKeys.author.stories(usernameParam, {
      progressState: progressTab !== "ALL" ? progressTab : undefined,
      sortBy,
      page: currentPage,
    }),
    queryFn: () =>
      authorService.getPublicStories(usernameParam, {
        progressState: progressTab !== "ALL" ? progressTab : undefined,
        sortBy,
        page: currentPage,
        limit: 12,
      }),
    enabled: !!usernameParam,
  });

  const stories = storiesData?.data?.items || [];
  const pagination = storiesData?.data?.pagination;

  // Xử lý nút Theo dõi (Giao diện hiển thị, chưa can thiệp DB)
  const handleFollowClick = () => {
    setIsFollowedDemo((prev) => !prev);
    if (!isFollowedDemo) {
      toast.info("Đã bật nhận thông báo sáng tác từ tác giả (bản thử nghiệm).");
    } else {
      toast.info("Đã bỏ theo dõi tác giả.");
    }
  };

  // Xử lý nút Chia sẻ
  const handleShareClick = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết trang tác giả vào bộ nhớ tạm!");
    }
  };

  // Sao chép số tài khoản trong modal Donate
  const handleCopyBankAccount = (accNumber: string) => {
    if (typeof window !== "undefined" && accNumber) {
      navigator.clipboard.writeText(accNumber);
      setIsCopiedBank(true);
      toast.success("Đã sao chép số tài khoản!");
      setTimeout(() => setIsCopiedBank(false), 2000);
    }
  };

  // Tính link VietQR nhanh nếu tác giả có thông tin ngân hàng
  const vietQrUrl = useMemo(() => {
    if (!author?.donateInfo?.bankName || !author?.donateInfo?.bankAccountNumber) {
      return null;
    }
    const bank = encodeURIComponent(author.donateInfo.bankName.trim());
    const acc = encodeURIComponent(author.donateInfo.bankAccountNumber.trim());
    const memo = encodeURIComponent(`Ung ho tac gia ${author.penName}`);
    return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=0&addInfo=${memo}`;
  }, [author]);

  // Loading Skeleton State
  if (isLoadingAuthor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-64 sm:h-72 w-full rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
        {/* Header Skeleton */}
        <div className="relative -mt-16 sm:-mt-20 px-6 sm:px-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-zinc-300 dark:bg-zinc-700 border-4 border-white dark:border-zinc-900" />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="h-7 w-48 bg-zinc-300 dark:bg-zinc-700 rounded-lg mx-auto sm:mx-0" />
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto sm:mx-0" />
          </div>
        </div>
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  // Not Found State
  if (isErrorAuthor || !author) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Không tìm thấy tác giả
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Tác giả với định danh &quot;{usernameParam}&quot; không tồn tại hoặc đã ngừng hoạt động trên StoryVN.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/truyen"
            className="px-5 py-2.5 rounded-xl font-medium text-sm bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-sm shadow-sky-600/20"
          >
            Khám phá truyện khác
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl font-medium text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const effectiveFollowerCount =
    (author.followerCount || 0) + (isFollowedDemo ? 1 : 0);

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* ═══════════════════════════════════════════════════════════
            1. BANNER & THÔNG TIN HỒ SƠ TÁC GIẢ (HERO SECTION)
        ═════════════════════════════════════════════════════════════ */}
        <div className="relative rounded-3xl overflow-hidden shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 transition-colors">
          {/* Banner Gradient Sang Trọng */}
          <div className="h-44 sm:h-56 md:h-64 w-full relative bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-700 overflow-hidden">
            {/* Pattern trang trí ngầm */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)",
                backgroundSize: "100px 100px",
              }}
            />
            {/* Ambient Lighting Overlay */}
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-80 h-80 bg-fuchsia-400/20 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Phần nội dung Profile đè lên Banner */}
          <div className="px-6 sm:px-8 pb-8 pt-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
              {/* Cụm Avatar + Tên + Badge */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                {/* Avatar */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-white dark:bg-zinc-900 shadow-xl ring-4 ring-sky-500/20 flex-shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-inner">
                    {author.avatarUrl ? (
                      <Image
                        src={author.avatarUrl}
                        alt={author.penName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 112px, 144px"
                        priority
                      />
                    ) : (
                      <span>{author.penName?.charAt(0)?.toUpperCase() || "A"}</span>
                    )}
                  </div>
                </div>

                {/* Tên bút danh & Handle */}
                <div className="pt-2 sm:pt-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                      {author.penName}
                    </h1>
                    {/* Badge Tác giả chính thức */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300/50 dark:border-sky-800">
                      <svg className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Tác Giả
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="font-mono text-zinc-600 dark:text-zinc-300">
                      @{author.username}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Sáng tác từ {formatJoinedDate(author.joinedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Nút Hành Động Tương Tác */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
                {/* 1. Nút Theo Dõi */}
                <button
                  type="button"
                  onClick={handleFollowClick}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm ${
                    isFollowedDemo
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20 hover:scale-[1.02]"
                  }`}
                  title="Theo dõi tác giả"
                >
                  {isFollowedDemo ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Đang theo dõi</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Theo Dõi ({formatNumber(effectiveFollowerCount)})</span>
                    </>
                  )}
                </button>

                {/* 2. Nút Ủng Hộ Tác Giả (Mở Modal VietQR) */}
                <button
                  type="button"
                  onClick={() => setShowDonateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/80 transition-all duration-200 hover:scale-[1.02] shadow-sm"
                  title="Ủng hộ cốc cà phê cho tác giả"
                >
                  <span className="text-base">☕</span>
                  <span>Ủng Hộ Tác Giả</span>
                </button>

                {/* 3. Nút Chia Sẻ Trang */}
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-all duration-200"
                  title="Sao chép link chia sẻ"
                >
                  <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="hidden sm:inline">Chia Sẻ</span>
                </button>
              </div>
            </div>

            {/* Tiểu sử (Biography) */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
              <p className="text-zinc-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {author.biography || (
                  <span className="italic text-zinc-400 dark:text-zinc-500">
                    Tác giả này rất lười, chưa để lại lời giới thiệu nào.
                  </span>
                )}
              </p>

              {/* Danh sách Liên Kết Xã Hội & Website */}
              {(author.website || (author.socialLinks && Object.keys(author.socialLinks).length > 0)) && (
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
                  {author.website && (
                    <a
                      href={author.website.startsWith("http") ? author.website : `https://${author.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 capitalize transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          {network}
                        </a>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            2. THANH THỐNG KÊ NHANH (4 METRIC COUNTERS)
        ═════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {/* Card 1: Tổng Tác Phẩm */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl flex-shrink-0">
              📊
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Tác Phẩm
              </p>
              <p className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {author.storyCount || 0}
              </p>
            </div>
          </div>

          {/* Card 2: Tổng Lượt Đọc */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl flex-shrink-0">
              👁️
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Tổng Lượt Đọc
              </p>
              <p className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatNumber(author.totalViews || 0)}
              </p>
            </div>
          </div>

          {/* Card 3: Người Theo Dõi */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl flex-shrink-0">
              👥
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Người Theo Dõi
              </p>
              <p className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatNumber(effectiveFollowerCount)}
              </p>
            </div>
          </div>

          {/* Card 4: Đánh Giá Trung Bình */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl flex-shrink-0">
              ⭐
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Đánh Giá Chung
              </p>
              <p className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {author.ratingAverage > 0 ? `${author.ratingAverage}/5` : "5.0/5"}
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            3. KHU VỰC TÁC PHẨM CỦA TÁC GIẢ (CATALOG)
        ═════════════════════════════════════════════════════════════ */}
        <div className="mt-10">
          {/* Thanh Tabs và Bộ lọc sắp xếp */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            {/* Tabs Trạng thái */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setProgressTab("ALL");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  progressTab === "ALL"
                    ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-800"
                }`}
              >
                Tất cả ({author.counts?.all ?? author.storyCount ?? 0})
              </button>

              <button
                type="button"
                onClick={() => {
                  setProgressTab("ONGOING");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  progressTab === "ONGOING"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-800"
                }`}
              >
                Đang ra ({author.counts?.ongoing ?? 0})
              </button>

              <button
                type="button"
                onClick={() => {
                  setProgressTab("COMPLETED");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  progressTab === "COMPLETED"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-800"
                }`}
              >
                Hoàn thành ({author.counts?.completed ?? 0})
              </button>

              {(author.counts?.onHold ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setProgressTab("ON_HOLD");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                    progressTab === "ON_HOLD"
                      ? "bg-amber-600 text-white shadow-sm shadow-amber-600/20"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-800"
                  }`}
                >
                  Tạm ngưng ({author.counts?.onHold ?? 0})
                </button>
              )}
            </div>

            {/* Dropdown Sắp Xếp */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label htmlFor="sort-stories" className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                Sắp xếp:
              </label>
              <select
                id="sort-stories"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl text-sm font-medium bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-sm"
              >
                <option value="latest">Mới cập nhật</option>
                <option value="views">Lượt xem nhiều</option>
                <option value="rating">Đánh giá cao</option>
                <option value="chapters">Số chương nhiều</option>
              </select>
            </div>
          </div>

          {/* Grid Danh Sách Truyện */}
          {isLoadingStories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 mt-6 p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl">
                📚
              </div>
              <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                Chưa có tác phẩm nào
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                {progressTab === "ALL"
                  ? "Tác giả hiện chưa xuất bản tác phẩm công khai nào trên StoryVN."
                  : "Không có tác phẩm nào phù hợp với bộ lọc hiện tại."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
              {stories.map((story: AuthorStoryItem) => (
                <article
                  key={story._id}
                  className="group flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Ảnh bìa */}
                  <Link
                    href={`/truyen/${story.slug}`}
                    className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 block"
                  >
                    {story.coverUrl ? (
                      <Image
                        src={story.coverUrl}
                        alt={story.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900">
                        <span className="text-3xl mb-2">📖</span>
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {story.title}
                        </span>
                      </div>
                    )}

                    {/* Huy hiệu Độ tuổi & Tiến độ */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
                      {story.progressState === "COMPLETED" ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-600/90 text-white backdrop-blur-md shadow-sm">
                          Hoàn thành
                        </span>
                      ) : story.progressState === "ON_HOLD" ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-600/90 text-white backdrop-blur-md shadow-sm">
                          Tạm ngưng
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-600/90 text-white backdrop-blur-md shadow-sm">
                          Đang ra
                        </span>
                      )}

                      {story.ageRating && story.ageRating !== "ALL" && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-600/90 text-white backdrop-blur-md">
                          {story.ageRating}
                        </span>
                      )}
                    </div>

                    {/* Số chương hiển thị góc dưới ảnh bìa */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/70 text-white backdrop-blur-sm">
                      {story.stats?.chapterCount || 0} chương
                    </div>
                  </Link>

                  {/* Nội dung thông tin truyện */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Thể loại */}
                      {story.genres && story.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {story.genres.slice(0, 2).map((g) => (
                            <span
                              key={g._id}
                              className="text-[11px] text-sky-600 dark:text-sky-400 font-medium"
                            >
                              #{g.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tiêu đề truyện */}
                      <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                        <Link href={`/truyen/${story.slug}`}>{story.title}</Link>
                      </h3>

                      {/* Mô tả ngắn */}
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {story.description || "Chưa có tóm tắt nội dung."}
                      </p>
                    </div>

                    {/* Thống kê Footer Card */}
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1" title="Lượt đọc">
                          👁️ {formatNumber(story.stats?.viewCount || 0)}
                        </span>
                        <span className="flex items-center gap-1 text-amber-500" title="Điểm đánh giá">
                          ⭐ {story.stats?.ratingAverage > 0 ? story.stats.ratingAverage.toFixed(1) : "5.0"}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400" title="Cập nhật gần nhất">
                        {formatRelativeTime(story.updatedAt)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Phân Trang (Pagination) */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={!pagination.hasPrevPage}
                className="px-3.5 py-2 rounded-xl text-sm font-medium bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Trước
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                    pageNum === currentPage
                      ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                      : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={!pagination.hasNextPage}
                className="px-3.5 py-2 rounded-xl text-sm font-medium bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          4. MODAL ỦNG HỘ TÁC GIẢ (DONATE / TIP VIETQR)
      ═════════════════════════════════════════════════════════════ */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 overflow-hidden">
            {/* Nút Đóng Modal */}
            <button
              type="button"
              onClick={() => setShowDonateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header Modal */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-inner">
                ☕
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Ủng Hộ Tác Giả
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Gửi một cốc cà phê động viên tinh thần sáng tác của <span className="font-semibold text-zinc-800 dark:text-zinc-200">{author.penName}</span>
              </p>
            </div>

            {/* Nội dung chi tiết ngân hàng hoặc mã QR */}
            {author.donateInfo?.bankAccountNumber && author.donateInfo?.bankName ? (
              <div className="mt-5 space-y-4">
                {/* Ảnh VietQR tạo tự động */}
                {vietQrUrl && (
                  <div className="flex flex-col items-center p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                    <div className="relative w-48 h-48 rounded-xl overflow-hidden bg-white p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vietQrUrl}
                        alt="Mã VietQR ủng hộ tác giả"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
                      Mở ứng dụng Ngân hàng để quét mã QR nhanh
                    </span>
                  </div>
                )}

                {/* Thông tin số tài khoản dạng text */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Ngân hàng:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {author.donateInfo.bankName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Chủ tài khoản:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase">
                      {author.donateInfo.bankAccountName || author.penName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {author.donateInfo.bankAccountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyBankAccount(author.donateInfo?.bankAccountNumber || "")}
                        className="px-2 py-0.5 rounded-lg text-xs font-medium bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 transition-colors"
                      >
                        {isCopiedBank ? "Đã chép!" : "Sao chép"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-6 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Tác giả hiện chưa cập nhật thông tin tài khoản ngân hàng nhận ủng hộ.
                </p>
              </div>
            )}

            {/* Nút Xong */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowDonateModal(false)}
                className="w-full py-2.5 rounded-xl font-medium text-sm bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
