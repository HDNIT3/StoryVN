import { Suspense } from "react";
import type { Metadata } from "next";
import { WalletView } from "@/features/wallet";

export const metadata: Metadata = {
  title: "Ví của tôi - StoryVN",
  description:
    "Xem số dư Xu, lịch sử Nạp Xu và lịch sử Tiêu Xu mở khóa chương truyện trên StoryVN",
};

export default function ViPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-56 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-32 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
            <div className="h-32 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
          </div>
        </div>
      }
    >
      <WalletView />
    </Suspense>
  );
}
