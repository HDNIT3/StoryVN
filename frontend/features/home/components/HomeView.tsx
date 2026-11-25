"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  storyService,
  storyKeys,
  type PaginatedRecentStories,
  type FilteredStoryItem,
} from "@/features/stories";
import type { AuthorListItem } from "@/features/author";
import { HeroStoryBanner } from "./HeroStoryBanner";
import { HomeNewestStoriesSection } from "./HomeNewestStoriesSection";
import { HomeLatestChaptersSection } from "./HomeLatestChaptersSection";
import { HomeFeaturedAuthorsSection } from "./HomeFeaturedAuthorsSection";
import { HomeSideNav } from "./HomeSideNav";
import { HomeRecommendationsSection } from "./HomeRecommendationsSection";
import { useRecommendations } from '@/features/stories/queries/useRecommendations';
import { useAuth } from '@/lib/context/AuthContext';

export interface HomeViewInitialData {
  latestUpdatedData?: PaginatedRecentStories;
  newestStories?: FilteredStoryItem[];
  featuredAuthors?: AuthorListItem[];
}

export function HomeView({
  initialData,
}: {
  initialData?: HomeViewInitialData;
} = {}) {
  const { user } = useAuth();
  const recommendations = useRecommendations();

  const { data: latestUpdatedData, isLoading: isLoadingLatest } = useQuery({
    queryKey: storyKeys.latestUpdated({ limit: 12 }),
    queryFn: async () => {
      const res = await storyService.getLatestUpdated({ limit: 12 });
      return res.data;
    },
    initialData: initialData?.latestUpdatedData,
  });

  const { data: newestStories = [], isLoading: isLoadingNewest } = useQuery({
    queryKey: storyKeys.filtered({ sortBy: "published", limit: 10 }),
    queryFn: async () => {
      const res = await storyService.getStories({ sortBy: "published", limit: 10 });
      return res.data?.items || [];
    },
    initialData: initialData?.newestStories,
  });

  const latestStories = latestUpdatedData?.items || [];
  const hasPersonalizedStories = Boolean(recommendations.data?.personalized && recommendations.data.items.length);
  const heroStories = hasPersonalizedStories
    ? recommendations.data!.items.slice(0, 5)
    : newestStories.slice(0, 5);

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-white">
      {/* Thanh điều hướng nhanh theo section nổi bên phải */}
      <HomeSideNav />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-10 px-4 pt-2 pb-12 sm:space-y-14 sm:px-6 sm:pt-4 sm:pb-16 lg:px-8">
        {/* HERO — Truyện mới nhất nổi bật */}
        <section id="noi-bat" aria-label="Tiêu điểm nổi bật" className="scroll-mt-28">
          <HeroStoryBanner
            key={`${user?._id ?? 'guest'}-${hasPersonalizedStories ? 'personalized' : 'newest'}`}
            stories={heroStories}
            isLoading={!heroStories.length && isLoadingNewest}
            personalized={hasPersonalizedStories}
          />
        </section>

        {/* TÁC GIẢ NỔI BẬT — Avatar tròn + Tên + Tổng lượt đọc */}
        <HomeRecommendationsSection recommendations={recommendations} />
        <HomeFeaturedAuthorsSection
          initialAuthors={initialData?.featuredAuthors}
        />

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
