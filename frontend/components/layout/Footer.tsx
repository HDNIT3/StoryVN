import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full bg-zinc-900 text-zinc-300 text-base border-t border-zinc-800 mt-20">
      <div className="w-full px-4 sm:px-8 md:px-10 lg:px-12 xl:px-16 2xl:px-20 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand info */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center border border-zinc-800">
                <Image
                  src="/icon/iconweb.png"
                  alt="StoryVN"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
                  Story<span className="text-sky-400 ml-0.5">VN</span>
                </span>
                <span className="text-[11px] font-bold text-zinc-400 mt-1 tracking-wider uppercase">
                  Tiểu thuyết trực tuyến
                </span>
              </div>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed">
              StoryVN là nền tảng đọc truyện chữ, truyện dịch online miễn phí chất lượng cao với hàng ngàn bộ truyện tiên hiệp, huyền huyễn, đô thị được cập nhật liên tục mỗi ngày.
            </p>
          </div>

          {/* Col 2: Thể loại */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 tracking-wide uppercase">
              Thể Loại Nổi Bật
            </h4>
            <ul className="grid grid-cols-2 gap-2.5 text-sm">
              <li>
                <span className="hover:text-sky-400 transition-colors cursor-pointer">
                  Tiên Hiệp
                </span>
              </li>
              <li>
                <span className="hover:text-sky-400 transition-colors cursor-pointer">
                  Huyền Huyễn
                </span>
              </li>
              <li>
                <span className="hover:text-sky-400 transition-colors cursor-pointer">
                  Đô Thị
                </span>
              </li>
              <li>
                <span className="hover:text-sky-400 transition-colors cursor-pointer">
                  Ngôn Tình
                </span>
              </li>
              <li>
                <span className="hover:text-sky-400 transition-colors cursor-pointer">
                  Trọng Sinh
                </span>
              </li>
              <li>
                <span className="hover:text-sky-400 transition-colors cursor-pointer">
                  Kiếm Hiệp
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Điều hướng nhanh */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 tracking-wide uppercase">
              Điều Hướng
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-sky-400 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/dang-nhap" className="hover:text-sky-400 transition-colors">
                  Đăng nhập tài khoản
                </Link>
              </li>
              <li>
                <Link href="/dang-ky" className="hover:text-sky-400 transition-colors">
                  Đăng ký thành viên
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Hỗ trợ & Thông tin */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 tracking-wide uppercase">
              Hỗ Trợ & Chính Sách
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="hover:text-sky-400 cursor-pointer transition-colors">
                  Điều khoản dịch vụ
                </span>
              </li>
              <li>
                <span className="hover:text-sky-400 cursor-pointer transition-colors">
                  Chính sách bảo mật
                </span>
              </li>
              <li>
                <span className="hover:text-sky-400 cursor-pointer transition-colors">
                  Quy định bản quyền
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <p>© {new Date().getFullYear()} StoryVN. Bản quyền thuộc về tác giả và dịch giả.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
