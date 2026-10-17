"use client";

import React, { useState, useMemo, useEffect } from "react";
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

  // Tab điều hướng nội dung: "stories" | "about" | "donate"
  const [activeNavTab, setActiveNavTab] = useState<"stories" | "about" | "donate">("stories");

  // Bộ lọc danh sách tác phẩm
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [progressTab, setProgressTab] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "views" | "rating" | "chapters">("latest");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Trạng thái modal Donate / Ủng hộ
  const [showDonateModal, setShowDonateModal] = useState<boolean>(false);
  const [isCopiedBank, setIsCopiedBank] = useState<boolean>(false);

  // Trạng thái nút Theo dõi hiển thị trên giao diện
  const [isFollowedDemo, setIsFollowedDemo] = useState<boolean>(false);

  // 1. Query thông tin hồ sơ tác giả
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
      search: debouncedSearch || undefined,
    }),
    queryFn: () =>
      authorService.getPublicStories(usernameParam, {
        progressState: progressTab !== "ALL" ? progressTab : undefined,
        sortBy,
        page: currentPage,
        limit: 10,
        search: debouncedSearch || undefined,
      }),
    enabled: !!usernameParam,
  });

  const stories = storiesData?.data?.items || [];
  const pagination = storiesData?.data?.pagination;

  // Xử lý nút Theo dõi
  const handleFollowToggle = () => {
    const nextState = !isFollowedDemo;
    setIsFollowedDemo(nextState);
    if (nextState) {
      toast.success(`Đã theo dõi tác giả ${author?.penName || ""}! Bạn sẽ nhận được thông báo khi có chương mới.`);
    } else {
      toast.info("Đã bỏ theo dõi tác giả.");
    }
  };

  // Xử lý nút Chia sẻ
  const handleShareClick = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết hồ sơ tác giả vào bộ nhớ tạm!");
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

  // Tính tổng số chương từ các tác phẩm có sẵn
  const totalChaptersCount = useMemo(() => {
    if (!stories || stories.length === 0) return 0;
    return stories.reduce((sum, s) => sum + (s.stats?.chapterCount || 0), 0);
  }, [stories]);

  // Loading Skeleton State (Tông màu kem & trắng nhẹ)
  if (isLoadingAuthor) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 animate-pulse">
          {/* Card Thông tin tác giả Skeleton */}
          <div className="bg-white rounded-2xl border border-[#EDE7DF] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xs">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#EFE9DF] shrink-0" />
            <div className="flex-1 space-y-3.5 w-full text-center sm:text-left">
              <div className="h-5 w-28 bg-[#EFE9DF] rounded-full mx-auto sm:mx-0" />
              <div className="h-8 w-56 bg-[#E8E1D5] rounded-xl mx-auto sm:mx-0" />
              <div className="h-4 w-full max-w-xl bg-[#EFE9DF] rounded-lg mx-auto sm:mx-0" />
              <div className="h-4 w-3/4 max-w-md bg-[#EFE9DF] rounded-lg mx-auto sm:mx-0" />
              <div className="flex justify-center sm:justify-start gap-3 pt-2">
                <div className="h-10 w-28 bg-[#E8E1D5] rounded-xl" />
                <div className="h-10 w-28 bg-[#EFE9DF] rounded-xl" />
              </div>
            </div>
          </div>

          {/* Catalog Skeleton */}
          <div className="bg-white rounded-2xl border border-[#EDE7DF] p-6 space-y-4 shadow-xs">
            <div className="h-6 w-40 bg-[#E8E1D5] rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 rounded-xl bg-[#F6F1EA]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State (Tông màu kem & đỏ đô)
  if (isErrorAuthor || !author) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#EDE7DF] p-8 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FDF2F4] text-[#8B1E2D] flex items-center justify-center text-3xl border border-[#8B1E2D]/15">
            📜
          </div>
          <h1 className="text-xl font-bold text-stone-900 font-serif">
            Không tìm thấy tác giả
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            Hồ sơ tác giả &quot;{usernameParam}&quot; không tồn tại hoặc đã ngừng hoạt động trên StoryVN.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/truyen"
              className="px-5 py-2.5 rounded-xl font-medium text-sm bg-[#8B1E2D] hover:bg-[#721422] text-white transition-colors shadow-xs"
            >
              Khám phá tác phẩm
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl font-medium text-sm bg-[#FAF7F2] hover:bg-[#F2ECE2] text-stone-700 border border-[#EDE7DF] transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const effectiveFollowerCount =
    (author.followerCount || 0) + (isFollowedDemo ? 1 : 0);

  const hasDonateInfo = Boolean(
    author.donateInfo?.bankName && author.donateInfo?.bankAccountNumber
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 pb-16 pt-4 sm:pt-8 transition-colors">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 space-y-6">

        {/* ═══════════════════════════════════════════════════════════
            1. KHU VỰC THÔNG TIN TÁC GIẢ (AUTHOR PROFILE CARD)
            Card lớn gồm avatar tròn bên trái; bên phải là nhãn, tên,
            mô tả/tiểu sử, nút theo dõi/chia sẻ và thẻ thống kê.
        ═════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-[#EDE7DF] p-5 sm:p-7 md:p-8 shadow-xs relative overflow-hidden">
          {/* Dải trang trí ngầm màu đỏ đô nhạt ở góc trên */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#8B1E2D]/5 via-transparent to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8 relative z-10">
            {/* Avatar Tròn Bên Trái */}
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

            {/* Khối Nội Dung Bên Phải */}
            <div className="flex-1 w-full text-center md:text-left space-y-3.5">
              {/* Nhãn tác giả + Username + Ngày tham gia */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8B1E2D]/10 text-[#8B1E2D] border border-[#8B1E2D]/20">
                  <svg className="w-3.5 h-3.5 text-[#8B1E2D]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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

              {/* Tên nổi bật */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight font-serif">
                {author.penName}
              </h1>

              {/* Mô tả / Tiểu sử (Ẩn hoàn toàn nếu không có dữ liệu) */}
              {author.biography && (
                <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-3xl">
                  {author.biography}
                </p>
              )}

              {/* Website cá nhân & Mạng xã hội (Ẩn hoàn toàn nếu không có dữ liệu) */}
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

              {/* Hàng Nút Hành Động: Theo dõi, Chia sẻ, Ủng hộ */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                {/* Nút Theo dõi */}
                <button
                  type="button"
                  onClick={handleFollowToggle}
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

                {/* Nút Chia sẻ */}
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FAF7F2] hover:bg-[#F2ECE2] text-stone-700 border border-[#EDE7DF] transition-colors cursor-pointer"
                  title="Sao chép liên kết trang tác giả"
                >
                  <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Chia sẻ</span>
                </button>

                {/* Nút Ủng hộ (Chỉ hiển thị nếu có số tài khoản) */}
                {hasDonateInfo && (
                  <button
                    type="button"
                    onClick={() => setShowDonateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-50/80 hover:bg-amber-100/90 text-amber-900 border border-amber-200/80 transition-colors cursor-pointer"
                  >
                    <span>☕</span>
                    <span>Ủng hộ tác giả</span>
                  </button>
                )}
              </div>

              {/* Thẻ Thống Kê (Số tác phẩm, Lượt đọc, Số chương nếu có, Người theo dõi) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-3">
                {/* 1. Tác phẩm */}
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF] text-center sm:text-left">
                  <span className="text-[11px] font-medium text-stone-500 block uppercase tracking-wider">
                    Tác phẩm
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5 block">
                    {author.storyCount || 0}
                  </span>
                </div>

                {/* 2. Lượt đọc */}
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF] text-center sm:text-left">
                  <span className="text-[11px] font-medium text-stone-500 block uppercase tracking-wider">
                    Lượt đọc
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-[#8B1E2D] mt-0.5 block">
                    {formatNumber(author.totalViews || 0)}
                  </span>
                </div>

                {/* 3. Số chương (Hiển thị nếu tính được > 0) */}
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

                {/* 4. Người theo dõi */}
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

        {/* ═══════════════════════════════════════════════════════════
            2. THANH ĐIỀU HƯỚNG NỘI DUNG (NAVIGATION TABS)
            Các tab ngang chuyển giữa Tác phẩm và mục liên quan hiện có.
        ═════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-1 border-b border-[#EDE7DF] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveNavTab("stories")}
            className={`px-4 sm:px-5 py-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeNavTab === "stories"
                ? "text-[#8B1E2D]"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <span>Tác phẩm sáng tác</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeNavTab === "stories"
                  ? "bg-[#8B1E2D] text-white"
                  : "bg-stone-200/80 text-stone-700"
              }`}
            >
              {author.counts?.all ?? author.storyCount ?? stories.length}
            </span>
            {activeNavTab === "stories" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B1E2D]" />
            )}
          </button>

          {/* Tab Giới thiệu (Chỉ hiện khi có tiểu sử) */}
          {author.biography && (
            <button
              type="button"
              onClick={() => setActiveNavTab("about")}
              className={`px-4 sm:px-5 py-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeNavTab === "about"
                  ? "text-[#8B1E2D]"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              <span>Giới thiệu tác giả</span>
              {activeNavTab === "about" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B1E2D]" />
              )}
            </button>
          )}

          {/* Tab Ủng hộ (Chỉ hiện khi có thông tin ngân hàng) */}
          {hasDonateInfo && (
            <button
              type="button"
              onClick={() => setActiveNavTab("donate")}
              className={`px-4 sm:px-5 py-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeNavTab === "donate"
                  ? "text-[#8B1E2D]"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              <span>Ủng hộ tác giả</span>
              {activeNavTab === "donate" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B1E2D]" />
              )}
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            3. KHUNG NỘI DUNG CHÍNH (CONTENT AREA)
        ═════════════════════════════════════════════════════════════ */}

        {/* TAB 1: DANH SÁCH TÁC PHẨM */}
        {activeNavTab === "stories" && (
          <div className="bg-white rounded-2xl border border-[#EDE7DF] p-5 sm:p-7 shadow-xs space-y-6">
            {/* Hàng Tiêu Đề + Tìm Kiếm + Bộ Lọc + Sắp Xếp */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#EDE7DF]">
              {/* Ô Tìm Kiếm Tác Phẩm */}
              <div className="relative w-full lg:w-72">
                <svg
                  className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm tác phẩm của tác giả..."
                  className="w-full pl-10 pr-8 py-2 text-sm bg-[#FAF7F2] text-stone-800 placeholder:text-stone-400 rounded-xl border border-[#EDE7DF] focus:border-[#8B1E2D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E2D]/10 transition-all"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
                    aria-label="Xóa tìm kiếm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Bộ lọc trạng thái & Dropdown sắp xếp */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
                {/* Bộ lọc trạng thái */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => {
                      setProgressTab("ALL");
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      progressTab === "ALL"
                        ? "bg-[#8B1E2D] text-white"
                        : "bg-[#FAF7F2] text-stone-600 hover:bg-[#F2ECE2] border border-[#EDE7DF]"
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      progressTab === "ONGOING"
                        ? "bg-emerald-800 text-white"
                        : "bg-[#FAF7F2] text-stone-600 hover:bg-[#F2ECE2] border border-[#EDE7DF]"
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      progressTab === "COMPLETED"
                        ? "bg-stone-800 text-white"
                        : "bg-[#FAF7F2] text-stone-600 hover:bg-[#F2ECE2] border border-[#EDE7DF]"
                    }`}
                  >
                    Hoàn thành ({author.counts?.completed ?? 0})
                  </button>
                </div>

                {/* Dropdown Sắp Xếp */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <label htmlFor="sort-select" className="text-xs text-stone-500 font-medium whitespace-nowrap hidden sm:inline">
                    Sắp xếp:
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FAF7F2] text-stone-800 border border-[#EDE7DF] focus:outline-none focus:ring-2 focus:ring-[#8B1E2D]/20 cursor-pointer shadow-2xs"
                  >
                    <option value="latest">Mới cập nhật</option>
                    <option value="views">Lượt xem nhiều</option>
                    <option value="rating">Đánh giá cao</option>
                    <option value="chapters">Số chương nhiều</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lưới Hiển Thị Tác Phẩm: 2 CỘT TRÊN DESKTOP, 1 CỘT TRÊN MOBILE */}
            {isLoadingStories ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-44 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF] animate-pulse" />
                ))}
              </div>
            ) : stories.length === 0 ? (
              /* Trạng Thái Trống */
              <div className="py-14 px-4 text-center rounded-2xl bg-[#FAF7F2] border border-dashed border-[#EDE7DF]">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white text-[#8B1E2D] flex items-center justify-center text-2xl shadow-2xs border border-[#EDE7DF]">
                  📚
                </div>
                <h3 className="text-base font-bold text-stone-800 font-serif">
                  Không tìm thấy tác phẩm phù hợp
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
                  {debouncedSearch
                    ? `Không có tác phẩm nào khớp với từ khóa "${debouncedSearch}". Thử tìm kiếm với từ khóa khác.`
                    : progressTab !== "ALL"
                    ? "Tác giả hiện chưa có tác phẩm nào trong trạng thái này."
                    : "Tác giả hiện chưa xuất bản tác phẩm công khai nào."}
                </p>
                {(debouncedSearch || progressTab !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchKeyword("");
                      setProgressTab("ALL");
                      setCurrentPage(1);
                    }}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#8B1E2D] text-white hover:bg-[#721422] transition-colors cursor-pointer"
                  >
                    Xem tất cả tác phẩm
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {stories.map((story: AuthorStoryItem) => (
                  <article
                    key={story._id}
                    className="group flex gap-4 p-3.5 sm:p-4 rounded-xl bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] border border-[#EDE7DF] hover:border-[#8B1E2D]/30 shadow-2xs hover:shadow-xs transition-all duration-200"
                  >
                    {/* Bìa truyện (Tỷ lệ 3:4) */}
                    <Link
                      href={`/truyen/${story.slug}`}
                      className="relative w-24 sm:w-28 md:w-32 aspect-[3/4] shrink-0 rounded-xl overflow-hidden shadow-2xs border border-[#EDE7DF] bg-stone-100 block group"
                    >
                      {story.coverUrl ? (
                        <Image
                          src={story.coverUrl}
                          alt={story.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 96px, 128px"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-[#EAE3D9] to-[#DED4C7]">
                          <span className="text-2xl mb-1">📖</span>
                          <span className="text-[10px] font-semibold text-stone-700 line-clamp-2">
                            {story.title}
                          </span>
                        </div>
                      )}

                      {/* Badge trạng thái trên ảnh bìa */}
                      <div className="absolute top-1.5 left-1.5">
                        {story.progressState === "COMPLETED" ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-900/85 text-white backdrop-blur-xs">
                            Hoàn thành
                          </span>
                        ) : story.progressState === "ON_HOLD" ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-800/85 text-white backdrop-blur-xs">
                            Tạm ngưng
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8B1E2D]/90 text-white backdrop-blur-xs">
                            Đang ra
                          </span>
                        )}
                      </div>

                      {/* Số chương hiển thị góc dưới bìa */}
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/70 text-white backdrop-blur-xs">
                        {story.stats?.chapterCount || 0} ch
                      </div>
                    </Link>

                    {/* Khối Thông Tin Truyện */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        {/* Thể loại tags */}
                        {story.genres && story.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {story.genres.slice(0, 2).map((g) => (
                              <span
                                key={g._id}
                                className="text-[11px] font-medium text-[#8B1E2D] bg-white border border-[#8B1E2D]/15 px-2 py-0.5 rounded-md"
                              >
                                {g.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Tên truyện */}
                        <h3 className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#8B1E2D] transition-colors line-clamp-1 font-serif">
                          <Link href={`/truyen/${story.slug}`}>{story.title}</Link>
                        </h3>

                        {/* Mô tả ngắn */}
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {story.description || "Tác phẩm chưa có tóm tắt nội dung giới thiệu."}
                        </p>
                      </div>

                      {/* Thông số & Nút Đọc truyện */}
                      <div className="pt-2.5 mt-2 border-t border-[#EDE7DF]/80 flex items-center justify-between gap-2">
                        {/* Thống kê: Lượt đọc, Đánh giá, Số chương */}
                        <div className="flex items-center gap-2.5 text-xs text-stone-500">
                          <span className="inline-flex items-center gap-1" title="Lượt đọc">
                            <span>👁️</span>
                            <span className="font-medium text-stone-700">{formatNumber(story.stats?.viewCount || 0)}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-amber-600" title="Điểm đánh giá">
                            <span>⭐</span>
                            <span className="font-medium">{story.stats?.ratingAverage > 0 ? story.stats.ratingAverage.toFixed(1) : "5.0"}</span>
                          </span>
                        </div>

                        {/* Nút Xem chi tiết / Đọc truyện */}
                        <Link
                          href={`/truyen/${story.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-[#8B1E2D] hover:bg-[#721422] text-white transition-colors shadow-2xs shrink-0"
                        >
                          <span>Đọc truyện</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Phân Trang (Pagination) */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pt-4 flex items-center justify-center gap-1.5 border-t border-[#EDE7DF]">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FAF7F2] text-stone-700 border border-[#EDE7DF] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F2ECE2] transition-colors"
                >
                  Trước
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      pageNum === currentPage
                        ? "bg-[#8B1E2D] text-white shadow-2xs"
                        : "bg-[#FAF7F2] text-stone-700 border border-[#EDE7DF] hover:bg-[#F2ECE2]"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FAF7F2] text-stone-700 border border-[#EDE7DF] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F2ECE2] transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GIỚI THIỆU TÁC GIẢ */}
        {activeNavTab === "about" && (
          <div className="bg-white rounded-2xl border border-[#EDE7DF] p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-serif border-b border-[#EDE7DF] pb-3">
                Tiểu sử & Phong cách sáng tác
              </h2>
              <p className="mt-4 text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-line">
                {author.biography || "Tác giả chưa cập nhật tiểu sử."}
              </p>
            </div>

            {author.website && (
              <div className="pt-4 border-t border-[#EDE7DF]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Trang cá nhân / Website
                </h3>
                <a
                  href={author.website.startsWith("http") ? author.website : `https://${author.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#8B1E2D] hover:underline"
                >
                  {author.website}
                </a>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ỦNG HỘ TÁC GIẢ (DONATE) */}
        {activeNavTab === "donate" && hasDonateInfo && (
          <div className="bg-white rounded-2xl border border-[#EDE7DF] p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-3xl border border-amber-200">
              ☕
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-serif">
                Ủng Hộ Tác Giả {author.penName}
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                Gửi một cốc cà phê tiếp thêm động lực để tác giả tiếp tục sáng tác và ra chương đều đặn.
              </p>
            </div>

            {vietQrUrl && (
              <div className="flex flex-col items-center p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE7DF]">
                <div className="w-52 h-52 rounded-xl overflow-hidden bg-white p-2 shadow-2xs border border-[#EDE7DF]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vietQrUrl}
                    alt="Mã QR ủng hộ tác giả"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs text-stone-500 mt-3">
                  Quét mã QR bằng ứng dụng ngân hàng bất kỳ để ủng hộ
                </span>
              </div>
            )}

            <div className="space-y-2 text-sm text-left bg-[#FAF7F2] p-4 rounded-xl border border-[#EDE7DF]">
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Ngân hàng:</span>
                <span className="font-semibold text-stone-900">{author.donateInfo?.bankName}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#EDE7DF]">
                <span className="text-stone-500">Chủ tài khoản:</span>
                <span className="font-semibold text-stone-900 uppercase">
                  {author.donateInfo?.bankAccountName || author.penName}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-[#EDE7DF]">
                <span className="text-stone-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#8B1E2D]">
                    {author.donateInfo?.bankAccountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyBankAccount(author.donateInfo?.bankAccountNumber || "")}
                    className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white text-stone-800 border border-[#EDE7DF] hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    {isCopiedBank ? "Đã chép!" : "Sao chép"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          4. MODAL ỦNG HỘ TÁC GIẢ (DONATE POPUP VIETQR)
      ═════════════════════════════════════════════════════════════ */}
      {showDonateModal && hasDonateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#EDE7DF] shadow-2xl p-6 sm:p-7 overflow-hidden text-center">
            {/* Nút Đóng Modal */}
            <button
              type="button"
              onClick={() => setShowDonateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header Modal */}
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl border border-amber-200">
              ☕
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
              Ủng Hộ Tác Giả {author.penName}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Tiếp thêm một cốc cà phê động viên tác giả sáng tác chương mới
            </p>

            {/* Ảnh VietQR tạo tự động */}
            {vietQrUrl && (
              <div className="mt-4 flex flex-col items-center p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF]">
                <div className="w-48 h-48 rounded-xl overflow-hidden bg-white p-1.5 border border-[#EDE7DF]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vietQrUrl}
                    alt="Mã VietQR ủng hộ tác giả"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-2">
                  Quét mã QR bằng ứng dụng ngân hàng để ủng hộ nhanh
                </span>
              </div>
            )}

            {/* Thông tin số tài khoản */}
            <div className="mt-4 space-y-2 text-xs sm:text-sm text-left bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE7DF]">
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500">Ngân hàng:</span>
                <span className="font-semibold text-stone-900">{author.donateInfo?.bankName}</span>
              </div>
              <div className="flex justify-between py-0.5 border-t border-[#EDE7DF]">
                <span className="text-stone-500">Chủ tài khoản:</span>
                <span className="font-semibold text-stone-900 uppercase">
                  {author.donateInfo?.bankAccountName || author.penName}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-t border-[#EDE7DF]">
                <span className="text-stone-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#8B1E2D]">
                    {author.donateInfo?.bankAccountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyBankAccount(author.donateInfo?.bankAccountNumber || "")}
                    className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white text-stone-800 border border-[#EDE7DF] hover:bg-stone-50 cursor-pointer"
                  >
                    {isCopiedBank ? "Đã chép!" : "Sao chép"}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDonateModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold bg-[#8B1E2D] hover:bg-[#721422] text-white transition-colors cursor-pointer shadow-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
