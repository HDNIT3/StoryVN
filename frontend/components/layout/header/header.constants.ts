import {
  GenreItem,
  NavItem,
  UserProfile,
  WalletInfo,
  BookmarkInfo,
  LogoProps,
  HeaderSearchProps,
} from "./header.types";

export const DEFAULT_LOGO: LogoProps = {
  title: "Story",
  suffix: "VN",
  subtitle: "TIỂU THUYẾT TRỰC TUYẾN",
  iconSrc: "/icon/iconweb.png",
  href: "/",
};

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Trang Chủ", href: "/" },
  {
    id: "the-loai",
    label: "Thể Loại",
    href: "/the-loai",
    hasDropdown: true,
    dropdownType: "genres",
  },
  { id: "bang-xep-hang", label: "Bảng Xếp Hạng", href: "/bang-xep-hang" },
  { id: "dien-dan", label: "Diễn Đàn", href: "/dien-dan" },
];

export const DEFAULT_GENRES: GenreItem[] = [
  { id: "tien-hiep", name: "Tiên Hiệp", count: "4.2k", href: "/the-loai/tien-hiep" },
  { id: "huyen-huyen", name: "Huyền Huyễn", count: "5.3k", href: "/the-loai/huyen-huyen" },
  { id: "do-thi", name: "Đô Thị", count: "3.1k", href: "/the-loai/do-thi" },
  { id: "ngon-tinh", name: "Ngôn Tình", count: "2.9k", href: "/the-loai/ngon-tinh" },
  { id: "trong-sinh", name: "Trọng Sinh", count: "2.0k", href: "/the-loai/trong-sinh" },
  { id: "kiem-hiep", name: "Kiếm Hiệp", count: "1.7k", href: "/the-loai/kiem-hiep" },
  { id: "khoa-huyen", name: "Khoa Huyễn", count: "0.9k", href: "/the-loai/khoa-huyen" },
  { id: "vong-du", name: "Võng Du", count: "1.3k", href: "/the-loai/vong-du" },
  { id: "di-gioi", name: "Dị Giới", count: "2.1k", href: "/the-loai/di-gioi" },
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
