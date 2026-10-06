"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import Image from "next/image";

/**
 * =====================================================================
 * ĐỊNH NGHĨA CẤU TRÚC MENU QUẢN TRỊ (ADMIN NAVIGATION)
 * =====================================================================
 */
export interface SubMenuItem {
  id: string;
  label: string;
  href: string;
  roles?: string[]; // Phân quyền xem submenu (ADMIN, MANAGER), bỏ trống = tất cả
  badge?: string | number; // Huy hiệu số hoặc text (VD: "Mới", 12)
}

export interface MenuGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  href?: string; // Nếu là menu đơn lẻ (không có menu con), bấm vào sẽ chuyển trang luôn
  subItems?: SubMenuItem[]; // Danh sách menu con
  badge?: string | number;
}

/**
 * =====================================================================
 * HƯỚNG DẪN THÊM MENU CON (SUBMENU) TRONG TƯƠNG LAI:
 * =====================================================================
 * 👉 Cách 1: Thêm menu con vào nhóm có sẵn (Quản lý hệ thống, Quản lý người dùng, Quản lý Truyện, Quản lý thanh toán)
 *    Chỉ cần thêm 1 object vào mảng `subItems` của nhóm đó:
 *    {
 *       id: "dinh-danh-duy-nhat",
 *       label: "Tên hiển thị menu con",
 *       href: "/quan-ly/duong-dan-cua-ban",
 *       roles: ["ADMIN", "MANAGER"], // (Tùy chọn)
 *       badge: "Mới",                // (Tùy chọn)
 *    }
 *
 * 👉 Cách 2: Thêm 1 nhóm quản lý lớn mới:
 *    Thêm 1 object vào mảng `ADMIN_NAVIGATION` bên dưới.
 * =====================================================================
 */
