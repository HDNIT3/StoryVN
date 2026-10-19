"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useChapterDetail, useUpdateChapter, useChapterHistory } from "@/lib/hooks/queries/useChapterQuery";
import { useMyStories } from "@/lib/hooks/queries/useStoryQuery";
import { ChapterRichTextEditor } from "@/components/author/chapters/ChapterRichTextEditor";
import { ChapterAction, ChapterUpdateItem } from "@/types/chapter";
import { toast } from "@/lib/toast";

export default function ChinhSuaChuongPage() {
  const router = useRouter();
  const params = useParams();
  const chapterId = (params?.id as string) || "";

  // Fetch chapter detail
  const { data: chapter, isLoading, isError } = useChapterDetail(chapterId);

  // Fetch chapter revision history
  const { data: historyList, isLoading: isLoadingHistory } = useChapterHistory(chapterId, Boolean(chapterId));

  // Sắp xếp lịch sử sửa đổi: MỚI NHẤT TRƯỚC
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

  // Khi mở lịch sử, tự động chọn bản ghi mới nhất nếu chưa chọn
  useEffect(() => {
    if (sortedHistory.length > 0 && !selectedRevision) {
      setSelectedRevision(sortedHistory[0]);
    }
  }, [sortedHistory, selectedRevision]);

  // Luôn nạp dữ liệu từ bản chính của chương (bản chưa thay đổi đang phục vụ độc giả)
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

  // Nạp một phiên bản từ lịch sử vào trình soạn thảo
  const handleLoadVersionIntoEditor = (rev: ChapterUpdateItem) => {
    setTitle(rev.title);
    setContent(rev.content || "");
    setIsFree(rev.isFree);
    setCoinPrice(rev.coinPrice || 0);
    setRequirePrevious(rev.requirePreviousChapter || false);
    setShowHistoryModal(false);
    toast.success("Đã nạp nội dung bản sửa vào trình soạn thảo!");
  };

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
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      },
    });

    const storySlug = story?.slug || chapter?.storyId;
    router.push(`/tac-gia/chuong-truyen?story=${storySlug}`);
  };

  // Hủy bản sửa đổi nháp/chờ duyệt hiện tại
  const handleDiscardUpdate = async () => {
    if (!chapterId) return;
    await updateChapterMutation.mutateAsync({
      id: chapterId,
      payload: {
        action: "DISCARD_UPDATE",
      },
    });
    // Giữ nguyên bản chính trong editor
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
          <Link
            href={`/tac-gia/chuong-truyen/lich-su?story=${story?.slug || ""}&chapter=${chapter.chapterNumber}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Lịch sử chỉnh sửa {sortedHistory.length > 0 && `(${sortedHistory.length})`}</span>
          </Link>
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

        {/* Status Alert for Published Chapter - Compact & Clean Design */}
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
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                    (chapter as any).pendingUpdate.status === "PENDING_REVIEW"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : (chapter as any).pendingUpdate.status === "REJECTED"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                  }`}>
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

        {/* Cài đặt Xu */}
        <div className="bg-slate-50/80 rounded-lg border border-slate-200/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Giá mở khóa chương
              </h3>
            </div>

            {/* Free vs Paid Toggle */}
            <div className="inline-flex p-1 bg-slate-200/80 rounded-md self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsFree(true)}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
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
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
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
                    className={`w-full bg-white border rounded-md pl-3 pr-12 py-2 text-sm font-bold text-slate-900 focus:outline-none transition ${
                      errors.coinPrice
                        ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        : "border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-600">
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

        {/* Đặt lịch xuất bản (cho chương chưa công khai) */}
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

      {/* Modal Lịch sử chỉnh sửa - Layout 2 cột chi tiết */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg max-w-5xl w-full h-[88vh] flex flex-col border border-slate-300 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Lịch sử chỉnh sửa Chương #{chapter.chapterNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bấm vào từng bản sửa để xem chi tiết đầy đủ nội dung hoặc nạp vào trình soạn thảo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Two-panel layout */}
            <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
              {/* Left Column: Danh sách các bản sửa (mới nhất trên cùng) */}
              <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0 overflow-hidden">
                <div className="p-3 border-b border-slate-200/80 text-xs font-bold text-slate-600 bg-slate-100/70">
                  Danh sách bản sửa ({sortedHistory.length})
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                  {isLoadingHistory ? (
                    <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-xs font-medium">Đang tải...</p>
                    </div>
                  ) : sortedHistory.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs px-3">
                      Chưa có bản ghi chỉnh sửa nào cho chương này.
                    </div>
                  ) : (
                    sortedHistory.map((rev, idx) => {
                      const isSelected = selectedRevision?._id === rev._id;
                      const statusStyles = {
                        APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-300",
                        PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-300",
                        REJECTED: "bg-rose-50 text-rose-700 border-rose-300",
                        DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
                      };
                      const statusLabels = {
                        APPROVED: "Đã duyệt",
                        PENDING_REVIEW: "Chờ duyệt",
                        REJECTED: "Bị từ chối",
                        DRAFT: "Bản nháp",
                      };

                      return (
                        <div
                          key={rev._id}
                          onClick={() => setSelectedRevision(rev)}
                          className={`p-3 rounded-md border text-left cursor-pointer transition select-none ${
                            isSelected
                              ? "bg-sky-50/90 border-sky-500 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-slate-700">
                              Bản #{sortedHistory.length - idx}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold border ${
                                statusStyles[rev.status] || statusStyles.DRAFT
                              }`}
                            >
                              {statusLabels[rev.status] || rev.status}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-900 truncate mb-1">
                            {rev.title || "(Chưa có tiêu đề)"}
                          </div>

                          <div className="text-[11px] text-slate-400">
                            {rev.createdAt
                              ? new Date(rev.createdAt).toLocaleString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Xem chi tiết toàn bộ nội dung của bản được chọn */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {selectedRevision ? (
                  <>
                    {/* Header thông tin chi tiết của bản ghi */}
                    <div className="p-4 border-b border-slate-200 bg-white shrink-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            {selectedRevision.title || "(Chưa có tiêu đề)"}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span>
                              Thời gian gửi:{" "}
                              <strong>
                                {selectedRevision.createdAt
                                  ? new Date(selectedRevision.createdAt).toLocaleString("vi-VN")
                                  : "Không rõ"}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Cấu hình:{" "}
                              <strong>
                                {selectedRevision.isFree ? "Miễn phí" : `Trả phí (${selectedRevision.coinPrice} xu)`}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLoadVersionIntoEditor(selectedRevision)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Nạp vào trình soạn thảo</span>
                        </button>
                      </div>

                      {/* Lý do từ chối nếu có */}
                      {selectedRevision.rejectReason && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start gap-2">
                          <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <strong>Lý do từ chối từ Ban quản trị:</strong> {selectedRevision.rejectReason}
                          </div>
                        </div>
                      )}

                      {/* Thông tin kiểm duyệt nếu có */}
                      {selectedRevision.reviewedAt && (
                        <div className="text-[11px] text-slate-500">
                          Kiểm duyệt lúc:{" "}
                          <span className="font-semibold text-slate-700">
                            {new Date(selectedRevision.reviewedAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Vùng xem toàn bộ nội dung chi tiết */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-slate-800 text-sm leading-relaxed prose max-w-none select-text">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Nội dung chi tiết của bản ghi:
                      </div>
                      {selectedRevision.content ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: selectedRevision.content }}
                          className="space-y-3 [&_p]:mb-3"
                        />
                      ) : (
                        <div className="text-slate-400 italic text-xs">Bản ghi này không có nội dung văn bản.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                    Vui lòng chọn một bản ghi ở danh sách bên trái để xem chi tiết.
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-md transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
