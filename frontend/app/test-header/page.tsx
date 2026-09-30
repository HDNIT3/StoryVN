import { Metadata } from "next";
import { SmartHeader } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Test Header Component — StoryVN",
  description: "Trang kiểm thử component Header",
};

export default function TestHeaderRoute() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <SmartHeader />
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-zinc-800">Trang thử nghiệm Header</h1>
        <p className="text-zinc-500 mt-2">Header được hiển thị ở trên cùng.</p>
      </div>
    </div>
  );
}

