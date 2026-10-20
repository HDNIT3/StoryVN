import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-20 w-full border-t border-slate-100 bg-white/80 text-slate-500 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Col 1: Brand info */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/80 shadow-[0_10px_30px_-16px_rgba(14,165,233,0.9)] ring-1 ring-slate-100">
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
                  <span className="ml-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                    VN
                  </span>
                </span>
                <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tiểu thuyết trực tuyến
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-500">
              StoryVN là nền tảng đọc truyện chữ, truyện dịch online miễn phí chất
              lượng cao với hàng ngàn bộ truyện tiên hiệp, huyền huyễn, đô thị được
              cập nhật liên tục mỗi ngày.
            </p>
          </div>

          {/* Col 2: Thể loại */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Thể Loại Nổi Bật
            </h4>
            <ul className="grid grid-cols-2 gap-2.5 text-sm">
              {[
                "Tiên Hiệp",
                "Huyền Huyễn",
                "Đô Thị",
                "Ngôn Tình",
                "Trọng Sinh",
                "Kiếm Hiệp",
              ].map((genre) => (
                <li key={genre}>
                  <span className="cursor-pointer rounded-md px-1.5 py-0.5 text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-600">
                    {genre}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Điều hướng nhanh */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Điều Hướng
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-sky-600"
                >
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link
                  href="/dang-nhap"
                  className="transition-colors hover:text-sky-600"
                >
                  Đăng nhập tài khoản
                </Link>
              </li>
              <li>
                <Link
                  href="/dang-ky"
                  className="transition-colors hover:text-sky-600"
                >
                  Đăng ký thành viên
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Hỗ trợ & Thông tin */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Hỗ Trợ &amp; Chính Sách
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                "Điều khoản dịch vụ",
                "Chính sách bảo mật",
                "Quy định bản quyền",
              ].map((item) => (
                <li key={item}>
                  <span className="cursor-pointer transition-colors hover:text-sky-600">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-sm text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} StoryVN. Bản quyền thuộc về tác giả và
            dịch giả.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
