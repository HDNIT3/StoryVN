import React from "react";
import type { StoryDetailData } from "@/features/stories";

interface StoryDetailTabsProps {
  story: StoryDetailData;
  activeTab: "about" | "chapters";
  onTabChange: (tab: "about" | "chapters") => void;
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
  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
      {/* Header các tab */}
      <div className="flex border-b border-zinc-200/80 px-6 sm:px-8 bg-zinc-50/50">
        <button
          type="button"
          onClick={() => onTabChange("about")}
          className={`py-4 px-2 sm:px-4 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "about"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Giới thiệu truyện
        </button>
        <button
          type="button"
          onClick={() => onTabChange("chapters")}
          className={`py-4 px-2 sm:px-4 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "chapters"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Danh sách chương ({publicChapterCount})
        </button>
      </div>

      {/* Nội dung từng tab */}
      <div className="p-6 sm:p-8">
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

            {/* Lời nhắn tác giả */}
            {story.authorNote && (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-900">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Lời nhắn của tác giả
                </div>
                <p className="text-sm italic">{story.authorNote}</p>
              </div>
            )}

            {/* Từ khóa / Tags */}
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

        {activeTab === "chapters" && children}
      </div>
    </div>
  );
};
