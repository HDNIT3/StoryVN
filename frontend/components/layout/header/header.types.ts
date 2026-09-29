export interface GenreItem {
  id: string;
  name: string;
  count?: string | number;
  href: string;
}

export type GenreItemData = GenreItem;

export interface NavItem {
  id: string;
  label: string;
  href: string;
  isActive?: boolean;
  hasDropdown?: boolean;
  dropdownType?: "genres" | "custom";
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
  genres?: GenreItem[];
  isLoggedIn?: boolean;
  user?: UserProfile;
  wallet?: WalletInfo;
  bookmark?: BookmarkInfo;
  search?: HeaderSearchProps;
  onGenreClick?: (genre: GenreItem) => void;
  onNavItemClick?: (item: NavItem) => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  sticky?: boolean;
  className?: string;
}
