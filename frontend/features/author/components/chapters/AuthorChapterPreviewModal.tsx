import React from "react";
import Link from "next/link";
import { ChapterItem } from "@/features/chapters";
import { StatusBadge } from "./StatusBadge";

interface AuthorChapterPreviewModalProps {
  previewChapter: ChapterItem | null;
  previewDetail?: ChapterItem | null;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
}

export function AuthorChapterPreviewModal({
  previewChapter,
  previewDetail,
  isLoading,
  isError,
  onClose,
}: AuthorChapterPreviewModalProps) {
  if (!previewChapter) return null;

  // Bản sửa đang mở: xem trước đúng nội dung tác giả đã chỉnh/gửi duyệt
  const activeRevision =
    (previewDetail ?? previewChapter).pendingRevision ?? null;
  const displayTitle =
    activeRevision?.title || previewDetail?.title || previewChapter.title;
  const displayContent =
    activeRevision?.content ??
    previewDetail?.content ??
    previewChapter.content;
  const displayIsFree = activeRevision
    ? activeRevision.isFree
    : previewDetail?.isFree ?? previewChapter.isFree;
  const displayCoinPrice = activeRevision
    ? activeRevision.coinPrice
    : previewDetail?.coinPrice ?? previewChapter.coinPrice;

  const revisionChip =
    activeRevision?.status === "PENDING_REVIEW"
      ? { label: "Đang xem bản chờ duyệt", className: "bg-amber-50 text-amber-700 border-amber-200" }
      : activeRevision?.status === "DRAFT"
      ? { label: "Đang xem bản nháp", className: "bg-zinc-100 text-zinc-600 border-zinc-200" }
      : activeRevision?.status === "REJECTED"
      ? { label: "Đang xem bản bị từ chối", className: "bg-rose-50 text-rose-700 border-rose-200" }
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg border border-zinc-200 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-sky-600">
                Chương #{previewDetail?.chapterNumber ?? previewChapter.chapterNumber}
              </span>
              {revisionChip && (
                <span
                  className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${revisionChip.className}`}
                >
                  {revisionChip.label}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              {displayTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 flex-1">
            <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-500 font-medium">Đang tải nội dung chương...</span>
          </div>
        ) : isError ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-2 flex-1 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-800">Không thể tải nội dung chương</p>
            <p className="text-xs text-zinc-500">Đã xảy ra lỗi khi tải dữ liệu chi tiết từ máy chủ.</p>
          </div>
        ) : (
          <div
            className="p-6 overflow-y-auto flex-1 font-serif text-zinc-800 leading-relaxed text-sm prose max-w-none [&_p]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2"
            dangerouslySetInnerHTML={{
              __html:
                displayContent && displayContent !== "<p></p>"
                  ? displayContent
                  : "<p class='text-zinc-400 italic'>Chương này chưa có nội dung văn bản.</p>",
            }}
          />
        )}

        <div className="px-6 py-3 border-t border-zinc-200 flex items-center justify-between bg-zinc-50/50 text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <span>
              Trạng thái:{" "}
              <StatusBadge
                status={previewDetail?.status || previewChapter.status}
                rejectReason={previewDetail?.rejectReason || previewChapter.rejectReason}
              />
            </span>
            <span className="text-zinc-300">|</span>
            {displayIsFree ? (
              <span className="text-emerald-600 font-medium">Miễn phí</span>
            ) : (
              <span className="text-amber-600 font-medium">
                {displayCoinPrice} xu
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/tac-gia/chuong-truyen/chinh-sua/${previewChapter._id || previewChapter.id}`}
              className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md font-semibold transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Chỉnh sửa
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md font-semibold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
