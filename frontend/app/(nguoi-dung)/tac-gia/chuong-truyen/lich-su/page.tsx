"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMyStories } from "@/lib/hooks/queries/useStoryQuery";
import {
  useAllChapterHistory,
  useChapterDetail,
  useStoryChapters,
} from "@/lib/hooks/queries/useChapterQuery";
import { ChapterUpdateItem } from "@/types/chapter";

function LichSuChinhSuaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const storyQueryParam =
    searchParams.get("story") ||
    searchParams.get("storySlug") ||
    searchParams.get("storyId") ||
    "";
  const chapterQueryParam =
    searchParams.get("chapter") ||
    searchParams.get("chapterNumber") ||
    searchParams.get("chapterId") ||
    "";

  // Fetch author stories for dropdown filter
  const { data: storiesData } = useMyStories({ limit: 100, sortBy: "updatedAt" });
  const stories = useMemo(() => storiesData?.items || [], [storiesData]);

  // Resolve story object from slug or ID
  const matchedStory = useMemo(() => {
    if (!storyQueryParam) return null;
    return (
      stories.find(
        (s) => s.slug === storyQueryParam || (s._id || s.id) === storyQueryParam
      ) || null
    );
  }, [stories, storyQueryParam]);

  // Story selector filter (holds internal Mongo _id for backend querying)
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Selected revision for detail preview
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);

  // Sync selected story ID when stories or URL param changes
  useEffect(() => {
    if (matchedStory) {
      setSelectedStoryId(matchedStory._id || matchedStory.id || "");
    } else if (storyQueryParam && stories.length > 0) {
      const byId = stories.find((s) => (s._id || s.id) === storyQueryParam);
      if (byId) setSelectedStoryId(byId._id || byId.id || "");
    } else if (!storyQueryParam) {
      setSelectedStoryId("");
    }
  }, [matchedStory, storyQueryParam, stories]);

  // Query chapters of selected story to resolve chapterNumber if chapter param is passed as number
  const { data: storyChaptersData } = useStoryChapters(
    { storyId: selectedStoryId, limit: 200 },
    Boolean(selectedStoryId)
  );

  useEffect(() => {
    if (!chapterQueryParam) {
      setSelectedChapterId("");
      return;
    }
    // If param is already an ObjectId format
    if (chapterQueryParam.length === 24 && /^[0-9a-fA-F]+$/.test(chapterQueryParam)) {
      setSelectedChapterId(chapterQueryParam);
      return;
    }
    // If param is chapterNumber
    if (!isNaN(Number(chapterQueryParam)) && storyChaptersData?.items) {
      const foundCh = storyChaptersData.items.find(
        (c) => c.chapterNumber === Number(chapterQueryParam)
      );
      if (foundCh) {
        setSelectedChapterId(foundCh._id);
      }
    }
  }, [chapterQueryParam, storyChaptersData]);

  // Fetch history list
  const { data: historyData, isLoading, isError, refetch } = useAllChapterHistory({
    storyId: selectedStoryId || undefined,
    chapterId: selectedChapterId || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: searchKeyword.trim() || undefined,
    page,
    limit: 20,
  });

  const historyItems = useMemo(() => historyData?.items || [], [historyData]);
  const totalItems = historyData?.total || 0;
  const totalPages = historyData?.totalPages || 1;

  // Auto-select first item when loaded
  useEffect(() => {
    if (historyItems.length > 0 && !selectedRevisionId) {
      setSelectedRevisionId(historyItems[0]._id);
    }
  }, [historyItems, selectedRevisionId]);

  const selectedRevision = useMemo(
    () => historyItems.find((item) => item._id === selectedRevisionId) || historyItems[0] || null,
    [historyItems, selectedRevisionId]
  );

  // Lấy chi tiết chương khi có chapterId để hiển thị tên chương & tên truyện thân thiện (chặn lộ ID)
  const { data: targetChapter } = useChapterDetail(
    selectedChapterId,
    Boolean(selectedChapterId)
  );

  // Tìm thông tin tác phẩm tương ứng
  const currentStory = useMemo(() => {
    if (matchedStory) return matchedStory;
    const sId =
      selectedStoryId ||
      (targetChapter?.storyId ? String(targetChapter.storyId) : "");
    if (sId) {
      const found = stories.find((s) => (s._id || s.id) === sId);
      if (found) return found;
    }
    if (
      selectedRevision?.storyId &&
      typeof selectedRevision.storyId === "object"
    ) {
      return selectedRevision.storyId;
    }
    return null;
  }, [matchedStory, selectedStoryId, targetChapter, stories, selectedRevision]);

  // Tiêu đề chương hiển thị thân thiện (tuyệt đối chặn hiển thị raw ID ra giao diện)
  const chapterDisplayTitle = useMemo(() => {
    if (targetChapter) {
      return `Chương #${targetChapter.chapterNumber}: ${targetChapter.title}`;
    }
    if (
      selectedRevision?.chapterId &&
      typeof selectedRevision.chapterId === "object"
    ) {
      return `Chương #${selectedRevision.chapterId.chapterNumber}: ${selectedRevision.chapterId.title}`;
    }
    return "Chương đang chọn";
  }, [targetChapter, selectedRevision]);

  const handleClearChapterFilter = () => {
    setSelectedChapterId("");
    const params = new URLSearchParams();
    if (currentStory?.slug) {
      params.append("story", currentStory.slug);
    }
    router.replace(`/tac-gia/chuong-truyen/lich-su?${params.toString()}`);
  };

  const handleStoryChange = (storyId: string) => {
    setSelectedStoryId(storyId);
    setSelectedChapterId(""); // clear specific chapter when changing story
    setPage(1);
    const targetStory = stories.find((s) => (s._id || s.id) === storyId);
    const params = new URLSearchParams();
    if (targetStory?.slug) {
      params.append("story", targetStory.slug);
    } else if (storyId) {
      params.append("story", storyId);
    }
    router.replace(`/tac-gia/chuong-truyen/lich-su?${params.toString()}`);
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-1.5">
            <Link
              href={`/tac-gia/chuong-truyen${currentStory?.slug ? `?story=${currentStory.slug}` : ""}`}
              className="hover:text-zinc-900 transition flex items-center gap-1"
            >
              <span>← Quản lý chương</span>
            </Link>
            <span>/</span>
            <span className="text-zinc-900 font-semibold">Lịch sử chỉnh sửa</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lịch sử chỉnh sửa chương
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Theo dõi tất cả các bản chỉnh sửa nội dung, trạng thái duyệt và phản hồi từ ban quản trị.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedChapterId && (
            <Link
              href={`/tac-gia/chuong-truyen/chinh-sua/${selectedChapterId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs"
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Về trang sửa chương</span>
            </Link>
          )}

          <Link
            href={`/tac-gia/chuong-truyen${currentStory?.slug ? `?story=${currentStory.slug}` : ""}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
          >
            <span>Danh sách chương</span>
          </Link>
        </div>
      </div>

      {/* Chapter Filter Pill if filtering by specific chapter */}
      {selectedChapterId && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
            <span className="text-zinc-600">Đang hiển thị lịch sử của:</span>
            <strong className="text-sky-900 font-semibold truncate">
              {chapterDisplayTitle}
            </strong>
            {currentStory?.title && (
              <span className="text-sky-700 bg-sky-100/70 border border-sky-200/60 rounded px-2 py-0.5 text-xs font-medium">
                Tác phẩm: {currentStory.title}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearChapterFilter}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 hover:underline shrink-0 cursor-pointer"
          >
            ✕ Xem tất cả lịch sử
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo tiêu đề bản sửa..."
              className="w-full pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs w-4 h-4 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Story Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStoryId}
              onChange={(e) => handleStoryChange(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer min-w-[200px]"
            >
              <option value="">Tất cả tác phẩm</option>
              {stories.map((story) => (
                <option key={story._id || story.id} value={story._id || story.id}>
                  {story.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-zinc-100">
          {[
            { key: "ALL", label: "Tất cả trạng thái" },
            { key: "PENDING_REVIEW", label: "Chờ duyệt" },
            { key: "APPROVED", label: "Đã duyệt" },
            { key: "DRAFT", label: "Bản nháp" },
            { key: "REJECTED", label: "Bị từ chối" },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Split 2 Panels (Left: List, Right: Detail Preview) */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-zinc-200 p-4 animate-pulse h-24" />
            ))}
          </div>
          <div className="lg:col-span-7 bg-white rounded-lg border border-zinc-200 p-6 animate-pulse h-96" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
          <p className="text-sm font-semibold text-red-600">Không thể tải danh sách lịch sử sửa đổi</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-10 sm:p-14 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900">Chưa có lịch sử chỉnh sửa nào</h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm mb-4">
            {selectedChapterId || selectedStoryId || statusFilter !== "ALL" || searchKeyword
              ? "Không có bản sửa đổi nào phù hợp với bộ lọc hiện tại của bạn."
              : "Khi bạn chỉnh sửa các chương đã xuất bản, các phiên bản cập nhật sẽ được lưu lại tại đây."}
          </p>
          {(selectedChapterId || selectedStoryId || statusFilter !== "ALL" || searchKeyword) && (
            <button
              type="button"
              onClick={() => {
                setSelectedChapterId("");
                setSelectedStoryId("");
                setStatusFilter("ALL");
                setSearchKeyword("");
                setPage(1);
                router.replace("/tac-gia/chuong-truyen/lich-su");
              }}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-xs font-semibold transition cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Revision List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
              Danh sách bản sửa ({totalItems})
            </div>

            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {historyItems.map((item) => {
                const isSelected = selectedRevision?._id === item._id;
                const chapterObj = typeof item.chapterId === "object" ? item.chapterId : null;
                const storyObj = typeof item.storyId === "object" ? item.storyId : null;

                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedRevisionId(item._id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? "bg-white border-sky-500 shadow-xs ring-1 ring-sky-500"
                        : "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-sky-600 truncate">
                        {storyObj?.title || "Tác phẩm"} • {chapterObj ? `Chương #${chapterObj.chapterNumber}` : "Chương"}
                      </span>
                      {/* Status badge */}
                      {item.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Đã duyệt
                        </span>
                      )}
                      {item.status === "PENDING_REVIEW" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Chờ duyệt
                        </span>
                      )}
                      {item.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Từ chối
                        </span>
                      )}
                      {item.status === "DRAFT" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          Bản nháp
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-900 mt-1 line-clamp-1">
                      {item.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
                      <span>{item.isFree ? "Miễn phí" : `${item.coinPrice} xu`}</span>
                      <span>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : ""}
                      </span>
                    </div>

                    {item.rejectReason && item.status === "REJECTED" && (
                      <p className="mt-2 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded p-1.5 line-clamp-1">
                        Lý do từ chối: {item.rejectReason}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 px-1 text-xs text-zinc-500">
                <span>
                  Trang {page} / {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 transition cursor-pointer"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 transition cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Detail Content Viewer */}
          <div className="lg:col-span-7 bg-white rounded-lg border border-zinc-200 shadow-2xs overflow-hidden sticky top-6">
            {selectedRevision ? (
              <div className="flex flex-col h-[750px]">
                {/* Header of Detail */}
                <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-600 mb-1">
                        <span>
                          {typeof selectedRevision.storyId === "object"
                            ? selectedRevision.storyId.title
                            : "Tác phẩm"}
                        </span>
                        <span>•</span>
                        <span>
                          {typeof selectedRevision.chapterId === "object"
                            ? `Chương #${selectedRevision.chapterId.chapterNumber}`
                            : "Chương"}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
                        {selectedRevision.title}
                      </h2>
                    </div>

                    {/* Action button to open chapter editor */}
                    {selectedRevision.chapterId && (
                      <Link
                        href={`/tac-gia/chuong-truyen/chinh-sua/${
                          typeof selectedRevision.chapterId === "object"
                            ? selectedRevision.chapterId._id
                            : selectedRevision.chapterId
                        }`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold transition shadow-xs shrink-0 self-start sm:self-auto"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Sửa chương này</span>
                      </Link>
                    )}
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-zinc-200 text-xs">
                    <div>
                      <span className="text-zinc-400 block text-[11px]">Trạng thái:</span>
                      <span className="font-semibold text-zinc-800">
                        {selectedRevision.status === "APPROVED"
                          ? "Đã duyệt"
                          : selectedRevision.status === "PENDING_REVIEW"
                          ? "Chờ duyệt"
                          : selectedRevision.status === "REJECTED"
                          ? "Bị từ chối"
                          : "Bản nháp"}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block text-[11px]">Cấu hình xu:</span>
                      <span className="font-semibold text-zinc-800">
                        {selectedRevision.isFree ? "Miễn phí" : `${selectedRevision.coinPrice} xu`}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block text-[11px]">Ngày tạo:</span>
                      <span className="font-semibold text-zinc-800">
                        {selectedRevision.createdAt
                          ? new Date(selectedRevision.createdAt).toLocaleDateString("vi-VN")
                          : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block text-[11px]">Người kiểm duyệt:</span>
                      <span className="font-semibold text-zinc-800">
                        {selectedRevision.reviewerId && typeof selectedRevision.reviewerId === "object"
                          ? selectedRevision.reviewerId.displayName || selectedRevision.reviewerId.username
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Note */}
                  {selectedRevision.rejectReason && selectedRevision.status === "REJECTED" && (
                    <div className="mt-3 bg-rose-50 border border-rose-200 rounded-md p-2.5 text-xs text-rose-800">
                      <strong>Lý do từ chối:</strong> {selectedRevision.rejectReason}
                    </div>
                  )}
                </div>

                {/* HTML Content Body */}
                <div
                  className="p-5 sm:p-6 overflow-y-auto flex-1 font-serif text-zinc-800 text-sm leading-relaxed prose max-w-none [&_p]:mb-3.5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-2"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedRevision.content && selectedRevision.content !== "<p></p>"
                        ? selectedRevision.content
                        : "<p class='text-zinc-400 italic'>Bản sửa đổi này không có nội dung văn bản.</p>",
                  }}
                />

                {/* Footer bar */}
                <div className="p-3 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    Độ dài nội dung: ~
                    {selectedRevision.content
                      ? selectedRevision.content.replace(/<[^>]*>/g, "").trim().split(/\s+/).length
                      : 0}{" "}
                    từ
                  </span>
                  <span>
                    Lần sửa gần nhất:{" "}
                    {selectedRevision.updatedAt
                      ? new Date(selectedRevision.updatedAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-zinc-400 flex flex-col items-center justify-center h-full">
                <span>Chọn một bản sửa đổi bên trái để xem chi tiết.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LichSuChinhSuaPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 py-12 text-center text-xs text-zinc-500">
          Đang tải lịch sử chỉnh sửa...
        </div>
      }
    >
      <LichSuChinhSuaContent />
    </Suspense>
  );
}
