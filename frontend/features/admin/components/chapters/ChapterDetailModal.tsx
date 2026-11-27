"use client";

import React, { useState } from "react";
import type { AdminChapterItem } from "@/features/chapters";
import { useAdminChapterDetail } from "../../queries/useAdminChapterQueries";

interface Props {
  chapter: AdminChapterItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (chapter: AdminChapterItem) => void;
  onReject: (chapter: AdminChapterItem) => void;
  onUnpublish: (chapter: AdminChapterItem) => void;
  onHide?: (chapter: AdminChapterItem) => void;
  onUnhide?: (chapter: AdminChapterItem) => void;
  onResetPending?: (chapter: AdminChapterItem) => void;
}

export function ChapterDetailModal({
  chapter,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onUnpublish,
  onHide,
  onUnhide,
  onResetPending,
}: Props) {
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");

  // Gọi API lấy đầy đủ chi tiết bao gồm nội dung content dài
  const { data: fullChapter, isLoading } = useAdminChapterDetail(
    isOpen && chapter ? chapter._id : null
  );

  if (!isOpen || !chapter) return null;

  const currentChapter = fullChapter || chapter;
  const story = typeof currentChapter.storyId === "object" ? currentChapter.storyId : null;
  const author = story && typeof story.authorId === "object" ? story.authorId : null;
  const authorName = author?.displayName || "Chưa xác định";

  const pendingRevision = (currentChapter as any).pendingRevision;
  const isPendingRevisionReview =
    currentChapter.status === "PUBLISHED" &&
    pendingRevision?.status === "PENDING_REVIEW";

  const isPending = currentChapter.status === "PENDING_REVIEW" || isPendingRevisionReview;
  const isPublished = currentChapter.status === "PUBLISHED" && !isPendingRevisionReview;

  // Nếu đang duyệt bản cập nhật, ưu tiên hiển thị nội dung và tiêu đề của pendingRevision
  const displayTitle = isPendingRevisionReview
    ? pendingRevision.title || currentChapter.title
    : currentChapter.title;
  const contentText = isPendingRevisionReview
    ? pendingRevision.content || ""
    : currentChapter.content || "";
  const wordCount = contentText ? contentText.trim().split(/\s+/).length : 0;

  const fontSizes = {
    sm: "text-sm leading-7",
    base: "text-base leading-8",
    lg: "text-lg leading-9",
  };

  return (
    <div className="admin-dialog-overlay fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-6 bg-gray-950/50 animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-labelledby="admin-chapter-title" className="admin-dialog bg-white rounded-2xl max-w-5xl w-full max-h-[calc(100dvh-3rem)] flex flex-col border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="admin-dialog-header p-5 md:px-6 md:py-4 border-b border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-gray-50/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-admin-brand-600 bg-admin-brand-50 px-2.5 py-0.5 rounded-lg text-xs">
                Chương {currentChapter.chapterNumber}
              </span>
              {isPendingRevisionReview && (
                <span className="font-medium text-admin-brand-600 bg-admin-brand-50 px-2 py-0.5 rounded-md text-xs">
                  Bản sửa đổi chờ duyệt
                </span>
              )}
              <h2 id="admin-chapter-title" className="admin-dialog-title text-xl sm:text-2xl font-semibold text-gray-900 leading-snug break-words">
                {displayTitle || `Chương ${currentChapter.chapterNumber}`}
              </h2>
            </div>
            {story && (
              <p className="text-sm text-gray-500 mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span>Thuộc tác phẩm:</span>
                <span className="font-medium text-gray-800">{story.title}</span>
                <span className="text-gray-300">•</span>
                <span>Tác giả:</span>
                <span className="font-semibold text-gray-700">{authorName}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tùy chỉnh cỡ chữ xem trước */}
            <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setFontSize("sm")}
                className={`px-2 py-0.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                  fontSize === "sm" ? "bg-admin-brand-50 text-admin-brand-600" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize("base")}
                className={`px-2 py-0.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                  fontSize === "base" ? "bg-admin-brand-50 text-admin-brand-600" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("lg")}
                className={`px-2 py-0.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                  fontSize === "lg" ? "bg-admin-brand-50 text-admin-brand-600" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                A+
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng chi tiết chương"
              className="admin-dialog-close p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Thông tin vắn tắt (Bar metadata) */}
        <div className="admin-chapter-meta px-6 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3 text-xs text-gray-600 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="text-gray-500">Trạng thái:</span>
              <span className="font-medium">
                {currentChapter.status === "PENDING_REVIEW" && (
                  <span className="px-2 py-0.5 rounded-full text-amber-700 bg-amber-100 border border-amber-300 text-xs">
                    Chờ duyệt
                  </span>
                )}
                {currentChapter.status === "PUBLISHED" && (
                  <span className="px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-100 border border-emerald-300 text-xs">
                    Đã xuất bản
                  </span>
                )}
                {currentChapter.status === "REJECTED" && (
                  <span className="px-2 py-0.5 rounded-full text-rose-700 bg-rose-100 border border-rose-300 text-xs">
                    Bị từ chối
                  </span>
                )}
                {currentChapter.status === "DRAFT" && (
                  <span className="px-2 py-0.5 rounded-full text-gray-700 bg-gray-100 border border-gray-300 text-xs">
                    Bản nháp
                  </span>
                )}
                {currentChapter.status === "HIDDEN" && (
                  <span className="px-2 py-0.5 rounded-full text-purple-700 bg-purple-100 border border-purple-300 text-xs">
                    Đã ẩn
                  </span>
                )}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gray-500">Thiết lập đọc:</span>
              <span className="font-medium text-gray-800">
                {currentChapter.isFree ? "Miễn phí" : `Thu phí (${currentChapter.coinPrice} xu)`}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gray-500">Số chữ ước tính:</span>
              <span className="font-medium text-gray-800">{wordCount.toLocaleString("vi-VN")} từ</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gray-500">Lượt đọc:</span>
              <span className="font-medium text-gray-800">{(currentChapter.viewCount ?? 0).toLocaleString("vi-VN")}</span>
            </span>
          </div>

          <div className="text-gray-400 text-xs">
            {currentChapter.createdAt && (
              <span>
                Tạo lúc:{" "}
                {new Date(currentChapter.createdAt).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Banner thông báo nếu đang duyệt bản sửa đổi của chương PUBLISHED */}
        {isPendingRevisionReview && (
          <div className="admin-dialog-alert mx-6 mt-4 p-3.5 bg-admin-brand-50 border border-admin-brand-200 rounded-2xl flex items-start gap-2.5 text-xs text-admin-brand-900 shrink-0">
            <svg className="w-5 h-5 text-admin-brand-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong className="font-medium block mb-0.5">Duyệt bản chỉnh sửa của chương đã xuất bản:</strong>
              Bạn đang xem nội dung chỉnh sửa mới do tác giả gửi lên. Bản phát hành hiện tại của chương vẫn đang phục vụ độc giả bình thường. Khi bạn bấm &quot;Phê duyệt xuất bản&quot;, nội dung mới này sẽ chính thức thay thế bản cũ.
            </div>
          </div>
        )}

        {/* Thông báo lý do theo trạng thái nếu có */}
        {currentChapter.rejectReason && (
          <div className={`admin-dialog-alert mx-6 mt-4 p-3.5 rounded-2xl flex items-start gap-2.5 shrink-0 text-xs ${
            currentChapter.status === "HIDDEN"
              ? "bg-purple-50 border border-purple-200 text-purple-800"
              : currentChapter.status === "DRAFT"
              ? "bg-amber-50 border border-amber-200 text-amber-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}>
            <svg className={`w-4 h-4 shrink-0 mt-0.5 ${
              currentChapter.status === "HIDDEN"
                ? "text-purple-600"
                : currentChapter.status === "DRAFT"
                ? "text-amber-600"
                : "text-rose-600"
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <span className="font-medium">
                {currentChapter.status === "HIDDEN"
                  ? "Lý do tạm ẩn từ ban quản trị: "
                  : currentChapter.status === "DRAFT"
                  ? "Lý do gỡ duyệt: "
                  : "Lý do từ chối trước đây: "}
              </span>
              <span>{currentChapter.rejectReason}</span>
            </div>
          </div>
        )}

        {/* Nội dung chương (Scrollable) */}
        <div className="admin-dialog-body admin-chapter-reader min-h-0 flex-1 overflow-y-auto p-5 sm:p-8 font-serif text-gray-800 select-text">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-8 h-8 border-3 border-admin-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-sans text-gray-500 font-medium">Đang tải toàn bộ nội dung chương...</p>
            </div>
          ) : contentText ? (
            <div
              className={`admin-chapter-document prose max-w-none [&_p]:mb-3 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_h3]:mb-2 ${fontSizes[fontSize]}`}
              dangerouslySetInnerHTML={{
                __html: contentText,
              }}
            />
          ) : (
            <div className="py-16 text-center text-gray-400 font-sans text-xs">
              Chương này hiện chưa có nội dung văn bản.
            </div>
          )}
        </div>

        {/* Footer Thao tác */}
        <div className="admin-dialog-footer p-4 md:px-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Phê duyệt & Từ chối nếu PENDING */}
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => onReject(currentChapter)}
                  className="px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Từ chối</span>
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(currentChapter)}
                  className="px-4 py-2 text-sm font-medium text-white bg-admin-brand-500 hover:bg-admin-brand-600 rounded-lg transition-colors shadow-admin-card flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Phê duyệt xuất bản</span>
                </button>
              </>
            )}

            {/* Nếu PUBLISHED: Có nút Ẩn chương và Gỡ duyệt */}
            {isPublished && (
              <>
                {onHide && (
                  <button
                    type="button"
                    onClick={() => onHide(currentChapter)}
                    className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                    <span>Ẩn chương</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onUnpublish(currentChapter)}
                  className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Gỡ về nháp</span>
                </button>
              </>
            )}

            {/* Nếu đang HIDDEN: Nút Mở lại hiển thị */}
            {currentChapter.status === "HIDDEN" && onUnhide && (
              <button
                type="button"
                onClick={() => onUnhide(currentChapter)}
                className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Mở lại công khai</span>
              </button>
            )}

            {/* Nếu đang REJECTED: Nút Chuyển về chờ duyệt */}
            {currentChapter.status === "REJECTED" && onResetPending && (
              <button
                type="button"
                onClick={() => onResetPending(currentChapter)}
                className="px-4 py-2 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-admin-card"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Chuyển về chờ duyệt</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

