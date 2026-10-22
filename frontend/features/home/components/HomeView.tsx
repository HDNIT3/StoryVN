"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { storyService, storyKeys } from "@/features/stories";
import { HeroStoryBanner } from "./HeroStoryBanner";
import { HomeTopViewsSection } from "./HomeTopViewsSection";
import { HomeTopWordCountSection } from "./HomeTopWordCountSection";
import { HomeLatestChaptersSection } from "./HomeLatestChaptersSection";

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

  const { data: topWordCountStories = [], isLoading: isLoadingWordCount } = useQuery({
    queryKey: storyKeys.topWordCount(4),
    queryFn: async () => {
      const res = await storyService.getTopWordCount(4);
      return res.data || [];
    },
  });

  const latestStories = latestUpdatedData?.items || [];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white">
      {/* ─── Luminous mesh background ─────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[920px] overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[440px] w-[760px] -translate-x-1/2 rounded-full bg-sky-200/40 opacity-70 blur-3xl" />
        <div className="absolute top-24 -left-32 h-[380px] w-[380px] rounded-full bg-indigo-200/35 opacity-60 blur-3xl" />
        <div className="absolute top-64 -right-32 h-[420px] w-[420px] rounded-full bg-fuchsia-200/25 opacity-60 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-white/0 via-white/40 to-white" />
      </div>

      <div className="relative z-10 mx-auto w-full space-y-12 px-4 py-6 sm:space-y-16 sm:px-6 sm:py-10 lg:px-10 2xl:px-16">
        {/* HERO — Truyện mới nhất nổi bật */}
        <section id="noi-bat" aria-label="Tiêu điểm nổi bật" className="scroll-mt-36">
          <HeroStoryBanner />
        </section>

        {/* BẢNG XẾP HẠNG — Top truyện nhiều lượt xem */}
        <HomeTopViewsSection
          topStories={topStories}
          isLoading={isLoadingTopViews}
        />

        {/* TOP WORD COUNT — Truyện có tổng số từ lớn nhất */}
        <HomeTopWordCountSection
          stories={topWordCountStories}
          isLoading={isLoadingWordCount}
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
