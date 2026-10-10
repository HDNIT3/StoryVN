"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { storyService } from "@/lib/services/story.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";
import type { SameGenreStoryItem, StoryAgeRating, StoryProgressState } from "@/types/story";

// Helper format số lượt đọc / theo dõi
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

// Helper format ngày tháng (DD/MM/YYYY)
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Chưa cập nhật";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// Helper tính khoảng thời gian tương đối
function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Chưa cập nhật";
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
    return dateStr;
  }
}

// Badge hiển thị tiến độ truyện
function ProgressBadge({ state }: { state?: StoryProgressState }) {
  switch (state) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          Hoàn thành
        </span>
      );
    case "ON_HOLD":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Tạm ngưng
        </span>
      );
    case "ONGOING":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Đang ra
        </span>
      );
  }
}

// Badge độ tuổi
function AgeRatingBadge({ rating }: { rating?: StoryAgeRating }) {
  switch (rating) {
    case "18+":
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          18+
        </span>
      );
    case "16+":
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          16+
        </span>
      );
    case "13+":
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          13+
        </span>
      );
    case "ALL":
    default:
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
          Mọi lứa tuổi
        </span>
      );
  }
}

export default function StoryDetailClient({ slug: initialSlug }: { slug?: string }) {
  const params = useParams();
  const slugParam =
    initialSlug ||
    (Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string) || "");

  const [activeTab, setActiveTab] = useState<"about" | "chapters" | "author">("about");

  // Query thông tin chi tiết truyện (kèm luôn sameGenreStories)
  const {
    data: storyRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.stories.bySlug(slugParam),
    queryFn: () => storyService.getStoryBySlug(slugParam),
    enabled: !!slugParam,
  });

  const story = storyRes?.data;
  const sameGenreStories: SameGenreStoryItem[] = story?.sameGenreStories || [];

  // Handler chia sẻ liên kết truyện (Hỗ trợ Web Share API trên di động + Copy link dự phòng)
  const handleShare = async () => {
    if (typeof window === "undefined" || !story) return;

    const authorName =
      story.author?.penName ||
      story.author?.displayName ||
      story.author?.name ||
      story.author?.username ||
      "Tác giả";
    const shareUrl = window.location.href;
    const shareData = {
      title: `${story.title} - ${authorName}`,
      text: `Đọc tác phẩm "${story.title}" của tác giả ${authorName} trên StoryVN nhé:`,
      url: shareUrl,
    };

    // 1. Nếu thiết bị hỗ trợ Web Share API (điện thoại iOS/Android, Chrome, Safari...)
    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        // Nếu người dùng chủ động đóng hộp thoại chia sẻ thì không báo lỗi
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
      }
    }

    // 2. Dự phòng: Sao chép link vào bộ nhớ tạm (cho máy tính hoặc trình duyệt không hỗ trợ)
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Đã sao chép liên kết truyện vào bộ nhớ tạm!");
    } catch {
      toast.error("Không thể sao chép liên kết, vui lòng copy trên thanh địa chỉ.");
    }
  };

  // Thông báo chức năng chưa kích hoạt theo yêu cầu
  const handleFunctionPlaceholder = (featureName: string) => {
    toast.info(`Chức năng "${featureName}" đang được hoàn thiện trong các giai đoạn kế tiếp.`);
  };

  // 1. Trạng thái Đang tải (Skeleton)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Skeleton Breadcrumb */}
          <div className="h-4 bg-zinc-200 rounded w-48 mb-6 animate-pulse" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cột trái Skeleton */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs animate-pulse">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-48 h-64 bg-zinc-200 rounded-2xl shrink-0 mx-auto sm:mx-0" />
                  <div className="flex-1 space-y-4">
                    <div className="h-7 bg-zinc-200 rounded w-3/4" />
                    <div className="h-4 bg-zinc-200 rounded w-1/3" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-zinc-200 rounded-full w-20" />
                      <div className="h-6 bg-zinc-200 rounded-full w-20" />
                    </div>
                    <div className="h-20 bg-zinc-100 rounded-xl" />
                    <div className="h-10 bg-zinc-200 rounded-xl w-40" />
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải Skeleton */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs animate-pulse space-y-4">
                <div className="h-5 bg-zinc-200 rounded w-1/2 mb-4" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-14 h-20 bg-zinc-200 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-200 rounded w-3/4" />
                      <div className="h-3 bg-zinc-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Trạng thái Không tìm thấy truyện
  if (isError || !story) {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Không tìm thấy tác phẩm</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Truyện với đường dẫn &quot;{slugParam}&quot; có thể chưa được xuất bản công khai hoặc đã bị thay đổi liên kết.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/truyen"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm"
            >
              Xem danh sách truyện
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* ═══════════════════════════════════════════════════════════
            BREADCRUMBS
        ═════════════════════════════════════════════════════════════ */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-6 overflow-hidden">
          <Link href="/" className="hover:text-emerald-700 transition-colors shrink-0">
            Trang chủ
          </Link>
          <span className="text-zinc-400">/</span>
          <Link href="/truyen" className="hover:text-emerald-700 transition-colors shrink-0">
            Truyện
          </Link>
          <span className="text-zinc-400">/</span>
          <span className="text-zinc-800 font-medium truncate">{story.title}</span>
        </nav>

        {/* ═══════════════════════════════════════════════════════════
            MAIN LAYOUT: 2 CỘT (NỘI DUNG CHÍNH + TRUYỆN CÙNG THỂ LOẠI)
        ═════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ═══════════════════════════════════════════════════════════
              CỘT TRÁI (8 COLS): THÔNG TIN CƠ BẢN TRUYỆN
          ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD THÔNG TIN TỔNG QUAN (HERO CARD) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs relative overflow-hidden">
              {/* Trang trí background nhẹ */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

              <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                
                {/* ẢNH BÌA TRUYỆN */}
                <div className="w-full sm:w-56 shrink-0 flex flex-col items-center">
                  <div className="relative w-44 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200/80 shadow-md">
                    {story.coverUrl ? (
                      <Image
                        src={story.coverUrl}
                        alt={story.title}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 176px, 224px"
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 p-4 text-center">
                        <svg className="w-12 h-12 mb-2 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-xs">Chưa có ảnh bìa</span>
                      </div>
                    )}
                  </div>

                  {/* Badges dưới ảnh bìa */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <ProgressBadge state={story.progressState} />
                    <AgeRatingBadge rating={story.ageRating} />
                  </div>
                </div>

                {/* THÔNG TIN CHI TIẾT */}
                <div className="flex-1 min-w-0">
                  {/* TIÊU ĐỀ TRUYỆN */}
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-snug">
                    {story.title}
                  </h1>

                  {/* TÁC GIẢ */}
                  <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
                    <span className="text-zinc-500">Tác giả:</span>
                    {story.author?.username ? (
                      <Link
                        href={`/tac-gia/${story.author.username}`}
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-900 hover:underline transition-colors"
                      >
                        {story.author.avatar && (
                          <span className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 border border-zinc-200">
                            <Image
                              src={story.author.avatar}
                              alt={story.author.name || "avatar"}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </span>
                        )}
                        <span>{story.author.penName || story.author.displayName || story.author.name || story.author.username}</span>
                      </Link>
                    ) : (
                      <span className="font-semibold text-zinc-800">
                        {story.author?.penName || story.author?.displayName || story.author?.name || "Tác giả StoryVN"}
                      </span>
                    )}
                  </div>

                  {/* THỂ LOẠI */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {story.genres && story.genres.length > 0 ? (
                      story.genres.map((genre) => (
                        <Link
                          key={genre._id || genre.slug}
                          href={`/truyen?genre=${genre.slug}`}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
                        >
                          {genre.name}
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 italic">Chưa phân loại</span>
                    )}
                  </div>

                  {/* THỐNG KÊ (LƯỢT ĐỌC, LƯỢT THEO DÕI, ĐÁNH GIÁ, SỐ CHƯƠNG) */}
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/60">
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 font-medium">Lượt đọc</div>
                      <div className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5">
                        {formatNumber(story.stats?.viewCount)}
                      </div>
                    </div>
                    <div className="text-center border-l border-zinc-200/60">
                      <div className="text-xs text-zinc-500 font-medium">Theo dõi</div>
                      <div className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5">
                        {formatNumber(story.stats?.followCount)}
                      </div>
                    </div>
                    <div className="text-center border-l border-zinc-200/60">
                      <div className="text-xs text-zinc-500 font-medium">Đánh giá</div>
                      <div className="text-base sm:text-lg font-bold text-amber-600 mt-0.5 flex items-center justify-center gap-1">
                        <span>★</span>
                        <span>{story.stats?.ratingAverage ? story.stats.ratingAverage.toFixed(1) : "5.0"}</span>
                      </div>
                    </div>
                    <div className="text-center border-l border-zinc-200/60">
                      <div className="text-xs text-zinc-500 font-medium">Số chương</div>
                      <div className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5">
                        {story.stats?.chapterCount || 0}
                      </div>
                    </div>
                  </div>

                  {/* THÔNG TIN META KHÁC (NGÀY ĐĂNG, CẬP NHẬT) */}
                  <div className="mt-5 text-xs text-zinc-500 space-y-1.5 border-t border-zinc-100 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-zinc-400">Ngày đăng:</span>
                      <span className="text-zinc-700 font-medium">{formatDate(story.publishedAt || story.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-zinc-400">Cập nhật:</span>
                      <span className="text-zinc-700 font-medium">{formatRelativeTime(story.updatedAt)}</span>
                    </div>
                  </div>

                  {/* NÚT THAO TÁC CƠ BẢN */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleFunctionPlaceholder("Đọc từ đầu")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm shadow-emerald-700/20 active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Đọc từ đầu
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFunctionPlaceholder("Theo dõi truyện")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border border-zinc-200/80 transition-colors active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Theo dõi
                    </button>

                    {/* NÚT CHIA SẺ TRUYỆN */}
                    <button
                      type="button"
                      onClick={handleShare}
                      title="Chia sẻ truyện đến bạn bè, Zalo, Facebook, Telegram..."
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border border-zinc-200/80 transition-colors active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>Chia sẻ</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* TABS NỘI DUNG CHI TIẾT */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
              {/* Header các tab */}
              <div className="flex border-b border-zinc-200/80 px-6 sm:px-8 bg-zinc-50/50">
                <button
                  type="button"
                  onClick={() => setActiveTab("about")}
                  className={`py-4 px-2 sm:px-4 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === "about"
                      ? "border-emerald-700 text-emerald-800"
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Giới thiệu truyện
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("chapters")}
                  className={`py-4 px-2 sm:px-4 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === "chapters"
                      ? "border-emerald-700 text-emerald-800"
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Danh sách chương ({story.stats?.chapterCount || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("author")}
                  className={`py-4 px-2 sm:px-4 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === "author"
                      ? "border-emerald-700 text-emerald-800"
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Tác giả
                </button>
              </div>

              {/* Nội dung từng tab */}
              <div className="p-6 sm:p-8">
                {/* TAB 1: GIỚI THIỆU TRUYỆN */}
                {activeTab === "about" && (
                  <div className="space-y-6">
                    {/* Tóm tắt truyện */}
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 mb-3">Tóm tắt nội dung</h3>
                      {story.description ? (
                        <div className="text-sm sm:text-base text-zinc-700 leading-relaxed whitespace-pre-line font-serif sm:font-sans">
                          {story.description}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400 italic">Tác giả chưa cập nhật phần giới thiệu cho truyện này.</p>
                      )}
                    </div>

                    {/* Lời nhắn tác giả (nếu có) */}
                    {story.authorNote && (
                      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-900">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Lời nhắn của tác giả
                        </div>
                        <p className="text-sm italic">{story.authorNote}</p>
                      </div>
                    )}

                    {/* Từ khóa / Tags (nếu có) */}
                    {story.tags && story.tags.length > 0 && (
                      <div className="pt-4 border-t border-zinc-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                          Từ khóa liên quan
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {story.tags.map((tag) => (
                            <span
                              key={tag._id || tag.slug}
                              className="px-2.5 py-1 rounded-md text-xs bg-zinc-100 text-zinc-600 border border-zinc-200/60"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: DANH SÁCH CHƯƠNG */}
                {activeTab === "chapters" && (
                  <div className="py-8 text-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 mb-1">Chưa có chương nào được xuất bản</h3>
                    <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                      Tác phẩm đang trong quá trình sáng tác và cập nhật nội dung. Hãy bấm &quot;Theo dõi&quot; để nhận thông báo sớm nhất!
                    </p>
                  </div>
                )}

                {/* TAB 3: THÔNG TIN TÁC GIẢ */}
                {activeTab === "author" && (
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 bg-emerald-100 border-2 border-white shadow-sm flex items-center justify-center text-emerald-800 text-2xl font-bold">
                      {story.author?.avatar ? (
                        <Image
                          src={story.author.avatar}
                          alt={story.author.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <span>{(story.author?.name || "T")[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-lg font-bold text-zinc-900">
                        {story.author?.name || story.author?.penName || "Tác giả StoryVN"}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {story.author?.storyCount ? `${story.author.storyCount} tác phẩm đã đăng` : "Tác giả StoryVN"}
                      </p>
                      <p className="text-sm text-zinc-600 mt-2 line-clamp-3">
                        {story.author?.bio || "Chào mừng bạn đến với trang tác phẩm của tôi trên StoryVN."}
                      </p>
                      {story.author?.username && (
                        <div className="mt-4">
                          <Link
                            href={`/tac-gia/${story.author.username}`}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 transition-colors shadow-2xs"
                          >
                            <span>Xem trang tác giả</span>
                            <span>→</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════════════
              CỘT PHẢI (4 COLS): DANH SÁCH TRUYỆN CÓ CÙNG THỂ LOẠI
          ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* WIDGET TRUYỆN CÙNG THỂ LOẠI */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs sticky top-24">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                      Cùng thể loại
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Gợi ý tác phẩm tương tự
                    </p>
                  </div>
                </div>
              </div>

              {/* Danh sách gợi ý */}
              {sameGenreStories.length > 0 ? (
                <div className="space-y-3.5">
                  {sameGenreStories.map((item) => (
                    <Link
                      key={item._id || item.slug}
                      href={`/truyen/${item.slug}`}
                      className="group flex gap-3 p-2 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/60 transition-all duration-200"
                    >
                      <div className="relative w-14 h-19 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/80 shrink-0">
                        {item.coverUrl ? (
                          <Image
                            src={item.coverUrl}
                            alt={item.title}
                            fill
                            unoptimized
                            sizes="56px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">
                            Trống
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-sm font-bold text-zinc-800 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1 truncate">
                          {item.author?.name || item.author?.username || "Tác giả"}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                          <span>{formatNumber(item.stats?.viewCount)} lượt đọc</span>
                          <span>•</span>
                          <span className="text-amber-600 font-medium">★ {item.stats?.ratingAverage ? item.stats.ratingAverage.toFixed(1) : "5.0"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Chưa có thêm truyện khác cùng thể loại này.
                  </p>
                </div>
              )}

              {/* KHÁM PHÁ THÊM THỂ LOẠI KHÁC */}
              <div className="mt-6 pt-5 border-t border-zinc-100">
                <div className="text-xs font-bold text-zinc-800 mb-2.5">
                  Khám phá thêm thể loại
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {story.genres?.map((g) => (
                    <Link
                      key={g._id || g.slug}
                      href={`/truyen?genre=${g.slug}`}
                      className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-800 transition-colors"
                    >
                      {g.name}
                    </Link>
                  ))}
                  <Link
                    href="/truyen"
                    className="px-2.5 py-1 rounded-lg text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition-colors"
                  >
                    Tất cả truyện →
                  </Link>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
