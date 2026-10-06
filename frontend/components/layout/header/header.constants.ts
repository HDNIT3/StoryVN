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
];

export const DEFAULT_GENRES: GenreItem[] = [
  { id: "tien-hiep", name: "Tiên Hiệp", count: "4.2k", href: "/?genre=tien-hiep" },
  { id: "huyen-huyen", name: "Huyền Huyễn", count: "5.3k", href: "/?genre=huyen-huyen" },
  { id: "do-thi", name: "Đô Thị", count: "3.1k", href: "/?genre=do-thi" },
  { id: "ngon-tinh", name: "Ngôn Tình", count: "2.9k", href: "/?genre=ngon-tinh" },
  { id: "trong-sinh", name: "Trọng Sinh", count: "2.0k", href: "/?genre=trong-sinh" },
  { id: "kiem-hiep", name: "Kiếm Hiệp", count: "1.7k", href: "/?genre=kiem-hiep" },
  { id: "khoa-huyen", name: "Khoa Huyễn", count: "0.9k", href: "/?genre=khoa-huyen" },
  { id: "vong-du", name: "Võng Du", count: "1.3k", href: "/?genre=vong-du" },
  { id: "di-gioi", name: "Dị Giới", count: "2.1k", href: "/?genre=di-gioi" },
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
  count: 0,
  iconSrc: "/icon/bookmark.svg",
  href: "/ho-so",
};

export const DEFAULT_USER: UserProfile = {
  name: "Hoàng",
  avatarInitial: "H",
  avatarUrl: "/image/avatar-h.svg",
  role: "Độc giả VIP",
};
