import React, { Suspense } from "react";
import type { Metadata } from "next";
import { SupportCenterView } from "@/features/support/components/SupportCenterView";

export const metadata: Metadata = {
  title: "Trung Tâm Hỗ Trợ & Báo Cáo Vi Phạm | StoryVN",
  description:
    "Giải đáp thắc mắc, hướng dẫn sử dụng, hỗ trợ tài khoản, nạp Xu và tố cáo nội dung vi phạm tại StoryVN.",
};

export default function HoTroPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-sm text-slate-400">Đang tải trung tâm hỗ trợ...</div>
        </div>
      }
    >
      <SupportCenterView />
    </Suspense>
  );
}
