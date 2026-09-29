import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full bg-zinc-900 text-zinc-400 text-sm border-t border-zinc-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand info */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 p-1 flex items-center justify-center">
                <Image
                  src="/image/logo-icon.svg"
                  alt="StoryVN"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white leading-none">
                  Story<span className="text-orange-500 ml-0.5">VN</span>
                </span>
                <span className="text-[9px] font-semibold text-zinc-500 mt-1 tracking-wider uppercase">
                  Tiểu thuyết trực tuyến
                </span>
              </div>
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed">
              StoryVN là nền tảng đọc truyện chữ, truyện dịch online miễn phí chất lượng cao với hàng ngàn bộ truyện tiên hiệp, huyền huyễn, đô thị được cập nhật liên tục mỗi ngày.
            </p>
          </div>

          {/* Col 2: Thể loại */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              Thể Loại Nổi Bật
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-xs">
              <li>
                <span className="hover:text-orange-400 transition-colors cursor-pointer">
                  Tiên Hiệp
                </span>
              </li>
              <li>
                <span className="hover:text-orange-400 transition-colors cursor-pointer">
                  Huyền Huyễn
                </span>
              </li>
              <li>
                <span className="hover:text-orange-400 transition-colors cursor-pointer">
                  Đô Thị
                </span>
              </li>
              <li>
                <span className="hover:text-orange-400 transition-colors cursor-pointer">
                  Ngôn Tình
                </span>
              </li>
              <li>
                <span className="hover:text-orange-400 transition-colors cursor-pointer">
                  Trọng Sinh
                </span>
              </li>
              <li>
                <span className="hover:text-orange-400 transition-colors cursor-pointer">
                  Kiếm Hiệp
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Điều hướng nhanh */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              Điều Hướng
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-orange-400 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/dang-nhap" className="hover:text-orange-400 transition-colors">
                  Đăng nhập tài khoản
                </Link>
              </li>
              <li>
                <Link href="/dang-ky" className="hover:text-orange-400 transition-colors">
                  Đăng ký thành viên
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Hỗ trợ & Thông tin */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              Hỗ Trợ & Chính Sách
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="hover:text-orange-400 cursor-pointer transition-colors">
                  Điều khoản dịch vụ
                </span>
              </li>
              <li>
                <span className="hover:text-orange-400 cursor-pointer transition-colors">
                  Chính sách bảo mật
                </span>
              </li>
              <li>
                <span className="hover:text-orange-400 cursor-pointer transition-colors">
                  Quy định bản quyền
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} StoryVN. Bản quyền thuộc về tác giả và dịch giả.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
