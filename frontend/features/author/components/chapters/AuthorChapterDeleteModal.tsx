import React from "react";
import { ChapterItem } from "@/features/chapters";

interface AuthorChapterDeleteModalProps {
  chapterToDelete: ChapterItem | null;
  chapters: ChapterItem[];
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function AuthorChapterDeleteModal({
  chapterToDelete,
  chapters,
  isPending,
  onConfirm,
  onClose,
}: AuthorChapterDeleteModalProps) {
  if (!chapterToDelete) return null;

  const subsequentChapters = chapters.filter(
    (c) => c.chapterNumber > chapterToDelete.chapterNumber
  );
  const hasPublishedLaterChapter = subsequentChapters.some(
    (c) => c.status === "PUBLISHED"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-zinc-200 shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-zinc-900">Xác nhận xóa chương?</h3>
        <p className="text-xs text-zinc-500 mt-1 mb-4">
          Bạn có chắc chắn muốn xóa{" "}
          <strong>
            Chương #{chapterToDelete.chapterNumber}: {chapterToDelete.title}
          </strong>
          ? Thao tác này không thể hoàn tác.
        </p>

        {/* Warning if subsequent chapter is published */}
        {hasPublishedLaterChapter ? (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-md text-left text-xs text-rose-800">
            <span className="font-semibold block mb-0.5">Không thể xóa:</span>
            Đã có chương phía sau được xuất bản. Vui lòng gỡ duyệt các chương sau trước khi xóa chương này.
          </div>
        ) : subsequentChapters.length > 0 ? (
          /* Notice about auto shift-up (dồn lên) */
          <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-left text-xs text-amber-900">
            <span className="font-semibold block mb-0.5">Tự động dồn thứ tự:</span>
            Đang có <strong>{subsequentChapters.length}</strong> chương phía sau. Sau khi xóa, hệ thống sẽ tự động dồn số thứ tự các chương sau lên 1 bậc để đảm bảo mạch truyện liên tục.
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isPending || hasPublishedLaterChapter}
            onClick={onConfirm}
            className="flex-1 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
          </button>
        </div>
      </div>
    </div>
  );
}
