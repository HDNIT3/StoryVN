import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-20 w-full border-t border-slate-200/80 bg-gradient-to-b from-white/90 via-slate-50/50 to-slate-100/60 text-slate-500 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Col 1: Brand info */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3.5 group">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/80 shadow-[0_10px_30px_-16px_rgba(14,165,233,0.9)] ring-1 ring-slate-100 group-hover:scale-105 transition-transform">
                <Image
                  src="/icon/iconweb.png"
                  alt="StoryVN"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold leading-none tracking-tight text-slate-900 sm:text-3xl">
                  Story
                  <span className="ml-0.5 bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
                    VN
                  </span>
                </span>
                <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tiểu thuyết trực tuyến
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-600">
              StoryVN là nền tảng đọc truyện chữ, truyện dịch online miễn phí chất
              lượng cao với hàng ngàn bộ truyện tiên hiệp, huyền huyễn, đô thị được
              cập nhật liên tục mỗi ngày.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đọc không giới hạn
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                Hỗ trợ audio TTS
              </span>
            </div>
          </div>

          {/* Col 2: Thể loại */}
          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Thể Loại Nổi Bật
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                "Tiên Hiệp",
                "Huyền Huyễn",
                "Đô Thị",
                "Ngôn Tình",
                "Trọng Sinh",
                "Kiếm Hiệp",
                "Khoa Huyễn",
                "Dị Năng",
              ].map((genre) => (
                <Link
                  key={genre}
                  href={`/truyen?search=${encodeURIComponent(genre)}`}
                  className="rounded-lg px-2.5 py-1 bg-white border border-slate-200/80 text-slate-600 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 shadow-2xs font-medium"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 3: Điều hướng nhanh */}
          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Khám Phá
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-sky-600 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link
                  href="/truyen"
                  className="transition-colors hover:text-sky-600 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Tất cả tác phẩm
                </Link>
              </li>
              <li>
                <Link
                  href="/nap-xu"
                  className="transition-colors hover:text-sky-600 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Nạp Xu StoryVN
                </Link>
              </li>
              <li>
                <Link
                  href="/tac-gia/dang-ky"
                  className="transition-colors hover:text-sky-600 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Gia nhập Tác giả
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Hỗ trợ & Thông tin */}
          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Hỗ Trợ &amp; Chính Sách
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link
                  href="/dieu-khoan-dich-vu"
                  className="transition-colors hover:text-sky-600 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link
                  href="/chinh-sach-bao-mat"
                  className="transition-colors hover:text-sky-600 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  href="/ban-quyen"
                  className="transition-colors hover:text-sky-600 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Quy định bản quyền
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 text-sm text-slate-500 sm:flex-row">
          <p className="text-xs sm:text-sm">
            © {new Date().getFullYear()} StoryVN. Bản quyền thuộc về tác giả và dịch giả.
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Phát triển bởi nhóm sinh viên SPKT (HCMUTE)
          </p>
        </div>

        {/* Dòng miễn trừ trách nhiệm phục vụ đồ án SPKT */}
        <div className="mt-3 text-center border-t border-slate-200/50 pt-3">
          <p className="text-[11px] text-slate-400">
            Lưu ý: Đây là website đồ án phục vụ mục đích học tập, không có giá trị thương mại.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
