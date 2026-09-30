import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar: Brand Logo & Back to Home Link */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs flex items-center justify-center border border-zinc-100 group-hover:scale-105 transition-transform">
            <Image
              src="/icon/iconweb.png"
              alt="StoryVN"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="text-2xl font-black tracking-tight text-zinc-900">
            Story<span className="text-sky-500 ml-0.5">VN</span>
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-sky-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
        >
          <span>←</span>
          <span>Về trang chủ</span>
        </Link>
      </header>

      {/* Main Form Center Card */}
      <main className="my-auto flex items-center justify-center py-6 sm:py-10">
        <div className="w-full max-w-lg">{children}</div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="text-center text-xs text-zinc-400 py-4">
        <p>© {new Date().getFullYear()} StoryVN. Tất cả các quyền được bảo lưu.</p>
      </footer>
    </div>
  );
}
