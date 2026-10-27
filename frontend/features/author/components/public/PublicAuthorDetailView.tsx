"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authorService, authorKeys, AuthorStoryItem } from "@/features/author";
import { useAuth } from "@/lib/context/AuthContext";
import { useFollowStatus, useToggleFollow } from "@/features/follows";
import { toast } from "@/lib/toast";
import { AuthorProfileHeader } from "./AuthorProfileHeader";
import { AuthorStoriesTab } from "./AuthorStoriesTab";
import { AuthorAboutTab } from "./AuthorAboutTab";
import { AuthorDonateModal } from "./AuthorDonateModal";

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

interface PublicAuthorDetailViewProps {
  username: string;
}

export function PublicAuthorDetailView({ username }: PublicAuthorDetailViewProps) {
  const [activeNavTab, setActiveNavTab] = useState<"stories" | "about" | "donate">("stories");

  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [progressTab, setProgressTab] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "views" | "rating" | "chapters">("latest");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const [showDonateModal, setShowDonateModal] = useState<boolean>(false);
  const [isCopiedBank, setIsCopiedBank] = useState<boolean>(false);

  const {
    data: authorData,
    isLoading: isLoadingAuthor,
    isError: isErrorAuthor,
  } = useQuery({
    queryKey: authorKeys.profile(username),
    queryFn: () => authorService.getPublicProfile(username),
    enabled: !!username,
  });

  const author = authorData?.data?.author;

  const {
    data: storiesData,
    isLoading: isLoadingStories,
  } = useQuery({
    queryKey: authorKeys.stories(username, {
      progressState: progressTab !== "ALL" ? progressTab : undefined,
      sortBy,
      page: currentPage,
      search: debouncedSearch || undefined,
    }),
    queryFn: () =>
      authorService.getPublicStories(username, {
        progressState: progressTab !== "ALL" ? progressTab : undefined,
        sortBy,
        page: currentPage,
        limit: 10,
        search: debouncedSearch || undefined,
      }),
    enabled: !!username,
  });

  const stories = storiesData?.data?.items || [];
  const pagination = storiesData?.data?.pagination;

  const router = useRouter();
  const { isAuthenticated, user: currentUser } = useAuth();

  const authorUserId = author?._id;

  const { data: followStatus, isLoading: isLoadingFollowStatus } = useFollowStatus(
    "AUTHOR",
    authorUserId || "",
    Boolean(isAuthenticated && authorUserId)
  );
  const isFollowing = followStatus?.isFollowing ?? false;

  const { mutate: toggleFollow, isPending: isPendingFollow } = useToggleFollow();

  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để theo dõi tác giả!");
      router.push(`/dang-nhap?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!authorUserId) return;
    if (authorUserId === currentUser?._id) {
      toast.warning("Bạn không thể tự theo dõi chính mình!");
      return;
    }
    toggleFollow({
      targetType: "AUTHOR",
      targetId: authorUserId,
    });
  };

  const handleShareClick = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết hồ sơ tác giả vào bộ nhớ tạm!");
    }
  };

  const handleCopyBankAccount = (accNumber: string) => {
    if (typeof window !== "undefined" && accNumber) {
      navigator.clipboard.writeText(accNumber);
      setIsCopiedBank(true);
      toast.success("Đã sao chép số tài khoản!");
      setTimeout(() => setIsCopiedBank(false), 2000);
    }
  };

  const vietQrUrl = useMemo(() => {
    if (!author?.donateInfo?.bankName || !author?.donateInfo?.bankAccountNumber) {
      return null;
    }
    const bank = encodeURIComponent(author.donateInfo.bankName.trim());
    const acc = encodeURIComponent(author.donateInfo.bankAccountNumber.trim());
    const memo = encodeURIComponent(`Ung ho tac gia ${author.penName}`);
    return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=0&addInfo=${memo}`;
  }, [author]);

  const totalChaptersCount = useMemo(() => {
    if (!stories || stories.length === 0) return 0;
    return stories.reduce((sum: number, s: AuthorStoryItem) => sum + (s.stats?.chapterCount || 0), 0);
  }, [stories]);

  if (isLoadingAuthor) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 animate-pulse">
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
        </div>
      </div>
    );
  }

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
            Hồ sơ tác giả &quot;{username}&quot; không tồn tại hoặc đã ngừng hoạt động trên StoryVN.
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

  const effectiveFollowerCount = author.followerCount || 0;
  const hasDonateInfo = Boolean(author.donateInfo?.bankName && author.donateInfo?.bankAccountNumber);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 pb-16 pt-4 sm:pt-8 transition-colors">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 space-y-6">
        {/* Profile Card Header */}
        <AuthorProfileHeader
          author={author}
          isFollowedDemo={isFollowing}
          onFollowToggle={handleFollowToggle}
          onShareClick={handleShareClick}
          onOpenDonate={() => setShowDonateModal(true)}
          hasDonateInfo={hasDonateInfo}
          totalChaptersCount={totalChaptersCount}
          formatNumber={formatNumber}
          formatJoinedDate={formatJoinedDate}
          effectiveFollowerCount={effectiveFollowerCount}
        />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-[#EDE7DF] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveNavTab("stories")}
            className={`px-4 sm:px-5 py-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeNavTab === "stories" ? "text-[#8B1E2D]" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <span>Tác phẩm sáng tác</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeNavTab === "stories" ? "bg-[#8B1E2D] text-white" : "bg-stone-200/80 text-stone-700"
              }`}
            >
              {author.counts?.all ?? author.storyCount ?? stories.length}
            </span>
            {activeNavTab === "stories" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B1E2D]" />
            )}
          </button>

          {author.biography && (
            <button
              type="button"
              onClick={() => setActiveNavTab("about")}
              className={`px-4 sm:px-5 py-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeNavTab === "about" ? "text-[#8B1E2D]" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              <span>Giới thiệu tác giả</span>
              {activeNavTab === "about" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B1E2D]" />
              )}
            </button>
          )}

          {hasDonateInfo && (
            <button
              type="button"
              onClick={() => setActiveNavTab("donate")}
              className={`px-4 sm:px-5 py-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeNavTab === "donate" ? "text-[#8B1E2D]" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              <span>Ủng hộ tác giả</span>
              {activeNavTab === "donate" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B1E2D]" />
              )}
            </button>
          )}
        </div>

        {/* Tab contents */}
        {activeNavTab === "stories" && (
          <AuthorStoriesTab
            author={author}
            stories={stories}
            isLoading={isLoadingStories}
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
            debouncedSearch={debouncedSearch}
            progressTab={progressTab}
            onProgressTabChange={setProgressTab}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            formatNumber={formatNumber}
          />
        )}

        {activeNavTab === "about" && <AuthorAboutTab author={author} />}

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
                  <img src={vietQrUrl} alt="Mã QR ủng hộ tác giả" className="w-full h-full object-contain" />
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

      {/* Donate Modal */}
      <AuthorDonateModal
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
        author={author}
        vietQrUrl={vietQrUrl}
        onCopyBankAccount={handleCopyBankAccount}
        isCopiedBank={isCopiedBank}
      />
    </div>
  );
}
