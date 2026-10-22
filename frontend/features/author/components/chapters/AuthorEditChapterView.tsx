"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChapterDetail, useUpdateChapter, useChapterHistory, ChapterAction, ChapterUpdateItem } from "@/features/chapters";
import { useMyStories } from "@/features/stories";
import { ChapterRichTextEditor } from "./ChapterRichTextEditor";
import { ChapterPricingFields } from "./ChapterPricingFields";
import { ChapterHistoryModal } from "./ChapterHistoryModal";
import { toast } from "@/lib/toast";

interface AuthorEditChapterViewProps {
  chapterId: string;
}

export function AuthorEditChapterView({ chapterId }: AuthorEditChapterViewProps) {
  const router = useRouter();

  // Fetch chapter detail
  const { data: chapter, isLoading, isError } = useChapterDetail(chapterId);

  // Fetch chapter revision history
  const { data: historyList, isLoading: isLoadingHistory } = useChapterHistory(chapterId, Boolean(chapterId));

  const sortedHistory = useMemo(() => {
    if (!historyList) return [];
    return [...historyList].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [historyList]);

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
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<ChapterUpdateItem | null>(null);

  useEffect(() => {
    if (sortedHistory.length > 0 && !selectedRevision) {
      setSelectedRevision(sortedHistory[0]);
    }
  }, [sortedHistory, selectedRevision]);

  useEffect(() => {
    if (chapter) {
      setChapterNumber(chapter.chapterNumber);
      setTitle(chapter.title);
      setContent(chapter.content || "");
      setIsFree(chapter.isFree);
      setCoinPrice(chapter.coinPrice ?? 0);
      setRequirePrevious(chapter.requirePreviousChapter ?? false);

      if (chapter.scheduledAt) {
        const d = new Date(chapter.scheduledAt);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setScheduledAt(localIso);
      }
    }
  }, [chapter]);

  const updateChapterMutation = useUpdateChapter();

  const handleLoadVersionIntoEditor = (rev: ChapterUpdateItem) => {
    setTitle(rev.title);
    setContent(rev.content || "");
    setIsFree(rev.isFree);
    setCoinPrice(rev.coinPrice || 0);
    setRequirePrevious(rev.requirePreviousChapter || false);
    setShowHistoryModal(false);
    toast.success("Đã nạp nội dung bản sửa vào trình soạn thảo!");
  };

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
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      },
    });

    const storySlug = story?.slug || chapter?.storyId;
    router.push(`/tac-gia/chuong-truyen?story=${storySlug}`);
  };

  const handleDiscardUpdate = async () => {
    if (!chapterId) return;
    await updateChapterMutation.mutateAsync({
      id: chapterId,
      payload: { action: "DISCARD_UPDATE" },
    });
    if (chapter) {
      setTitle(chapter.title);
      setContent(chapter.content || "");
      setIsFree(chapter.isFree);
      setCoinPrice(chapter.coinPrice || 0);
      setRequirePrevious(chapter.requirePreviousChapter || false);
    }
    toast.success("Đã hủy bản sửa đổi thành công!");
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
          className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-md"
        >
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-5">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/tac-gia/chuong-truyen${story?.slug ? `?story=${story.slug}` : ""}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-md transition shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Quay lại danh sách chương</span>
        </Link>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Lịch sử chỉnh sửa {sortedHistory.length > 0 && `(${sortedHistory.length})`}</span>
          </button>
          <button
            type="button"
            disabled={updateChapterMutation.isPending}
            onClick={() => handleSubmit("DRAFT")}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            Lưu bản nháp
          </button>
          <button
            type="button"
            disabled={updateChapterMutation.isPending}
            onClick={() => handleSubmit("SUBMIT")}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {updateChapterMutation.isPending ? "Đang lưu..." : "Gửi duyệt ngay"}
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
              Chương #{chapter.chapterNumber}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-sky-600">{story?.title || "Tác phẩm"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Chỉnh sửa chương truyện
          </h1>
        </div>

        {/* Status Alert for Published Chapter */}
        {chapter.status === "PUBLISHED" && (
          <div className="p-3 sm:p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Đã xuất bản
              </span>
              <span className="text-zinc-600">
                Bản sửa sẽ được lưu riêng để kiểm duyệt trước khi cập nhật tới độc giả.
              </span>
              {(chapter as any).pendingUpdate && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                      (chapter as any).pendingUpdate.status === "PENDING_REVIEW"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : (chapter as any).pendingUpdate.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : "bg-zinc-100 text-zinc-700 border-zinc-200"
                    }`}
                  >
                    {(chapter as any).pendingUpdate.status === "PENDING_REVIEW"
                      ? "Bản sửa đang chờ duyệt"
                      : (chapter as any).pendingUpdate.status === "REJECTED"
                      ? "Bản sửa bị từ chối"
                      : "Bản sửa nháp"}
                  </span>
                  <Link
                    href={`/tac-gia/chuong-truyen/lich-su?story=${story?.slug || ""}&chapter=${chapter.chapterNumber}`}
                    className="text-sky-700 hover:text-sky-900 underline font-semibold cursor-pointer"
                  >
                    Xem chi tiết →
                  </Link>
                </div>
              )}
            </div>
            {(chapter as any).pendingUpdate && (
              <button
                type="button"
                onClick={handleDiscardUpdate}
                disabled={updateChapterMutation.isPending}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer shadow-2xs"
              >
                Hủy bản sửa
              </button>
            )}
          </div>
        )}

        {chapter.status === "REJECTED" && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
            <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong className="font-bold block mb-0.5">Chương này đã bị từ chối trước đó:</strong>
              {chapter.rejectReason ? `Lý do: "${chapter.rejectReason}". ` : ""}
              Vui lòng điều chỉnh nội dung cho phù hợp với tiêu chuẩn cộng đồng và nhấn "Gửi duyệt ngay".
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                #
              </span>
              <input
                type="number"
                min={1}
                value={chapterNumber}
                onChange={(e) => setChapterNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-7 pr-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
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
              className={`w-full bg-slate-50 border rounded-md px-3.5 py-2 text-sm font-semibold text-slate-900 focus:outline-none transition ${
                errors.title
                  ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  : "border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
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

        {/* Pricing Fields */}
        <ChapterPricingFields
          isFree={isFree}
          setIsFree={setIsFree}
          coinPrice={coinPrice}
          setCoinPrice={setCoinPrice}
          requirePrevious={requirePrevious}
          setRequirePrevious={setRequirePrevious}
          error={errors.coinPrice}
        />

        {/* Scheduled At */}
        {chapter.status !== "PUBLISHED" && (
          <div className="bg-slate-50/80 rounded-lg border border-slate-200/80 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Lên lịch hiển thị cho độc giả (Tùy chọn)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nếu không đặt lịch, chương sẽ tự động hiển thị cho độc giả ngay sau khi được Ban quản trị phê duyệt.
                </p>
              </div>
              {scheduledAt && (
                <button
                  type="button"
                  onClick={() => setScheduledAt("")}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold self-start sm:self-auto cursor-pointer"
                >
                  Xóa lịch hẹn
                </button>
              )}
            </div>
            <div className="max-w-xs">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>
          </div>
        )}

        {chapter.status === "PUBLISHED" && chapter.scheduledAt && new Date(chapter.scheduledAt) > new Date() && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-xs sm:text-sm text-amber-800">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong>Lịch hẹn hiển thị:</strong> Chương này đã được duyệt nhưng đang hẹn giờ hiển thị vào{" "}
              <span className="font-bold underline">{new Date(chapter.scheduledAt).toLocaleString("vi-VN")}</span>. Đến thời điểm này độc giả mới thấy chương trên hệ thống.
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/tac-gia/chuong-truyen${story?.slug ? `?story=${story.slug}` : ""}`}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition"
          >
            Hủy bỏ
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={updateChapterMutation.isPending}
              onClick={() => handleSubmit("DRAFT")}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition disabled:opacity-50 cursor-pointer"
            >
              Lưu bản nháp
            </button>
            <button
              type="button"
              disabled={updateChapterMutation.isPending}
              onClick={() => handleSubmit("SUBMIT")}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {updateChapterMutation.isPending ? "Đang lưu..." : "Gửi duyệt ngay"}
            </button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <ChapterHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        chapterNumber={chapter.chapterNumber}
        sortedHistory={sortedHistory}
        isLoading={isLoadingHistory}
        selectedRevision={selectedRevision}
        onSelectRevision={setSelectedRevision}
        onLoadVersion={handleLoadVersionIntoEditor}
      />
    </div>
  );
}
