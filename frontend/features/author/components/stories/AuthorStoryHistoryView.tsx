"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  StoryRevisionItem,
  useMyStories,
  useMyStoryRevisions,
  useRestoreStoryRevision,
  useUpdateStory,
} from "@/features/stories";
import { toast } from "@/lib/toast";
import { StoryRevisionListSidebar } from "./StoryRevisionListSidebar";
import { StoryRevisionDetailViewer } from "./StoryRevisionDetailViewer";

const STATUS_TABS = [
  { key: "ALL", label: "Tất cả trạng thái" },
  { key: "PENDING_REVIEW", label: "Chờ duyệt" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "DRAFT", label: "Bản nháp" },
  { key: "REJECTED", label: "Bị từ chối" },
];

export function AuthorStoryHistoryView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const storyQueryParam =
    searchParams.get("story") ||
    searchParams.get("storySlug") ||
    searchParams.get("storyId") ||
    "";

  const { data: storiesData } = useMyStories({ limit: 100, sortBy: "updatedAt" });
  const stories = useMemo(() => storiesData?.items || [], [storiesData]);

  const matchedStory = useMemo(() => {
    if (!storyQueryParam) return null;
    return (
      stories.find(
        (s) => s.slug === storyQueryParam || (s._id || s.id) === storyQueryParam
      ) || null
    );
  }, [stories, storyQueryParam]);

  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);

  useEffect(() => {
    if (matchedStory) {
      setSelectedStoryId(matchedStory._id || matchedStory.id || "");
    } else if (!storyQueryParam && stories.length > 0) {
      setSelectedStoryId((prev) => prev || stories[0]._id || stories[0].id || "");
    } else if (storyQueryParam && stories.length > 0) {
      const found = stories.find(
        (s) => s.slug === storyQueryParam || (s._id || s.id) === storyQueryParam
      );
      if (found) setSelectedStoryId(found._id || found.id || "");
    }
  }, [matchedStory, storyQueryParam, stories]);

  const currentStory = useMemo(() => {
    if (matchedStory) return matchedStory;
    if (!selectedStoryId) return null;
    return (
      stories.find((s) => (s._id || s.id) === selectedStoryId) || null
    );
  }, [matchedStory, selectedStoryId, stories]);

  const identifier = currentStory?.slug || selectedStoryId;

  const {
    data: revisions,
    isLoading,
    isError,
    refetch,
  } = useMyStoryRevisions(identifier, Boolean(identifier));

  const allRevisions = useMemo(() => revisions || [], [revisions]);
  const hasActiveRevision = useMemo(
    () => allRevisions.some((revision) => revision.isActive),
    [allRevisions]
  );

  const filteredRevisions = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return allRevisions.filter((revision) => {
      if (statusFilter !== "ALL" && revision.status !== statusFilter) return false;
      if (keyword && !(revision.title || "").toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });
  }, [allRevisions, statusFilter, searchKeyword]);

  useEffect(() => {
    if (filteredRevisions.length === 0) {
      setSelectedRevisionId(null);
      return;
    }
    if (!filteredRevisions.some((revision) => revision._id === selectedRevisionId)) {
      setSelectedRevisionId(filteredRevisions[0]._id);
    }
  }, [filteredRevisions, selectedRevisionId]);

  const selectedRevision = useMemo(
    () =>
      filteredRevisions.find((revision) => revision._id === selectedRevisionId) ||
      filteredRevisions[0] ||
      null,
    [filteredRevisions, selectedRevisionId]
  );

  const updateStoryMutation = useUpdateStory();
  const restoreRevisionMutation = useRestoreStoryRevision();

  const handleWithdrawRevision = async () => {
    if (!identifier) return;
    await updateStoryMutation.mutateAsync({
      id: identifier,
      payload: {},
      action: "WITHDRAW",
    });
    await refetch();
  };

  const handleRestoreRevision = (revision: StoryRevisionItem) => {
    if (hasActiveRevision) {
      toast.error(
        "Đang có bản sửa mở. Hãy rút hoặc hủy bản đó trước khi khôi phục bản khác."
      );
      return;
    }
    if (!identifier) return;
    restoreRevisionMutation.mutate(
      { slugOrId: identifier, revisionId: revision._id },
      { onSuccess: () => refetch() }
    );
  };

  const handleStoryChange = (storyId: string) => {
    setSelectedStoryId(storyId);
    setSelectedRevisionId(null);
    const targetStory = stories.find((s) => (s._id || s.id) === storyId);
    router.replace(
      `/tac-gia/tac-pham/lich-su?story=${targetStory?.slug || storyId}`
    );
  };

  const editStoryHref = currentStory?.slug
    ? `/tac-gia/tac-pham/chinh-sua/${currentStory.slug}`
    : null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-1.5">
            <Link
              href="/tac-gia/tac-pham"
              className="hover:text-zinc-900 transition flex items-center gap-1"
            >
              <span>← Quản lý tác phẩm</span>
            </Link>
            <span>/</span>
            <span className="text-zinc-900 font-semibold">Lịch sử chỉnh sửa</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lịch sử chỉnh sửa tác phẩm
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Xem lại nội dung từng bản sửa trước khi khôi phục (tối đa 50 bản gần nhất).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {editStoryHref && (
            <Link
              href={editStoryHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs"
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Về trang sửa tác phẩm</span>
            </Link>
          )}

          <Link
            href="/tac-gia/tac-pham"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
          >
            <span>Danh sách tác phẩm</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg p-4 border border-zinc-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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

          <div className="flex items-center gap-2">
            <select
              value={selectedStoryId}
              onChange={(e) => handleStoryChange(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer min-w-[200px]"
            >
              {!selectedStoryId && <option value="">Chọn tác phẩm</option>}
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
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
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

      {/* Main Content Area */}
      {!identifier ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-10 sm:p-14 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900">
            Chọn một tác phẩm để xem lịch sử
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm">
            Lịch sử chỉnh sửa được lưu riêng cho từng tác phẩm.
          </p>
        </div>
      ) : isLoading ? (
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
          <p className="text-sm font-semibold text-red-600">
            Không thể tải danh sách lịch sử sửa đổi
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : filteredRevisions.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-10 sm:p-14 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900">
            {allRevisions.length === 0
              ? "Chưa có lịch sử chỉnh sửa nào"
              : "Không có bản sửa nào phù hợp bộ lọc"}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm mb-4">
            {allRevisions.length === 0
              ? "Khi bạn chỉnh sửa tác phẩm đã xuất bản, các phiên bản sẽ được lưu lại tại đây."
              : "Hãy thử đổi trạng thái hoặc từ khóa tìm kiếm."}
          </p>
          {(statusFilter !== "ALL" || searchKeyword) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setSearchKeyword("");
              }}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-xs font-semibold transition cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <StoryRevisionListSidebar
            items={filteredRevisions}
            selectedRevisionId={selectedRevisionId}
            onSelectRevisionId={setSelectedRevisionId}
          />
          <div className="lg:col-span-7 bg-white rounded-lg border border-zinc-200 shadow-2xs overflow-hidden sticky top-6">
            <StoryRevisionDetailViewer
              selectedRevision={selectedRevision}
              storySlug={currentStory?.slug}
              isMutating={
                updateStoryMutation.isPending || restoreRevisionMutation.isPending
              }
              hasActiveRevision={hasActiveRevision}
              onRestore={handleRestoreRevision}
              onWithdraw={handleWithdrawRevision}
            />
          </div>
        </div>
      )}
    </div>
  );
}
