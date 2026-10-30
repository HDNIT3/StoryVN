import React from "react";
import Link from "next/link";
import { ChapterItem } from "@/features/chapters";
import { StatusBadge } from "./StatusBadge";

interface AuthorChapterTableProps {
  chapters: ChapterItem[];
  isLoading: boolean;
  searchKeyword: string;
  statusFilter: string;
  selectedIds: string[];
  isAllSelected: boolean;
  currentStorySlugOrId: string;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onPreview: (chapter: ChapterItem) => void;
  onQuickSubmitReview: (chapter: ChapterItem) => void;
  onDelete: (chapter: ChapterItem) => void;
}

export function AuthorChapterTable({
  chapters,
  isLoading,
  searchKeyword,
  statusFilter,
  selectedIds,
  isAllSelected,
  currentStorySlugOrId,
  onToggleSelectAll,
  onToggleSelect,
  onPreview,
  onQuickSubmitReview,
  onDelete,
}: AuthorChapterTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-zinc-100 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="p-10 sm:p-14 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-sm sm:text-base font-bold text-zinc-900">Chưa có chương truyện nào</h3>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm mb-4">
          {searchKeyword || statusFilter !== "ALL"
            ? "Không tìm thấy chương nào thỏa mãn bộ lọc hiện tại."
            : "Bắt đầu soạn thảo chương đầu tiên cho tác phẩm của bạn."}
        </p>
        <Link
          href={`/tac-gia/chuong-truyen/them-moi?story=${currentStorySlugOrId}`}
          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-xs"
        >
          + Thêm chương mới
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[850px]">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <th className="py-3 px-3 w-10 text-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-zinc-300 cursor-pointer"
                title="Chọn tất cả các chương có thể gửi duyệt"
              />
            </th>
            <th className="py-3 px-4 w-16 text-center">Chương</th>
            <th className="py-3 px-4">Tiêu đề chương</th>
            <th className="py-3 px-4 w-36">Trạng thái</th>
            <th className="py-3 px-4 w-36">Cấu hình xu</th>
            <th className="py-3 px-4 w-24 text-center">Số từ</th>
            <th className="py-3 px-4 w-28 text-center">Lượt xem</th>
            <th className="py-3 px-4 w-32">Cập nhật</th>
            <th className="py-3 px-4 w-48 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 text-sm">
          {chapters.map((chapter) => {
            const chId = chapter._id || chapter.id || "";
            const isSelected = selectedIds.includes(chId);
            const canSubmit =
              chapter.status === "DRAFT" ||
              chapter.status === "REJECTED" ||
              (chapter.status === "PUBLISHED" &&
                (chapter as any).pendingRevision &&
                ((chapter as any).pendingRevision.status === "DRAFT" ||
                  (chapter as any).pendingRevision.status === "REJECTED"));

            return (
              <tr
                key={chId}
                className={`transition ${isSelected ? "bg-sky-50/60" : "hover:bg-zinc-50/80"}`}
              >
                {/* Checkbox */}
                <td className="py-3.5 px-3 text-center">
                  {canSubmit ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(chId)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-zinc-300 cursor-pointer"
                    />
                  ) : (
                    <span className="w-4 h-4 inline-block text-zinc-300 cursor-not-allowed">•</span>
                  )}
                </td>

                {/* Chapter Number */}
                <td className="py-3.5 px-4 font-bold text-zinc-800 text-center">
                  <span className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center mx-auto text-xs font-bold text-zinc-700">
                    #{chapter.chapterNumber}
                  </span>
                </td>

                {/* Title */}
                <td className="py-3.5 px-4 font-medium text-zinc-900">
                  <button
                    type="button"
                    onClick={() => onPreview(chapter)}
                    className="hover:text-sky-600 text-left line-clamp-1 transition font-medium cursor-pointer"
                  >
                    {chapter.title}
                  </button>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <StatusBadge
                    status={chapter.status}
                    rejectReason={chapter.rejectReason}
                    pendingRevision={(chapter as any).pendingRevision}
                  />
                </td>

                {/* Coin Config */}
                <td className="py-3.5 px-4">
                  {chapter.isFree ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Miễn phí
                    </span>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {chapter.coinPrice} xu
                      </span>
                      {chapter.requirePreviousChapter && (
                        <span className="text-[10px] text-zinc-500 font-medium">
                          Mua tuần tự
                        </span>
                      )}
                    </div>
                  )}
                </td>

                {/* Word Count */}
                <td className="py-3.5 px-4 text-center font-medium text-zinc-600 text-xs">
                  {(chapter.wordCount || 0).toLocaleString("vi-VN")}
                </td>

                {/* View Count */}
                <td className="py-3.5 px-4 text-center font-medium text-zinc-600 text-xs">
                  {(chapter.viewCount || 0).toLocaleString("vi-VN")}
                </td>

                {/* Updated Date */}
                <td className="py-3.5 px-4 text-xs text-zinc-500">
                  {new Date(chapter.updatedAt).toLocaleDateString("vi-VN")}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* History link */}
                    <Link
                      href={`/tac-gia/chuong-truyen/lich-su?story=${currentStorySlugOrId}&chapter=${chapter.chapterNumber}`}
                      className="p-1.5 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white transition shadow-2xs cursor-pointer"
                      title="Lịch sử chỉnh sửa chương"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>

                    {/* Preview button */}
                    <button
                      type="button"
                      onClick={() => onPreview(chapter)}
                      className="p-1.5 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white transition shadow-2xs cursor-pointer"
                      title="Xem trước nội dung"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    {/* Edit button */}
                    <Link
                      href={`/tac-gia/chuong-truyen/chinh-sua/${chId}`}
                      className="p-1.5 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white transition shadow-2xs cursor-pointer"
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
                        onClick={() => onQuickSubmitReview(chapter)}
                        className="p-1.5 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white transition shadow-2xs cursor-pointer"
                        title="Gửi duyệt ngay"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}

                    {/* Delete button (only non-published) */}
                    {chapter.status !== "PUBLISHED" ? (
                      <button
                        type="button"
                        onClick={() => onDelete(chapter)}
                        className="p-1.5 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white transition shadow-2xs cursor-pointer"
                        title="Xóa chương"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    ) : (
                      <span
                        className="p-1.5 rounded-md border border-zinc-200 bg-zinc-50 text-zinc-300 cursor-not-allowed"
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
