import React from "react";
import Link from "next/link";
import { ChapterUpdateItem } from "@/features/chapters";

interface RevisionDetailViewerProps {
  selectedRevision: ChapterUpdateItem | null;
}

export function RevisionDetailViewer({ selectedRevision }: RevisionDetailViewerProps) {
  if (!selectedRevision) {
    return (
      <div className="p-12 text-center text-xs text-zinc-400 flex flex-col items-center justify-center h-full">
        <span>Chọn một bản sửa đổi bên trái để xem chi tiết.</span>
      </div>
    );
  }

  const storyTitle =
    typeof selectedRevision.storyId === "object"
      ? (selectedRevision.storyId as any).title
      : "Tác phẩm";

  const chapterNumber =
    typeof selectedRevision.chapterId === "object"
      ? (selectedRevision.chapterId as any).chapterNumber
      : null;

  const chapterId =
    typeof selectedRevision.chapterId === "object"
      ? (selectedRevision.chapterId as any)._id
      : selectedRevision.chapterId;

  return (
    <div className="flex flex-col h-[750px]">
      {/* Header of Detail */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-600 mb-1">
              <span>{storyTitle}</span>
              <span>•</span>
              <span>{chapterNumber ? `Chương #${chapterNumber}` : "Chương"}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
              {selectedRevision.title}
            </h2>
          </div>

          {/* Action button to open chapter editor */}
          {chapterId && (
            <Link
              href={`/tac-gia/chuong-truyen/chinh-sua/${chapterId}`}
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
                ? (selectedRevision.reviewerId as any).displayName || (selectedRevision.reviewerId as any).username
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
  );
}
