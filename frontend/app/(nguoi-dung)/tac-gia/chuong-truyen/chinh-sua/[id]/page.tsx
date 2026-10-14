"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useChapterDetail, useUpdateChapter } from "@/lib/hooks/queries/useChapterQuery";
import { useMyStories } from "@/lib/hooks/queries/useStoryQuery";
import { ChapterRichTextEditor } from "@/components/author/chapters/ChapterRichTextEditor";
import { ChapterAction } from "@/types/chapter";

export default function ChinhSuaChuongPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = (params?.id as string) || "";

  // Fetch chapter detail
  const { data: chapter, isLoading, isError } = useChapterDetail(chapterId);

  // Fetch stories to find current story info
  const { data: storiesData } = useMyStories({ limit: 100 });
  const story = useMemo(
    () => storiesData?.items.find((s) => (s._id || s.id) === chapter?.storyId),
    [storiesData, chapter?.storyId]
  );

  // Form states
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [coinPrice, setCoinPrice] = useState<number>(0);
  const [requirePrevious, setRequirePrevious] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync initial chapter data
  useEffect(() => {
    if (chapter) {
      setChapterNumber(chapter.chapterNumber);
      setTitle(chapter.title);
      setContent(chapter.content || "");
      setIsFree(chapter.isFree);
      setCoinPrice(chapter.coinPrice || 0);
      setRequirePrevious(chapter.requirePreviousChapter || false);
    }
  }, [chapter]);

  const updateChapterMutation = useUpdateChapter();

  // Validate form
  const validateForm = () => {
    const errs: Record<string, string> = {};
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
    if (!validateForm() || !chapterId) return;

    await updateChapterMutation.mutateAsync({
      id: chapterId,
      payload: {
        chapterNumber,
        title: title.trim(),
        content,
        isFree,
        coinPrice: isFree ? 0 : coinPrice,
        requirePreviousChapter: isFree ? false : requirePrevious,
        action,
      },
    });

    const storySlug = story?.slug || chapter?.storyId;
    router.push(`/tac-gia/chuong-truyen?story=${storySlug}`);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Đang tải thông tin chương truyện...</p>
      </div>
    );
  }

  if (isError || !chapter) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-16 text-center">
        <h3 className="text-base font-bold text-slate-800 mb-2">Không tìm thấy chương truyện</h3>
        <p className="text-xs text-slate-500 mb-4">
          Chương này không tồn tại hoặc bạn không có quyền chỉnh sửa.
        </p>
        <Link
          href="/tac-gia/chuong-truyen"
          className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl"
        >
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/tac-gia/chuong-truyen${story?.slug ? `?story=${story.slug}` : ""}`}
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
            disabled={updateChapterMutation.isPending}
            onClick={() => handleSubmit("DRAFT")}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            Lưu bản nháp
          </button>
          <button
            type="button"
            disabled={updateChapterMutation.isPending}
            onClick={() => handleSubmit("SUBMIT")}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs hover:shadow-md disabled:opacity-50"
          >
            {updateChapterMutation.isPending ? "Đang lưu..." : "Gửi duyệt ngay"}
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Chương #{chapter.chapterNumber}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-sky-600">{story?.title || "Tác phẩm"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Chỉnh sửa chương truyện
          </h1>
        </div>

        {/* Status Alerts */}
        {chapter.status === "PUBLISHED" && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs sm:text-sm">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <strong className="font-bold block mb-0.5">Lưu ý khi sửa chương đã phát hành:</strong>
              Theo quy định kiểm duyệt của StoryVN, khi bạn lưu các thay đổi của chương này, chương sẽ được chuyển về trạng thái <strong>Chờ duyệt (PENDING_REVIEW)</strong> để Ban quản lý xem xét lại.
            </div>
          </div>
        )}

        {chapter.status === "REJECTED" && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
            <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong className="font-bold block mb-0.5">Chương này đã bị từ chối trước đó:</strong>
              {chapter.rejectReason ? `Lý do: "${chapter.rejectReason}". ` : ""}
              Vui lòng điều chỉnh nội dung cho phù hợp với tiêu chuẩn cộng đồng và nhấn "Gửi duyệt lại".
            </div>
          </div>
        )}

        {/* Chapter Number & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Số thứ tự chương <span className="text-rose-500">*</span>
            </label>
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
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tiêu đề chương <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập tiêu đề chương..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 transition ${
                errors.title
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isFree
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  !isFree
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
                    className={`w-full bg-white border rounded-xl pl-3.5 pr-12 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 transition ${
                      errors.coinPrice
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
                <p className="text-[11px] text-slate-400 mt-1">Gợi ý: 5 - 20 xu mỗi chương.</p>
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
            href={`/tac-gia/chuong-truyen${story?.slug ? `?story=${story.slug}` : ""}`}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Hủy bỏ
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={updateChapterMutation.isPending}
              onClick={() => handleSubmit("DRAFT")}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
            >
              Lưu bản nháp
            </button>
            <button
              type="button"
              disabled={updateChapterMutation.isPending}
              onClick={() => handleSubmit("SUBMIT")}
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs hover:shadow-md disabled:opacity-50"
            >
              {updateChapterMutation.isPending ? "Đang lưu..." : "Gửi duyệt ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
