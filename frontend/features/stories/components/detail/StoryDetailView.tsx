"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { storyService, storyKeys } from "@/features/stories";
import { chapterService, chapterKeys } from "@/features/chapters";
import { toast } from "@/lib/toast";
import type { SameGenreStoryItem } from "@/features/stories";
import { StoryDetailHeader } from "./StoryDetailHeader";
import { StoryDetailTabs } from "./StoryDetailTabs";
import { StoryChapterList } from "./StoryChapterList";
import { AuthorSidebarCard } from "./AuthorSidebarCard";
import { SameGenreStoriesWidget } from "./SameGenreStoriesWidget";

interface StoryDetailViewProps {
  slug?: string;
}

export const StoryDetailView: React.FC<StoryDetailViewProps> = ({ slug: initialSlug }) => {
  const params = useParams();
  const slugParam =
    initialSlug ||
    (Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string) || "");

  const [activeTab, setActiveTab] = useState<"about" | "chapters">("about");
  const [chapterOrder, setChapterOrder] = useState<"asc" | "desc">("asc");

  // Query thông tin chi tiết truyện
  const {
    data: storyRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: storyKeys.bySlug(slugParam),
    queryFn: () => storyService.getStoryBySlug(slugParam),
    enabled: !!slugParam,
  });

  const story = storyRes?.data;
  const sameGenreStories: SameGenreStoryItem[] = story?.sameGenreStories || [];

  // Query danh sách chương
  const {
    data: chaptersRes,
    isLoading: isLoadingChapters,
    isError: isErrorChapters,
  } = useQuery({
    queryKey: chapterKeys.bySlug(slugParam, { order: chapterOrder }),
    queryFn: () => chapterService.getChaptersBySlug(slugParam, { order: chapterOrder, limit: 200 }),
    enabled: !!slugParam,
  });

  const chapters = chaptersRes?.data?.items || [];
  const publicChapterCount =
    chaptersRes?.data?.total ?? story?.stats?.chapterCount ?? 0;

  // Chương đầu tiên
  const firstChapterQuery = { page: 1, limit: 1, order: "asc" as const };
  const { data: firstChapterRes } = useQuery({
    queryKey: chapterKeys.bySlug(slugParam, firstChapterQuery),
    queryFn: () => chapterService.getChaptersBySlug(slugParam, firstChapterQuery),
    enabled: !!slugParam,
    staleTime: 5 * 60 * 1000,
  });
  const firstChapter = firstChapterRes?.data?.items?.[0];

  // Handler chia sẻ liên kết truyện
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

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Đã sao chép liên kết truyện vào bộ nhớ tạm!");
    } catch {
      toast.error("Không thể sao chép liên kết, vui lòng copy trên thanh địa chỉ.");
    }
  };

  const handleFunctionPlaceholder = (featureName: string) => {
    toast.info(`Chức năng "${featureName}" đang được hoàn thiện trong các giai đoạn kế tiếp.`);
  };

  // Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 bg-zinc-200 rounded w-48 mb-6 animate-pulse" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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

  // Not found
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
        {/* Breadcrumb */}
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

        {/* 2-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI */}
          <div className="lg:col-span-8 space-y-6">
            <StoryDetailHeader
              story={story}
              slugParam={slugParam}
              publicChapterCount={publicChapterCount}
              firstChapter={firstChapter}
              onShare={handleShare}
              onPlaceholder={handleFunctionPlaceholder}
            />

            <StoryDetailTabs
              story={story}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              publicChapterCount={publicChapterCount}
            >
              <StoryChapterList
                chapters={chapters}
                publicChapterCount={publicChapterCount}
                chapterOrder={chapterOrder}
                onToggleOrder={() => setChapterOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                isLoading={isLoadingChapters}
                isError={isErrorChapters}
                slugParam={slugParam}
              />
            </StoryDetailTabs>
          </div>

          {/* CỘT PHẢI */}
          <div className="lg:col-span-4 space-y-6">
            <AuthorSidebarCard author={story.author} />
            <SameGenreStoriesWidget
              sameGenreStories={sameGenreStories}
              genres={story.genres}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
