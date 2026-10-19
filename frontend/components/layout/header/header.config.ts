/**
 * Kiểu dữ liệu & cấu hình dùng chung cho Header.
 * Gom types + defaults + config menu tài khoản về một chỗ để tránh trùng lặp.
 */

// ─── Types ────────────────────────────────────────────────────────
export interface NavItem {
  id: string;
  label: string;
  href: string;
  isActive?: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  avatarUrl?: string;
  avatarInitial?: string;
  email?: string;
  role?: string;
}

export interface WalletInfo {
  coins: number;
  unit?: string;
  coinIconSrc?: string;
  onRechargeClick?: () => void;
}

export interface BookmarkInfo {
  count: number;
  iconSrc?: string;
  onClick?: () => void;
  href?: string;
}

export interface LogoProps {
  title?: string;
  suffix?: string;
  subtitle?: string;
  iconSrc?: string;
  href?: string;
  className?: string;
}

export interface HeaderSearchProps {
  placeholder?: string;
  iconSrc?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export interface HeaderActionsProps {
  isLoggedIn?: boolean;
  user?: UserProfile;
  wallet?: WalletInfo;
  bookmark?: BookmarkInfo;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onRechargeClick?: () => void;
  onBookmarkClick?: () => void;
  className?: string;
}

export interface HeaderProps {
  logo?: LogoProps;
  navItems?: NavItem[];
  activeNavId?: string;
  isLoggedIn?: boolean;
  user?: UserProfile;
  wallet?: WalletInfo;
  bookmark?: BookmarkInfo;
  search?: HeaderSearchProps;
  onNavItemClick?: (item: NavItem) => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  sticky?: boolean;
  className?: string;
}

// ─── Defaults ─────────────────────────────────────────────────────
export const DEFAULT_LOGO: LogoProps = {
  title: "Story",
  suffix: "VN",
  iconSrc: "/icon/iconweb.png",
  href: "/",
};

/** Chỉ giữ các mục trỏ tới route thực tế (đã loại các link 404). */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Trang Chủ", href: "/" },
  { id: "truyen", label: "Truyện", href: "/truyen" },
  { id: "tac-gia", label: "Tác Giả", href: "/tac-gia" },
];

export const DEFAULT_SEARCH: HeaderSearchProps = {
  placeholder: "Tìm tên truyện, tác giả...",
  iconSrc: "/icon/search.svg",
};

export const DEFAULT_WALLET: WalletInfo = {
  coins: 55,
  unit: "Xu",
  coinIconSrc: "/icon/coin.svg",
};

export const DEFAULT_BOOKMARK: BookmarkInfo = {
  count: 2,
  iconSrc: "/icon/bookmark.svg",
  href: "/tai-khoan/tu-truyen",
};

export const DEFAULT_USER: UserProfile = {
  name: "Hoàng",
  avatarInitial: "H",
  avatarUrl: "/image/avatar-h.svg",
  role: "Độc giả VIP",
};

// ─── Role & Menu tài khoản (dùng chung Desktop dropdown + Mobile drawer) ──
export const ROLE_LABEL: Record<string, string> = {
  USER: "Người dùng",
  AUTHOR: "Tác giả",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};

export const ROLE_COLOR: Record<string, string> = {
  USER: "text-zinc-600 bg-zinc-100",
  AUTHOR: "text-sky-600 bg-sky-50",
  MANAGER: "text-blue-600 bg-blue-50",
  ADMIN: "text-purple-600 bg-purple-50",
};

export interface AccountMenuItem {
  id: string;
  label: string;
  href: string;
  /** Đường dẫn `d` của icon SVG (mỗi nơi tự render với size riêng). */
  iconPath: string;
  /** Điều kiện hiển thị theo role (đã uppercase). */
  visibleFor: (roleKey: string) => boolean;
  /** Dùng tông màu xanh dương thay vì xanh sky. */
  isAdmin?: boolean;
}

export const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
  {
    id: "ho-so",
    label: "Hồ sơ cá nhân",
    href: "/ho-so",
    iconPath:
      "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    visibleFor: () => true,
  },
  {
    id: "lich-su-doc",
    label: "Lịch sử đọc",
    href: "/tai-khoan/lich-su",
    iconPath:
      "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    visibleFor: () => true,
  },
  {
    id: "quan-ly-tac-gia",
    label: "Quản lý tác giả",
    href: "/tac-gia/tong-quan",
    iconPath:
      "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    visibleFor: (r) => r === "AUTHOR",
  },
  {
    id: "bang-quan-ly",
    label: "Bảng quản lý",
    href: "/quan-ly/duyet-tac-gia",
    iconPath:
      "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    visibleFor: (r) => r === "ADMIN" || r === "MANAGER",
    isAdmin: true,
  },
  {
    id: "dang-ky-tac-gia",
    label: "Đăng ký tác giả",
    href: "/tac-gia/dang-ky",
    iconPath:
      "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    visibleFor: (r) => r === "USER",
  },
];

export const LOGOUT_ICON_PATH =
  "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1";
