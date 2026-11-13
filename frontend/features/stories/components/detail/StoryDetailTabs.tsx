"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { StoryDetailData } from "@/features/stories";

const StoryRatingsSection = dynamic(
  () => import("@/features/ratings").then((mod) => mod.StoryRatingsSection),
  {
    loading: () => (
      <div className="py-8 text-center text-sm text-zinc-400 animate-pulse">
        Đang tải đánh giá...
      </div>
    ),
  }
);

const StoryCommentsSection = dynamic(
  () => import("@/features/comments").then((mod) => mod.StoryCommentsSection),
  {
    loading: () => (
      <div className="py-8 text-center text-sm text-zinc-400 animate-pulse">
        Đang tải bình luận...
      </div>
    ),
  }
);

export type StoryDetailTabKey = "about" | "chapters" | "ratings" | "comments";

interface StoryDetailTabsProps {
  story: StoryDetailData;
  activeTab: StoryDetailTabKey;
  onTabChange: (tab: StoryDetailTabKey) => void;
  publicChapterCount: number;
  children?: React.ReactNode;
}

export const StoryDetailTabs: React.FC<StoryDetailTabsProps> = ({
  story,
  activeTab,
  onTabChange,
  publicChapterCount,
  children,
}) => {
  const ratingCount = story.stats?.ratingCount ?? 0;
  const ratingAvg = story.stats?.ratingAverage ?? 0;
  const commentCount = story.stats?.commentCount ?? 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header các tab */}
      <div className="flex border-b border-slate-200/80 px-4 sm:px-8 bg-slate-50/70 overflow-x-auto scrollbar-none gap-2 sm:gap-4 pt-2">
        <button
          type="button"
          onClick={() => onTabChange("about")}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "about"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Giới thiệu truyện
        </button>
        <button
          type="button"
          onClick={() => onTabChange("chapters")}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "chapters"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Danh sách chương ({publicChapterCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange("ratings")}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === "ratings"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Đánh giá</span>
          <span className="text-amber-500">★</span>
          <span>
            {ratingAvg > 0 ? ratingAvg.toFixed(1) : "0"} ({ratingCount})
          </span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("comments")}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === "comments"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Bình luận</span>
          {commentCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
              {commentCount}
            </span>
          )}
        </button>
      </div>

      {/* Nội dung từng tab */}
      <div className="p-6 sm:p-8">
        {activeTab === "about" && (
          <div className="space-y-6">
            {/* Tóm tắt truyện */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3">Tóm tắt nội dung</h3>
              {story.description ? (
                <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line font-serif sm:font-sans">
                  {story.description}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Tác giả chưa cập nhật phần giới thiệu cho truyện này.</p>
              )}
            </div>

            {/* Lời nhắn tác giả */}
            {story.authorNote && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 shadow-2xs">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1.5 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Lời nhắn của tác giả
                </div>
                <p className="text-sm italic leading-relaxed text-amber-950">{story.authorNote}</p>
              </div>
            )}

            {/* Từ khóa / Tags */}
            {story.tags && story.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Từ khóa liên quan
                </h4>
                <div className="flex flex-wrap gap-2">
                  {story.tags.map((tag) => (
                    <span
                      key={tag._id || tag.slug}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/70 transition-colors"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "chapters" && children}

        {activeTab === "ratings" && (
          <StoryRatingsSection
            storyId={story._id}
            authorId={story.author?._id || undefined}
          />
        )}

        {activeTab === "comments" && (
          <StoryCommentsSection
            storyId={story._id}
            storyAuthorId={story.author?._id || undefined}
            storySlug={story.slug}
          />
        )}
      </div>
    </div>
  );
};
