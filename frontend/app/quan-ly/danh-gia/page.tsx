import { Suspense } from "react";
import { AdminRatingsView } from "@/features/admin";

export const metadata = {
  title: "Quản lý đánh giá - StoryVN Quản trị",
  description: "Trang quản trị và kiểm duyệt đánh giá StoryVN",
};

export default function QuanLyDanhGiaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky-500 border-t-transparent" />
          <p className="mt-2 text-sm text-slate-500">Đang tải trang quản lý đánh giá...</p>
        </div>
      }
    >
      <AdminRatingsView />
    </Suspense>
  );
}