const ADMIN_NAVIGATION: MenuGroup[] = [
  {
    id: "quan-ly-he-thong",
    label: "Quản lý hệ thống",
    roles: ["ADMIN"],
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    subItems: [
      {
        id: "cai-dat-he-thong",
        label: "Cấu hình chung",
        href: "/quan-ly/he-thong",
        roles: ["ADMIN"],
      },
      {
        id: "thu-vien-media",
        label: "Thư viện ảnh & Media",
        href: "/quan-ly/media",
        roles: ["ADMIN"],
      },
      {
        id: "nhat-ky-he-thong",
        label: "Nhật ký hoạt động (Logs)",
        href: "/quan-ly/he-thong/nhat-ky",
        roles: ["ADMIN"],
      },
      {
        id: "sao-luu-du-lieu",
        label: "Sao lưu & Khôi phục",
        href: "/quan-ly/he-thong/sao-luu",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    id: "quan-ly-nguoi-dung",
    label: "Quản lý người dùng",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    subItems: [
      {
        id: "danh-sach-nguoi-dung",
        label: "Danh sách người dùng",
        href: "/quan-ly/nguoi-dung",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        id: "duyet-tac-gia",
        label: "Duyệt đơn tác giả",
        href: "/quan-ly/duyet-tac-gia",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        id: "phan-quyen-vai-tro",
        label: "Phân quyền & Vai trò",
        href: "/quan-ly/nguoi-dung/vai-tro",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    id: "quan-ly-truyen",
    label: "Quản lý Truyện",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    subItems: [
      {
        id: "danh-sach-truyen",
        label: "Tất cả truyện",
        href: "/quan-ly/truyen",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        id: "quan-ly-the-loai",
        label: "Quản lý thể loại",
        href: "/quan-ly/the-loai",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        id: "quan-ly-the-tag",
        label: "Quản lý thẻ tag",
        href: "/quan-ly/the-tag",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        id: "bao-cao-vi-pham",
        label: "Báo cáo & Vi phạm",
        href: "/quan-ly/truyen/bao-cao",
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    id: "quan-ly-thanh-toan",
    label: "Quản lý thanh toán",
    roles: ["ADMIN"],
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
    subItems: [
      {
        id: "lich-su-giao-dich",
        label: "Lịch sử giao dịch",
        href: "/quan-ly/thanh-toan/giao-dich",
        roles: ["ADMIN"],
      },
      {
        id: "yeu-cau-rut-tien",
        label: "Yêu cầu rút tiền",
        href: "/quan-ly/thanh-toan/rut-tien",
        roles: ["ADMIN"],
      },
      {
        id: "goi-nap-tien-te",
        label: "Gói nạp & Xu",
        href: "/quan-ly/thanh-toan/goi-nap",
        roles: ["ADMIN"],
      },
      {
        id: "thong-ke-doanh-thu",
        label: "Thống kê doanh thu",
        href: "/quan-ly/thanh-toan/doanh-thu",
        roles: ["ADMIN"],
      },
    ],
  },
];

function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Quản lý trạng thái đóng / mở của từng nhóm Menu (Accordion)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Tự động mở nhóm chứa đường dẫn đang được kích hoạt (active path)
  useEffect(() => {
    ADMIN_NAVIGATION.forEach((group) => {
      if (group.subItems) {
        const isChildActive = group.subItems.some((sub) =>
          pathname === sub.href || (sub.href !== "/quan-ly" && pathname.startsWith(sub.href))
        );
        if (isChildActive) {
          setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
        }
      }
    });
  }, [pathname]);

  // Lọc danh sách menu theo quyền của user
  const visibleGroups = ADMIN_NAVIGATION.filter(
    (group) => user && group.roles.includes(user.role)
  );

  const toggleGroup = (groupId: string) => {
    if (collapsed) {
      // Khi sidebar đang thu nhỏ, nhấp vào menu nhóm sẽ tự động mở rộng sidebar
      onToggle();
      setOpenGroups((prev) => ({ ...prev, [groupId]: true }));
      return;
    }
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleLogout = async () => {
    await logout();
    router.push("/dang-nhap");
  };

  const avatarInitial = user
    ? (user.displayName || user.username || "A").charAt(0).toUpperCase()
    : "A";

  const roleLabel: Record<string, string> = {
    ADMIN: "Quản trị viên",
    MANAGER: "Quản lý",
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-200"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full flex flex-col bg-white text-slate-700 border-r border-slate-200/80 transition-all duration-300 z-50 shadow-lg lg:shadow-xs ${
          /* Mobile: drawer overlay */
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${
          /* Desktop */
          collapsed ? "lg:w-20" : "lg:w-72"
        }`}
      >
        {/* Logo + Nút thu gọn / Đóng */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <Link
            href="/quan-ly/duyet-tac-gia"
            onClick={onMobileClose}
            className={`flex items-center gap-3 ${collapsed ? "lg:hidden" : ""}`}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs border border-slate-100">
              <Image src="/icon/iconweb.png" alt="StoryVN" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">
              Story<span className="text-sky-500">VN</span>{" "}
              <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-1 uppercase">
                {user?.role === "ADMIN" ? "Admin" : "Quản lý"}
              </span>
            </span>
          </Link>

          {collapsed && (
            <div className="hidden lg:flex w-10 h-10 rounded-xl overflow-hidden items-center justify-center mx-auto shadow-xs border border-slate-100">
              <Image src="/icon/iconweb.png" alt="StoryVN" width={40} height={40} className="object-cover w-full h-full" />
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggle}
            className={`hidden lg:flex text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 transition-colors cursor-pointer ${
              collapsed ? "mx-auto mt-2" : ""
            }`}
            aria-label="Thu gọn menu"
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 transition-colors cursor-pointer"
            aria-label="Đóng menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thông tin người dùng thu nhỏ */}
        {user && (
          <div className={`px-4 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70 ${collapsed ? "lg:hidden" : ""}`}>
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center text-base font-bold shrink-0 shadow-xs">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={40}
                  height={40}
                  className="rounded-xl object-cover"
                />
              ) : (
                avatarInitial
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
              <p className="text-xs text-sky-600 font-semibold mt-0.5">
                {roleLabel[user.role] || user.role}
              </p>
            </div>
          </div>
        )}

        {/* Danh sách điều hướng đa cấp (Menu & Submenu) */}
        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          <p className={`text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 ${collapsed ? "lg:px-2 lg:text-center px-4.5" : "px-4.5"}`}>
            {collapsed ? <span className="hidden lg:inline">·</span> : null}
            <span className={collapsed ? "lg:hidden" : ""}>
              {user?.role === "ADMIN" ? "Hệ Thống Quản Trị" : "Khu Vực Quản Lý"}
            </span>
          </p>

          <ul className="space-y-1.5 px-3">
            {visibleGroups.map((group) => {
              const hasSubItems = Boolean(group.subItems && group.subItems.length > 0);
              const isOpen = Boolean(openGroups[group.id]);

              // Kiểm tra xem nhóm này hoặc menu con của nó có đang active không
              const isGroupActive = hasSubItems
                ? group.subItems?.some(
                    (sub) => pathname === sub.href || (sub.href !== "/quan-ly" && pathname.startsWith(sub.href))
                  )
                : group.href && pathname.startsWith(group.href);

              return (
                <li key={group.id} className="relative">
                  {hasSubItems ? (
                    /* Nhóm có menu con: Button toggle accordion */
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer select-none ${
                          isGroupActive
                            ? "bg-sky-50 text-sky-800 font-bold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                        title={collapsed ? group.label : undefined}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className={`shrink-0 transition-colors ${
                              isGroupActive ? "text-sky-600" : "text-slate-500"
                            }`}
                          >
                            {group.icon}
                          </span>
                          <span className={`truncate text-left ${collapsed ? "lg:hidden" : ""}`}>
                            {group.label}
                          </span>
                        </div>

                        {/* Mũi tên mở rộng/thu gọn và badge (ẩn khi collapsed trên desktop) */}
                        <div className={`flex items-center gap-1.5 ${collapsed ? "lg:hidden" : ""}`}>
                          {group.badge && (
                            <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full">
                              {group.badge}
                            </span>
                          )}
                          <svg
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                              isOpen ? "rotate-90 text-sky-600" : "rotate-0"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>

                      {/* Danh sách MENU CON (Submenu) */}
                      {isOpen && !collapsed && (
                        <ul className="mt-1 ml-4 pl-3.5 border-l-2 border-slate-200/90 space-y-1 py-1 animate-in fade-in duration-200">
                          {group.subItems
                            ?.filter(
                              (sub) => !sub.roles || (user && sub.roles.includes(user.role))
                            )
                            .map((sub) => {
                              const isSubActive =
                                pathname === sub.href ||
                                (sub.href !== "/quan-ly" && pathname.startsWith(sub.href));

                              return (
                                <li key={sub.id}>
                                  <Link
                                    href={sub.href}
                                    onClick={onMobileClose}
                                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all group/item ${
                                      isSubActive
                                        ? "bg-sky-500 text-white font-bold shadow-xs shadow-sky-500/20"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/90"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                          isSubActive
                                            ? "bg-white"
                                            : "bg-slate-300 group-hover/item:bg-sky-400"
                                        }`}
                                      />
                                      <span className="truncate">{sub.label}</span>
                                    </div>

                                    {sub.badge && (
                                      <span
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-1 shrink-0 ${
                                          isSubActive
                                            ? "bg-white/20 text-white"
                                            : "bg-sky-100 text-sky-700"
                                        }`}
                                      >
                                        {sub.badge}
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    /* Nhóm đơn lẻ không có menu con: Link chuyển trang trực tiếp */
                    <Link
                      href={group.href || "/quan-ly"}
                      onClick={onMobileClose}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isGroupActive
                          ? "bg-sky-500 text-white font-bold shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      title={collapsed ? group.label : undefined}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="shrink-0">{group.icon}</span>
                        <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
                          {group.label}
                        </span>
                      </div>
                      {group.badge && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isGroupActive
                              ? "bg-white/20 text-white"
                              : "bg-sky-100 text-sky-700"
                          } ${collapsed ? "lg:hidden" : ""}`}
                        >
                          {group.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Phân cách */}
          <div className="mx-4 my-4 border-t border-slate-100" />

          {/* Menu tài khoản cá nhân */}
          <p className={`text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 ${collapsed ? "lg:px-2 lg:text-center px-4.5" : "px-4.5"}`}>
            {collapsed ? <span className="hidden lg:inline">·</span> : null}
            <span className={collapsed ? "lg:hidden" : ""}>Tài khoản</span>
          </p>
          <ul className="space-y-1.5 px-3">
            <li>
              <Link
                href="/ho-so"
                onClick={onMobileClose}
                className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                title={collapsed ? "Hồ sơ cá nhân" : undefined}
              >
                <svg className="w-5 h-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className={collapsed ? "lg:hidden" : ""}>Hồ sơ cá nhân</span>
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  onMobileClose();
                  handleLogout();
                }}
                className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                title={collapsed ? "Đăng xuất" : undefined}
              >
                <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className={collapsed ? "lg:hidden" : ""}>Đăng xuất</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default function QuanLyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setRedirecting(true);
        router.replace(
          `/dang-nhap?returnUrl=${encodeURIComponent(window.location.pathname)}`
        );
      } else if (user && user.role !== "ADMIN" && user.role !== "MANAGER") {
        setRedirecting(true);
        router.replace("/ho-so");
      } else if (user && user.role === "MANAGER") {
        const isAdminOnlyRoute =
          pathname.startsWith("/quan-ly/he-thong") ||
          pathname.startsWith("/quan-ly/media") ||
          pathname.startsWith("/quan-ly/thanh-toan") ||
          pathname.startsWith("/quan-ly/nguoi-dung/vai-tro");
        if (isAdminOnlyRoute) {
          setRedirecting(true);
          router.replace("/quan-ly/duyet-tac-gia");
        } else {
          setRedirecting(false);
        }
      } else {
        setRedirecting(false);
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 max-w-xs w-full text-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">
            {redirecting ? "Đang chuyển hướng..." : "Đang tải dữ liệu..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return null;

  if (user.role === "MANAGER") {
    const isAdminOnlyRoute =
      pathname.startsWith("/quan-ly/he-thong") ||
      pathname.startsWith("/quan-ly/media") ||
      pathname.startsWith("/quan-ly/thanh-toan") ||
      pathname.startsWith("/quan-ly/nguoi-dung/vai-tro");
    if (isAdminOnlyRoute) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 max-w-xs w-full text-center">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Đang chuyển hướng...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex text-slate-800">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-72"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          {/* Mobile hamburger + Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
              aria-label="Mở menu điều hướng"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {user.role === "ADMIN" ? "Bảng Quản trị Hệ thống" : "Bảng Quản lý Nội dung"}
              </h2>
              <p className="hidden xs:block text-[11px] text-slate-500 mt-0.5 truncate">
                StoryVN Management Portal
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 hover:bg-sky-50/50 hover:border-sky-200 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden xs:inline">Về trang chủ</span>
              <span className="xs:hidden">Trang chủ</span>
            </Link>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-500 flex items-center justify-center text-xs sm:text-base font-bold text-white shadow-xs shrink-0">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={40}
                  height={40}
                  className="rounded-xl object-cover w-full h-full"
                />
              ) : (
                (user.displayName || "A").charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </header>

        {/* Main page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
