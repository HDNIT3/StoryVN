import { Suspense } from "react";
import { PublicStoriesListView } from "@/features/stories";

export default function StoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafaf8] py-8 flex items-center justify-center">
          <div className="text-sm text-zinc-500 animate-pulse">
            Đang tải danh sách truyện...
          </div>
        </div>
      }
    >
      <PublicStoriesListView />
    </Suspense>
  );
}
