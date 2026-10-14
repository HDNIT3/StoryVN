"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMyStories } from "@/lib/hooks/queries/useStoryQuery";
import {
  useStoryChapters,
  useChapterDetail,
  useUpdateChapter,
  useDeleteChapter,
  useReorderChapters,
} from "@/lib/hooks/queries/useChapterQuery";
import { StoryPickerDropdown } from "@/components/author/chapters/StoryPickerDropdown";
import {
  ChapterItem,
  ChapterStatus,
} from "@/types/chapter";
import { StoryItem } from "@/types/story";

// Status Badge
function StatusBadge({ status, rejectReason }: { status: ChapterStatus; rejectReason?: string | null }) {
  switch (status) {
    case "PUBLISHED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Đã xuất bản
        </span>
      );
    case "PENDING_REVIEW":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Chờ duyệt
        </span>
      );
    case "REJECTED":
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
          title={rejectReason ? `Lý do từ chối: ${rejectReason}` : "Bị từ chối"}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Bị từ chối
        </span>
      );
    case "HIDDEN":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Đã ẩn
        </span>
      );
    case "DRAFT":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Bản nháp
        </span>
      );
  }
}

export default function ChuongTruyenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyParam = searchParams.get("story");

  // Fetch author's stories
  const { data: storiesData, isLoading: isLoadingStories } = useMyStories({
    limit: 100,
    sortBy: "updatedAt",
  });
  const stories = useMemo(() => storiesData?.items || [], [storiesData]);

  // Selected story state
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

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Fetch chapters for selected story
  const {
    data: chaptersData,
    isLoading: isLoadingChapters,
  } = useStoryChapters(
    {
      storyId: selectedStoryId,
      status: statusFilter === "ALL" ? undefined : (statusFilter as ChapterStatus),
      sortBy: "chapterNumber",
      order: "asc",
    },
    Boolean(selectedStoryId)
  );

  const chapters = useMemo(() => chaptersData?.items || [], [chaptersData]);
  const stats = chaptersData?.stats;

  // Filtered chapters client-side search
  const filteredChapters = useMemo(() => {
    if (!searchKeyword.trim()) return chapters;
    const kw = searchKeyword.toLowerCase().trim();
    return chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(kw) ||
        String(c.chapterNumber).includes(kw)
    );
  }, [chapters, searchKeyword]);

  // Mutations
  const updateChapterMutation = useUpdateChapter();
  const deleteChapterMutation = useDeleteChapter();
  const reorderChaptersMutation = useReorderChapters();

  // Preview Modal
  const [previewChapter, setPreviewChapter] = useState<ChapterItem | null>(null);
  const previewChapterId = previewChapter ? (previewChapter._id || previewChapter.id || "") : "";
  const {
    data: previewDetail,
    isLoading: isLoadingPreview,
    isError: isPreviewError,
  } = useChapterDetail(previewChapterId, Boolean(previewChapterId));

  // Delete Confirm Modal
  const [chapterToDelete, setChapterToDelete] = useState<ChapterItem | null>(null);

  // Reorder Modal
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [reorderList, setReorderList] = useState<ChapterItem[]>([]);

  // Open Reorder Modal
  const handleOpenReorder = () => {
    setReorderList([...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber));
    setIsReorderOpen(true);
  };

  const handleMoveChapter = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reorderList.length) return;
    const updated = [...reorderList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setReorderList(updated);
  };

  const handleSaveReorder = async () => {
    if (!selectedStoryId) return;
    const orders = reorderList.map((c, idx) => ({
      chapterId: c._id || c.id || "",
      chapterNumber: idx + 1,
    }));
    await reorderChaptersMutation.mutateAsync({
      storyId: selectedStoryId,
      payload: { orders },
    });
    setIsReorderOpen(false);
  };

  // Quick submit to review
  const handleQuickSubmitReview = async (chapter: ChapterItem) => {
    await updateChapterMutation.mutateAsync({
      id: chapter._id || chapter.id || "",
      payload: {
        action: "SUBMIT",
      },
    });
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!chapterToDelete) return;
    await deleteChapterMutation.mutateAsync(chapterToDelete._id || chapterToDelete.id || "");
    setChapterToDelete(null);
  };

  return (
    <div className="w-full px-3.5 sm:px-6 md:px-8 lg:px-10 py-5 sm:py-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            Quản lý chương truyện
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chọn tác phẩm để xem, tạo mới với trình soạn thảo hoặc chỉnh sửa các chương truyện.
          </p>
        </div>

        {selectedStoryId && (
          <div className="flex flex-wrap items-center gap-2.5">
            {chapters.length > 1 && (
              <button
                type="button"
                onClick={handleOpenReorder}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span>Sắp xếp thứ tự</span>
              </button>
            )}

            <Link
              href={`/tac-gia/chuong-truyen/them-moi?story=${currentStory?.slug || selectedStoryId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Tạo chương mới</span>
            </Link>
          </div>
        )}
      </div>

      {/* Story Selector with Rich Image Search */}
      {isLoadingStories ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/4 mb-3" />
          <div className="h-14 bg-slate-100 rounded-2xl" />
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">Bạn chưa có tác phẩm nào</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mb-4">
            Vui lòng tạo một tác phẩm trước khi bắt đầu viết và quản lý các chương truyện.
          </p>
          <Link
            href="/tac-gia/tac-pham/them-moi"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs"
          >
            + Viết tác phẩm mới
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Đang quản lý tác phẩm:
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <StoryPickerDropdown
                  stories={stories}
                  selectedStoryId={selectedStoryId}
                  onSelectStory={(story: StoryItem) => {
                    setSelectedStoryId(story._id || story.id || "");
                    if (story.slug) {
                      router.replace(`/tac-gia/chuong-truyen?story=${story.slug}`);
                    }
                  }}
                />

                {currentStory && (
                  <Link
                    href={`/truyen/${currentStory.slug}`}
                    target="_blank"
                    className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1 shrink-0"
                  >
                    Xem truyện ↗
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Stats overview */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-center min-w-[85px]">
                  <span className="text-[11px] text-slate-400 font-medium block">Tổng chương</span>
                  <span className="text-base font-extrabold text-slate-800">{stats.totalChapters}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center min-w-[85px]">
                  <span className="text-[11px] text-emerald-600 font-medium block">Xuất bản</span>
                  <span className="text-base font-extrabold text-emerald-700">{stats.published}</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-center min-w-[85px]">
                  <span className="text-[11px] text-amber-600 font-medium block">Chờ duyệt</span>
                  <span className="text-base font-extrabold text-amber-700">{stats.pending}</span>
                </div>
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-center min-w-[85px]">
                  <span className="text-[11px] text-slate-500 font-medium block">Bản nháp</span>
                  <span className="text-base font-extrabold text-slate-700">{stats.draft}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chapters Table Area */}
      {selectedStoryId && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm theo tiêu đề hoặc số chương..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {[
                { key: "ALL", label: "Tất cả" },
                { key: "PUBLISHED", label: "Xuất bản" },
                { key: "PENDING_REVIEW", label: "Chờ duyệt" },
                { key: "DRAFT", label: "Bản nháp" },
                { key: "REJECTED", label: "Từ chối" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                    statusFilter === tab.key
                      ? "bg-sky-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoadingChapters ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="p-10 sm:p-14 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Chưa có chương truyện nào</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
                {searchKeyword || statusFilter !== "ALL"
                  ? "Không tìm thấy chương nào thỏa mãn bộ lọc hiện tại."
                  : "Bắt đầu soạn thảo chương đầu tiên cho tác phẩm của bạn."}
              </p>
              <Link
                href={`/tac-gia/chuong-truyen/them-moi?story=${currentStory?.slug || selectedStoryId}`}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
              >
                + Thêm chương mới
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-16 text-center">Chương</th>
                    <th className="py-3 px-4">Tiêu đề chương</th>
                    <th className="py-3 px-4 w-32">Trạng thái</th>
                    <th className="py-3 px-4 w-36">Cấu hình xu</th>
                    <th className="py-3 px-4 w-28 text-center">Lượt xem</th>
                    <th className="py-3 px-4 w-32">Cập nhật</th>
                    <th className="py-3 px-4 w-44 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredChapters.map((chapter) => (
                    <tr key={chapter._id || chapter.id} className="hover:bg-slate-50/70 transition">
                      {/* Chapter Number */}
                      <td className="py-3.5 px-4 font-bold text-slate-800 text-center">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mx-auto text-xs font-extrabold text-slate-700">
                          #{chapter.chapterNumber}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() => setPreviewChapter(chapter)}
                          className="hover:text-sky-600 text-left line-clamp-1 transition font-medium"
                        >
                          {chapter.title}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={chapter.status} rejectReason={chapter.rejectReason} />
                      </td>

                      {/* Coin Config */}
                      <td className="py-3.5 px-4">
                        {chapter.isFree ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            Miễn phí
                          </span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {chapter.coinPrice} xu
                            </span>
                            {chapter.requirePreviousChapter && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                Mua tuần tự
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* View Count */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600 text-xs">
                        {(chapter.viewCount || 0).toLocaleString("vi-VN")}
                      </td>

                      {/* Updated Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(chapter.updatedAt).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview button */}
                          <button
                            type="button"
                            onClick={() => setPreviewChapter(chapter)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            title="Xem trước nội dung"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Edit button: navigates to dedicated edit page */}
                          <Link
                            href={`/tac-gia/chuong-truyen/chinh-sua/${chapter._id || chapter.id}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Chỉnh sửa chương trên trang riêng"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>

                          {/* Quick submit review if DRAFT or REJECTED */}
                          {(chapter.status === "DRAFT" || chapter.status === "REJECTED") && (
                            <button
                              type="button"
                              onClick={() => handleQuickSubmitReview(chapter)}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                              title="Gửi duyệt ngay"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}

                          {/* Delete button (only DRAFT / PENDING_REVIEW) */}
                          {chapter.status !== "PUBLISHED" ? (
                            <button
                              type="button"
                              onClick={() => setChapterToDelete(chapter)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Xóa chương"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-slate-300 cursor-not-allowed"
                              title="Không thể xóa chương đã phát hành"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: XEM TRƯỚC NỘI DUNG CHƯƠNG ─── */}
      {previewChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-sky-600">
                  Chương #{previewDetail?.chapterNumber ?? previewChapter.chapterNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {previewDetail?.title || previewChapter.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewChapter(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingPreview ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-3 flex-1">
                <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Đang tải nội dung chương...</span>
              </div>
            ) : isPreviewError ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-2 flex-1 text-center">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-800">Không thể tải nội dung chương</p>
                <p className="text-xs text-slate-500">Đã xảy ra lỗi khi tải dữ liệu chi tiết từ máy chủ.</p>
              </div>
            ) : (
              <div
                className="p-6 overflow-y-auto flex-1 font-serif text-slate-800 leading-relaxed text-sm prose max-w-none [&_p]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2"
                dangerouslySetInnerHTML={{
                  __html:
                    previewDetail?.content && previewDetail.content !== "<p></p>"
                      ? previewDetail.content
                      : previewChapter.content && previewChapter.content !== "<p></p>"
                        ? previewChapter.content
                        : "<p class='text-slate-400 italic'>Chương này chưa có nội dung văn bản.</p>",
                }}
              />
            )}

            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  Trạng thái:{" "}
                  <StatusBadge
                    status={previewDetail?.status || previewChapter.status}
                    rejectReason={previewDetail?.rejectReason || previewChapter.rejectReason}
                  />
                </span>
                <span className="text-slate-300">|</span>
                {previewDetail?.isFree ?? previewChapter.isFree ? (
                  <span className="text-emerald-600 font-medium">Miễn phí</span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    {previewDetail?.coinPrice ?? previewChapter.coinPrice} xu
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/tac-gia/chuong-truyen/chinh-sua/${previewChapter._id || previewChapter.id}`}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg font-semibold transition flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </Link>
                <button
                  type="button"
                  onClick={() => setPreviewChapter(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: SẮP XẾP LẠI THỨ TỰ CHƯƠNG ─── */}
      {isReorderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Sắp xếp lại thứ tự chương</h3>
              <button
                type="button"
                onClick={() => setIsReorderOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              <p className="text-xs text-slate-500 mb-3">
                Sử dụng nút mũi tên Lên/Xuống để điều chỉnh vị trí hiển thị các chương trong truyện:
              </p>
              {reorderList.map((c, index) => (
                <div
                  key={c._id || c.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                      {index + 1}
                    </span>
                    <span className="truncate">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveChapter(index, "up")}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition"
                      title="Di chuyển lên"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === reorderList.length - 1}
                      onClick={() => handleMoveChapter(index, "down")}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition"
                      title="Di chuyển xuống"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsReorderOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={reorderChaptersMutation.isPending}
                onClick={handleSaveReorder}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {reorderChaptersMutation.isPending ? "Đang lưu..." : "Lưu thứ tự"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: XÁC NHẬN XÓA CHƯƠNG ─── */}
      {chapterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Xác nhận xóa chương?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Bạn có chắc chắn muốn xóa <strong>Chương #{chapterToDelete.chapterNumber}: {chapterToDelete.title}</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChapterToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleteChapterMutation.isPending}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {deleteChapterMutation.isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
