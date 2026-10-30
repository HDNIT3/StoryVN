"use client";

import React, { useEffect, useRef, useState } from "react";

export interface HomeSectionItem {
  id: string;
  label: string;
}

export const HOME_SECTIONS: HomeSectionItem[] = [
  { id: "noi-bat", label: "Nổi bật" },
  { id: "bang-xep-hang", label: "Bảng xếp hạng" },
  { id: "tac-gia-noi-bat", label: "Tác giả nổi bật" },
  { id: "truyen-moi-nhat", label: "Truyện mới nhất" },
  { id: "moi-cap-nhat", label: "Mới cập nhật" },
];

export function HomeSideNav() {
  const [activeSection, setActiveSection] = useState<string>("noi-bat");
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isNavHoveredRef = useRef<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      // 1. Hiện thanh khi bắt đầu cuộn
      setIsVisible(true);

      // Reset timer ẩn nếu đang cuộn liên tục
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      // 2. Sau 2s không cuộn (và chuột không rê vào) thì tự động ẩn
      hideTimerRef.current = setTimeout(() => {
        if (!isNavHoveredRef.current) {
          setIsVisible(false);
        }
      }, 2000);

      // 3. Tính toán section hiện tại
      const scrollPosition = window.scrollY + 200;

      for (let i = HOME_SECTIONS.length - 1; i >= 0; i--) {
        const section = document.getElementById(HOME_SECTIONS[i].id);
        if (section) {
          const top = section.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(HOME_SECTIONS[i].id);
            return;
          }
        }
      }
      setActiveSection(HOME_SECTIONS[0].id);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    isNavHoveredRef.current = true;
    setIsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
  };

  const handleMouseLeave = () => {
    isNavHoveredRef.current = false;
    setHoveredSection(null);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <nav
      aria-label="Điều hướng nhanh trang chủ"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed right-3 sm:right-5 lg:right-7 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center select-none transition-all duration-300 ease-out ${
        isVisible
          ? "opacity-100 translate-x-0 pointer-events-auto"
          : "opacity-0 translate-x-4 pointer-events-none"
      }`}
    >
      {/* Thanh ray dọc KHÔNG CÓ NỀN, chỉ có đường line nối và các chấm tròn */}
      <div className="relative flex flex-col items-center">
        {/* Đường nối dọc xuyên suốt các điểm */}
        <div
          aria-hidden="true"
          className="absolute top-3.5 bottom-3.5 w-[2px] bg-slate-200/90 pointer-events-none"
        />

        <div className="relative z-10 flex flex-col items-center gap-7">
          {HOME_SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const isHovered = hoveredSection === section.id;
            const showTooltip = isActive || isHovered;

            return (
              <div
                key={section.id}
                className="relative flex items-center justify-center group"
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                {/* Ô chữ (Badge) - TĂNG PADDING, ÍT BO GÓC (rounded-lg), NỀN TỐI NỔI BẬT */}
                <div
                  role="tooltip"
                  onClick={() => scrollTo(section.id)}
                  className={`absolute right-10 top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ease-out ${
                    showTooltip
                      ? "opacity-100 translate-x-0 pointer-events-auto"
                      : "opacity-0 translate-x-2 pointer-events-none"
                  }`}
                >
                  <div className="flex items-center gap-2.5 rounded-lg bg-[#0F172A] px-4.5 py-2.5 text-xs font-semibold text-white shadow-xl shadow-slate-950/25 ring-1 ring-white/10 whitespace-nowrap">
                    {/* Chấm tròn phát sáng */}
                    <span
                      className={`h-2 w-2 rounded-full transition-colors ${
                        isActive
                          ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)] animate-pulse"
                          : "bg-slate-400"
                      }`}
                    />
                    <span>{section.label}</span>
                  </div>
                </div>

                {/* Nút bấm tròn (Indicator dot) */}
                <button
                  type="button"
                  onClick={() => scrollTo(section.id)}
                  aria-label={`Chuyển tới phần ${section.label}`}
                  className="relative flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90 focus:outline-none"
                >
                  {isActive ? (
                    // Trạng thái đang chọn: Vòng tròn ngoài xanh + chấm xanh ở giữa (như ảnh mẫu)
                    <div className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-sky-500 bg-white shadow-[0_0_12px_-2px_rgba(14,165,233,0.5)]">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                    </div>
                  ) : (
                    // Trạng thái bình thường: Vòng viền xám nhạt + chấm xám ở giữa
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300/80 bg-white transition-all group-hover:border-slate-400 group-hover:scale-110 shadow-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 group-hover:bg-slate-600 transition-colors" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
