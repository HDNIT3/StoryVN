import type { Metadata } from "next";
import { SmartHeader } from "@/components/layout/header";
import { Footer } from "@/components/layout/Footer";
import { NotFoundView } from "@/components/layout/NotFoundView";

export const metadata: Metadata = {
  title: "Không tìm thấy trang | StoryVN",
  robots: { index: false, follow: false },
};

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white">
      <SmartHeader />
      <main className="w-full flex-1 overflow-x-hidden">
        <NotFoundView />
      </main>
      <Footer />
    </div>
  );
}
