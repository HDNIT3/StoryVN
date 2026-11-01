import React from "react";
import Link from "next/link";

export function NotFoundView() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#fafaf8] px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-2xl font-black text-sky-600">
          404
        </div>
        <h1 className="mb-2 text-xl font-bold text-zinc-900">
          Không tìm thấy trang
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Đường dẫn bạn truy cập không tồn tại, đã bị đổi hoặc nội dung chưa được
          xuất bản công khai.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
          >
            Về trang chủ
          </Link>
          <Link
            href="/truyen"
            className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            Khám phá truyện
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundView;
