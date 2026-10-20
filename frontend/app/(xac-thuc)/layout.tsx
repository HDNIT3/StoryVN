import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/layout/Footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      {/* Top Bar: Brand Logo & Back to Home Link */}
      <header className="w-full bg-white border-b border-zinc-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-100 shadow-2xs">
              <Image
                src="/icon/iconweb.png"
                alt="StoryVN"
                width={36}
                height={36}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
              Story<span className="text-sky-500 ml-0.5">VN</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-sky-600 hover:bg-sky-50/70 transition-colors px-3 py-2 rounded-lg"
          >
            <span>←</span>
            <span>Về trang chủ</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area: cuộn trang tự nhiên, không bị bó cứng trong 1 khung tràn */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="w-full max-w-xl">{children}</div>
      </main>

      {/* Site Footer */}
      <Footer />
    </div>
  );
}
