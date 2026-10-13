"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { StoryItem } from "@/types/story";

interface StoryPickerDropdownProps {
  stories: StoryItem[];
  selectedStoryId: string;
  onSelectStory: (story: StoryItem) => void;
}

export function StoryPickerDropdown({
  stories,
  selectedStoryId,
  onSelectStory,
}: StoryPickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStory = useMemo(
    () => stories.find((s) => (s._id || s.id) === selectedStoryId),
    [stories, selectedStoryId]
  );

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStories = useMemo(() => {
    if (!search.trim()) return stories;
    const kw = search.toLowerCase().trim();
    return stories.filter((s) => s.title.toLowerCase().includes(kw));
  }, [stories, search]);

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      {/* Selected Story Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 p-2.5 sm:p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs transition text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Cover Thumbnail */}
          <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-xs relative">
            {selectedStory?.coverUrl ? (
              <img
                src={selectedStory.coverUrl}
                alt={selectedStory.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white p-1">
                <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition truncate">
              {selectedStory?.title || "Chọn tác phẩm..."}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="font-semibold text-sky-600">
                {selectedStory?.stats?.chapterCount || 0} chương
              </span>
              <span>•</span>
              <span>
                {selectedStory?.status === "PUBLISHED"
                  ? "Đã phát hành"
                  : selectedStory?.status === "PENDING_REVIEW"
                  ? "Chờ duyệt"
                  : "Bản nháp"}
              </span>
            </div>
          </div>
        </div>

        {/* Chevron Icon */}
        <div className="p-1 rounded-lg text-slate-400 group-hover:text-slate-700 transition shrink-0">
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Tìm tên truyện để quản lý..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
              />
            </div>
          </div>

          {/* Stories List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredStories.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Không tìm thấy tác phẩm nào khớp từ khóa.
              </div>
            ) : (
              filteredStories.map((story) => {
                const isSelected =
                  (story._id || story.id) === selectedStoryId;

                return (
                  <button
                    key={story._id || story.id}
                    type="button"
                    onClick={() => {
                      onSelectStory(story);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition ${
                      isSelected
                        ? "bg-sky-50/80 border border-sky-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Cover Thumbnail with Image */}
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                      {story.coverUrl ? (
                        <img
                          src={story.coverUrl}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white p-1">
                          <svg className="w-4 h-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Story Details */}
                    <div className="min-w-0 flex-1">
                      <h5
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isSelected ? "text-sky-700" : "text-slate-800"
                        }`}
                      >
                        {story.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {story.stats?.chapterCount || 0} chương
                        </span>
                        <span>•</span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-medium ${
                            story.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700"
                              : story.status === "PENDING_REVIEW"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {story.status === "PUBLISHED"
                            ? "Xuất bản"
                            : story.status === "PENDING_REVIEW"
                            ? "Chờ duyệt"
                            : "Bản nháp"}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0 mr-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
