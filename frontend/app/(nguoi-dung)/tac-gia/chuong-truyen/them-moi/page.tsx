"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMyStories } from "@/lib/hooks/queries/useStoryQuery";
import { useCreateChapter, useStoryChapters } from "@/lib/hooks/queries/useChapterQuery";
import { ChapterRichTextEditor } from "@/components/author/chapters/ChapterRichTextEditor";
import { StoryPickerDropdown } from "@/components/author/chapters/StoryPickerDropdown";
import { StoryItem } from "@/types/story";
import { ChapterAction } from "@/types/chapter";

export default function ThemMoiChuongPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyParam = searchParams.get("story");

  // Fetch author stories
  const { data: storiesData, isLoading: isLoadingStories } = useMyStories({
    limit: 100,
    sortBy: "updatedAt",
  });
  const stories = useMemo(() => storiesData?.items || [], [storiesData]);

  // Selected story
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");

  useEffect(() => {
    if (stories.length > 0) {
      if (storyParam) {
        const found = stories.find(
          (s) => s.slug === storyParam || s._id === storyParam || s.id === storyParam
        );
        if (found) {
          setSelectedStoryId(found._id || found.id || "");
          return;
        }
      }
      if (!selectedStoryId) {
        setSelectedStoryId(stories[0]._id || stories[0].id || "");
      }
    }
  }, [stories, storyParam, selectedStoryId]);

  const currentStory = useMemo(
    () => stories.find((s) => (s._id || s.id) === selectedStoryId),
    [stories, selectedStoryId]
  );

  // Fetch current chapters to auto-calculate chapterNumber
  const { data: chaptersData } = useStoryChapters(
    { storyId: selectedStoryId },
    Boolean(selectedStoryId)
  );
  const existingChapters = useMemo(() => chaptersData?.items || [], [chaptersData]);

  // Form states
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [coinPrice, setCoinPrice] = useState<number>(0);
  const [requirePrevious, setRequirePrevious] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto assign next chapter number when chapters load
  useEffect(() => {
    if (existingChapters.length > 0) {
      const maxNum = Math.max(...existingChapters.map((c) => c.chapterNumber));
      setChapterNumber(maxNum + 1);
    } else {
      setChapterNumber(1);
    }
  }, [existingChapters]);

  const createChapterMutation = useCreateChapter();

  // Validate form
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!selectedStoryId) {
      errs.story = "Vui lòng chọn tác phẩm";
    }
    if (!title.trim()) {
      errs.title = "Vui lòng nhập tiêu đề chương";
    }
    if (!content.trim() || content === "<p></p>") {
      errs.content = "Vui lòng nhập nội dung chương";
    } else if (wordCount > 2500) {
      errs.content = `Nội dung chương có ${wordCount.toLocaleString()} từ, vượt quá giới hạn tối đa 2.500 từ`;
    }
    if (!isFree) {
      if (!coinPrice || coinPrice <= 0) {
        errs.coinPrice = "Giá xu phải lớn hơn 0 khi đặt chương trả phí";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (action: ChapterAction) => {
    if (!validateForm() || !selectedStoryId) return;

    await createChapterMutation.mutateAsync({
      storyId: selectedStoryId,
      chapterNumber,
      title: title.trim(),
      content,
      isFree,
      coinPrice: isFree ? 0 : coinPrice,
      requirePreviousChapter: isFree ? false : requirePrevious,
      action,
    });

    const storySlug = currentStory?.slug || selectedStoryId;
    router.push(`/tac-gia/chuong-truyen?story=${storySlug}`);
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/tac-gia/chuong-truyen${currentStory?.slug ? `?story=${currentStory.slug}` : ""}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Quay lại danh sách chương</span>
        </Link>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={createChapterMutation.isPending}
            onClick={() => handleSubmit("DRAFT")}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            Lưu bản nháp
          </button>
          <button
            type="button"
            disabled={createChapterMutation.isPending}
            onClick={() => handleSubmit("SUBMIT")}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs hover:shadow-md disabled:opacity-50"
          >
            {createChapterMutation.isPending ? "Đang xử lý..." : "Gửi duyệt ngay"}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Soạn thảo chương mới
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Nhập tiêu đề, nội dung và cấu hình xu để xuất bản hoặc lưu nháp chương truyện.
          </p>
        </div>

        {/* Story Selector with rich image preview */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 sm:p-5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Chọn tác phẩm <span className="text-rose-500">*</span>
          </label>
          {isLoadingStories ? (
            <div className="h-14 bg-slate-200 rounded-2xl animate-pulse" />
          ) : stories.length === 0 ? (
            <div className="text-sm text-rose-500">
              Bạn chưa có tác phẩm nào. Vui lòng tạo tác phẩm trước!
            </div>
          ) : (
            <StoryPickerDropdown
              stories={stories}
              selectedStoryId={selectedStoryId}
              onSelectStory={(story: StoryItem) => {
                setSelectedStoryId(story._id || story.id || "");
              }}
            />
          )}
          {errors.story && (
            <span className="text-xs text-rose-500 mt-1 block">{errors.story}</span>
          )}
        </div>

        {/* Chapter Number & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Số thứ tự chương <span className="text-rose-500">*</span>
              </label>
              {existingChapters.length > 0 && (
                <span className="text-[10px] text-sky-600 font-bold bg-sky-50 border border-sky-200/80 px-1.5 py-0.5 rounded">
                  Tự động: #{Math.max(...existingChapters.map((c) => c.chapterNumber || 0), 0) + 1}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                #
              </span>
              <input
                type="number"
                min={1}
                value={chapterNumber}
                onChange={(e) => setChapterNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Hệ thống tự điền chương tiếp theo.</p>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tiêu đề chương <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đại chiến Hắc Mộc Nhai..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 transition ${errors.title
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-sky-500 focus:ring-sky-100"
                }`}
            />
            {errors.title && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.title}</span>
            )}
          </div>
        </div>

        {/* Rich Text Editor for Content */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Nội dung chương truyện <span className="text-rose-500">*</span>
          </label>
          <ChapterRichTextEditor
            content={content}
            onChange={(html, count) => {
              setContent(html);
              setWordCount(count);
              if (errors.content) setErrors((prev) => ({ ...prev, content: "" }));
            }}
          />
          {errors.content && (
            <span className="text-xs text-rose-500 mt-1 block">{errors.content}</span>
          )}
        </div>

        {/* Cài đặt Xu */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Giá mở khóa chương
              </h3>
            </div>

            {/* Free vs Paid Toggle */}
            <div className="inline-flex p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsFree(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${isFree
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Miễn phí
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFree(false);
                  if (!coinPrice || coinPrice <= 0) {
                    setCoinPrice(10);
                  }
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${!isFree
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Trả phí
              </button>
            </div>
          </div>

          {/* Paid Options */}
          {!isFree && (
            <div className="pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Giá mở khóa (Xu) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={coinPrice}
                    onChange={(e) => {
                      setCoinPrice(parseInt(e.target.value, 10) || 0);
                      if (errors.coinPrice) setErrors((prev) => ({ ...prev, coinPrice: "" }));
                    }}
                    className={`w-full bg-white border rounded-xl pl-3.5 pr-12 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 transition ${errors.coinPrice
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-200 focus:border-amber-500 focus:ring-amber-100"
                      }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-600">
                    Xu
                  </span>
                </div>
                {errors.coinPrice && (
                  <span className="text-xs text-rose-500 mt-1 block">{errors.coinPrice}</span>
                )}
                <p className="text-[11px] text-slate-400 mt-1">Gợi ý thông thường: 5 - 20 xu mỗi chương.</p>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={requirePrevious}
                    onChange={(e) => setRequirePrevious(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Ràng buộc mua chương trước (Tuần tự)
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Độc giả phải mở khóa chương liền trước mới được phép mua chương này.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/tac-gia/chuong-truyen${currentStory?.slug ? `?story=${currentStory.slug}` : ""}`}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Hủy bỏ
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={createChapterMutation.isPending}
              onClick={() => handleSubmit("DRAFT")}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
            >
              Lưu bản nháp
            </button>
            <button
              type="button"
              disabled={createChapterMutation.isPending}
              onClick={() => handleSubmit("SUBMIT")}
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs hover:shadow-md disabled:opacity-50"
            >
              {createChapterMutation.isPending ? "Đang xử lý..." : "Gửi duyệt ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
