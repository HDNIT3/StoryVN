import React from "react";
import { ChapterItem } from "@/features/chapters";

interface AuthorChapterReorderModalProps {
  isOpen: boolean;
  reorderList: ChapterItem[];
  isPending: boolean;
  onMoveChapter: (index: number, direction: "up" | "down") => void;
  onSave: () => void;
  onClose: () => void;
}

export function AuthorChapterReorderModal({
  isOpen,
  reorderList,
  isPending,
  onMoveChapter,
  onSave,
  onClose,
}: AuthorChapterReorderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg border border-zinc-200 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-base font-bold text-zinc-900">Sắp xếp lại thứ tự chương</h3>
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

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          <p className="text-xs text-zinc-500 mb-3">
            Sử dụng nút mũi tên Lên/Xuống để điều chỉnh vị trí hiển thị các chương trong truyện:
          </p>
          {reorderList.map((c, index) => (
            <div
              key={c._id || c.id}
              className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-semibold text-zinc-800"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 font-bold shrink-0">
                  {index + 1}
                </span>
                <span className="truncate">{c.title}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMoveChapter(index, "up")}
                  className="p-1 rounded hover:bg-zinc-200 disabled:opacity-30 transition cursor-pointer"
                  title="Di chuyển lên"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === reorderList.length - 1}
                  onClick={() => onMoveChapter(index, "down")}
                  className="p-1 rounded hover:bg-zinc-200 disabled:opacity-30 transition cursor-pointer"
                  title="Di chuyển xuống"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-2.5 bg-zinc-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-100 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Đang lưu..." : "Lưu thứ tự"}
          </button>
        </div>
      </div>
    </div>
  );
}
