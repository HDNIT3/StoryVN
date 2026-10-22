import { Suspense } from "react";
import { AuthorChaptersListView } from "@/features/author";

export default function ChuongTruyenPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthorChaptersListView />
    </Suspense>
  );
}
