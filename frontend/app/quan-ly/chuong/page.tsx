import { Suspense } from "react";
import { AdminChaptersView } from "@/features/admin";

export default function QuanLyChuongPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky-500 border-t-transparent" />
          <p className="mt-2 text-sm text-slate-500">Đang tải trang quản lý chương...</p>
        </div>
      }
    >
      <AdminChaptersView />
    </Suspense>
  );
}
