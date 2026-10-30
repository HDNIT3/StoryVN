"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { storyService, storyKeys } from "@/features/stories";
import { HeroStoryBanner } from "./HeroStoryBanner";
import { HomeTopViewsSection } from "./HomeTopViewsSection";
import { HomeNewestStoriesSection } from "./HomeNewestStoriesSection";
import { HomeLatestChaptersSection } from "./HomeLatestChaptersSection";
import { HomeFeaturedAuthorsSection } from "./HomeFeaturedAuthorsSection";
import { HomeSideNav } from "./HomeSideNav";

export function HomeView() {
  const { data: topStories = [], isLoading: isLoadingTopViews } = useQuery({
    queryKey: storyKeys.topViews(10),
    queryFn: async () => {
      const res = await storyService.getTopViews(10);
      return res.data || [];
    },
  });

  const { data: latestUpdatedData, isLoading: isLoadingLatest } = useQuery({
    queryKey: storyKeys.latestUpdated({ limit: 12 }),
    queryFn: async () => {
      const res = await storyService.getLatestUpdated({ limit: 12 });
      return res.data;
    },
  });

  const { data: newestStories = [], isLoading: isLoadingNewest } = useQuery({
    queryKey: storyKeys.filtered({ sortBy: "published", limit: 10 }),
    queryFn: async () => {
      const res = await storyService.getStories({ sortBy: "published", limit: 10 });
      return res.data?.items || [];
    },
  });

  const latestStories = latestUpdatedData?.items || [];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white">
      {/* Thanh điều hướng nhanh theo section nổi bên phải */}
      <HomeSideNav />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-10 px-4 pt-2 pb-12 sm:space-y-14 sm:px-6 sm:pt-4 sm:pb-16 lg:px-8">
        {/* HERO — Truyện mới nhất nổi bật */}
        <section id="noi-bat" aria-label="Tiêu điểm nổi bật" className="scroll-mt-28">
          <HeroStoryBanner />
        </section>

        {/* BẢNG XẾP HẠNG — Top truyện nhiều lượt xem */}
        <HomeTopViewsSection
          topStories={topStories}
          isLoading={isLoadingTopViews}
        />

        {/* TÁC GIẢ NỔI BẬT — Avatar tròn + Tên + Tổng lượt đọc */}
        <HomeFeaturedAuthorsSection />

        {/* TRUYỆN MỚI NHẤT — 10 truyện vừa xuất bản, 5 truyện mỗi hàng */}
        <HomeNewestStoriesSection
          stories={newestStories}
          isLoading={isLoadingNewest}
        />

        {/* MỚI CẬP NHẬT — Modern clean list */}
        <HomeLatestChaptersSection
          stories={latestStories}
          isLoading={isLoadingLatest}
        />
      </div>
    </div>
  );
}
