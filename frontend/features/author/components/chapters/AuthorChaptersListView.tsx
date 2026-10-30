"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMyStories, StoryItem } from "@/features/stories";
import {
  useStoryChapters,
  useChapterDetail,
  useUpdateChapter,
  useDeleteChapter,
  useReorderChapters,
  useBulkSubmitChapters,
  ChapterItem,
  ChapterStatus,
} from "@/features/chapters";
import { StoryPickerDropdown } from "./StoryPickerDropdown";
import { AuthorChapterFilterBar } from "./AuthorChapterFilterBar";
import { AuthorChapterTable } from "./AuthorChapterTable";
import { AuthorChapterPreviewModal } from "./AuthorChapterPreviewModal";
import { AuthorChapterReorderModal } from "./AuthorChapterReorderModal";
import { AuthorChapterDeleteModal } from "./AuthorChapterDeleteModal";

export function AuthorChaptersListView() {
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
  const bulkSubmitMutation = useBulkSubmitChapters();

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const submittableChapters = useMemo(() => {
    return filteredChapters.filter(
      (c) =>
        c.status === "DRAFT" ||
        c.status === "REJECTED" ||
        (c.status === "PUBLISHED" &&
          (c as any).pendingRevision &&
          ((c as any).pendingRevision.status === "DRAFT" ||
            (c as any).pendingRevision.status === "REJECTED"))
    );
  }, [filteredChapters]);

  const isAllSelected =
    submittableChapters.length > 0 &&
    submittableChapters.every((c) => selectedIds.includes(c._id || c.id || ""));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submittableChapters.map((c) => c._id || c.id || ""));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkSubmit = async () => {
    if (selectedIds.length === 0) return;
    await bulkSubmitMutation.mutateAsync(selectedIds);
    setSelectedIds([]);
  };

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

  const handleQuickSubmitReview = async (chapter: ChapterItem) => {
    await updateChapterMutation.mutateAsync({
      id: chapter._id || chapter.id || "",
      payload: { action: "SUBMIT" },
    });
  };

  const handleConfirmDelete = async () => {
    if (!chapterToDelete) return;
    await deleteChapterMutation.mutateAsync(chapterToDelete._id || chapterToDelete.id || "");
    setChapterToDelete(null);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Quản lý chương truyện
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Chọn tác phẩm để xem, tạo mới với trình soạn thảo hoặc chỉnh sửa các chương truyện.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={
              currentStory?.slug
                ? `/tac-gia/chuong-truyen/lich-su?story=${currentStory.slug}`
                : `/tac-gia/chuong-truyen/lich-su`
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Lịch sử chỉnh sửa</span>
          </Link>

          {selectedStoryId && chapters.length > 1 && (
            <button
              type="button"
              onClick={handleOpenReorder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span>Sắp xếp thứ tự</span>
            </button>
          )}

          {selectedStoryId && (
            <Link
              href={`/tac-gia/chuong-truyen/them-moi?story=${currentStory?.slug || selectedStoryId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Tạo chương mới</span>
            </Link>
          )}
        </div>
      </div>

      {/* Story Selector with Rich Image Search */}
      {isLoadingStories ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-6 animate-pulse">
          <div className="h-5 bg-zinc-200 rounded w-1/4 mb-3" />
          <div className="h-14 bg-zinc-100 rounded-lg" />
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-10 sm:p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900">Bạn chưa có tác phẩm nào</h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-md mb-4">
            Vui lòng tạo một tác phẩm trước khi bắt đầu viết và quản lý các chương truyện.
          </p>
          <Link
            href="/tac-gia/tac-pham/them-moi"
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-md transition shadow-xs cursor-pointer"
          >
            + Viết tác phẩm mới
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
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
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 shrink-0"
                  >
                    Xem truyện ↗
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Stats overview */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 shrink-0">
                <div className="bg-zinc-50 border border-zinc-200 rounded-md p-2.5 text-center min-w-[85px]">
                  <span className="text-[11px] text-zinc-400 font-medium block">Tổng chương</span>
                  <span className="text-base font-bold text-zinc-800">{stats.totalChapters}</span>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-md p-2.5 text-center min-w-[85px]">
                  <span className="text-[11px] text-sky-600 font-medium block">Tổng từ</span>
                  <span className="text-base font-bold text-sky-700">
                    {(stats.totalWords ?? 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2.5 text-center min-w-[85px]">
                  <span className="text-[11px] text-emerald-600 font-medium block">Xuất bản</span>
                  <span className="text-base font-bold text-emerald-700">{stats.published}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 text-center min-w-[85px]">
                  <span className="text-[11px] text-amber-600 font-medium block">Chờ duyệt</span>
                  <span className="text-base font-bold text-amber-700">{stats.pending}</span>
                </div>
                <div className="bg-zinc-100 border border-zinc-200 rounded-md p-2.5 text-center min-w-[85px]">
                  <span className="text-[11px] text-zinc-500 font-medium block">Bản nháp</span>
                  <span className="text-base font-bold text-zinc-700">{stats.draft}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chapters Table Area */}
      {selectedStoryId && (
        <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs overflow-hidden">
          <AuthorChapterFilterBar
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />

          <AuthorChapterTable
            chapters={filteredChapters}
            isLoading={isLoadingChapters}
            searchKeyword={searchKeyword}
            statusFilter={statusFilter}
            selectedIds={selectedIds}
            isAllSelected={isAllSelected}
            currentStorySlugOrId={currentStory?.slug || selectedStoryId}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelect={handleToggleSelect}
            onPreview={setPreviewChapter}
            onQuickSubmitReview={handleQuickSubmitReview}
            onDelete={setChapterToDelete}
          />
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/95 backdrop-blur-md text-white px-5 py-2.5 rounded-lg shadow-xl flex items-center gap-4 border border-zinc-700/80 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs font-semibold">
            Đã chọn <strong className="text-sky-400 font-bold">{selectedIds.length}</strong> chương
          </span>
          <div className="h-4 w-px bg-zinc-700" />
          <button
            type="button"
            disabled={bulkSubmitMutation.isPending}
            onClick={handleBulkSubmit}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {bulkSubmitMutation.isPending ? "Đang gửi duyệt..." : `Gửi duyệt (${selectedIds.length})`}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs text-zinc-400 hover:text-white transition cursor-pointer"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <AuthorChapterPreviewModal
        previewChapter={previewChapter}
        previewDetail={previewDetail}
        isLoading={isLoadingPreview}
        isError={isPreviewError}
        onClose={() => setPreviewChapter(null)}
      />

      {/* Reorder Modal */}
      <AuthorChapterReorderModal
        isOpen={isReorderOpen}
        reorderList={reorderList}
        isPending={reorderChaptersMutation.isPending}
        onMoveChapter={handleMoveChapter}
        onSave={handleSaveReorder}
        onClose={() => setIsReorderOpen(false)}
      />

      {/* Delete Modal */}
      <AuthorChapterDeleteModal
        chapterToDelete={chapterToDelete}
        chapters={chapters}
        isPending={deleteChapterMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setChapterToDelete(null)}
      />
    </div>
  );
}
