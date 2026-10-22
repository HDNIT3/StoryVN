import { Suspense } from "react";
import { AuthorChapterHistoryView } from "@/features/author";

export default function LichSuChinhSuaPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 py-12 text-center text-xs text-zinc-500">
          Đang tải lịch sử chỉnh sửa...
        </div>
      }
    >
      <AuthorChapterHistoryView />
    </Suspense>
  );
}
